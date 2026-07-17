import { forwardRef, useCallback, useImperativeHandle, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, {
  G,
  Path,
  Text as SvgText,
  Circle,
  Defs,
  ClipPath,
  Image as SvgImage,
} from 'react-native-svg';
import type { PointerType, Segment } from '@/types';
import { arcPath, polarToCartesian, wedgeBBox } from '@/utils/geometry';
import { readableTextColor } from '@/utils/colors';
import { computeSpin, segmentArcs } from '@/domain/roulette';

// ── Ajustes do giro por toque/arraste ───────────────────────────────────────
// A roleta segue o dedo (ângulo do toque em relação ao centro). Ao SOLTAR com
// impulso, dispara o MESMO giro do botão (withTiming + duração configurada +
// vencedor justo). O "flick" só decide SE houve giro, não a força dele.
const VELOCITY_BOOST = 1.30; // sensibilidade do flick (↑ = conta como giro mais fácil)
const MIN_FLICK_DEG_PER_S = 100; // abaixo disso é só um ajuste, não conta como giro
const MIN_TOUCH_RADIUS_SQ = 100; // ignora toques muito próximos do centro (instável)
// Fluidez do giro: pequeno overshoot + assentamento de volta à posição exata.
const SPIN_OVERSHOOT_DEG = 5; // quantos graus passa do alvo antes de assentar
const SPIN_SETTLE_MS = 420; // duração do "encaixe" final de volta ao vencedor
// ─────────────────────────────────────────────────────────────────────────────

export interface WheelHandle {
  /** Inicia o giro. Resolve com o índice vencedor ao terminar. */
  spin: () => void;
}

interface WheelProps {
  size: number;
  segments: Segment[];
  fontFamily: string;
  durationMs: number;
  pointerColor: string;
  /** Cor de fundo da tela — usada para o "entalhe" do ponteiro padrão. */
  backgroundColor: string;
  isSpinning: boolean;
  /** Texto das fatias na vertical (radial, ao longo do raio). */
  verticalText: boolean;
  /** Escala global do texto (config.textScale, default 1). */
  textScale: number;
  pointerType: PointerType;
  pointerEmoji?: string;
  pointerImage?: string;
  onSpinStart: () => void;
  onSpinEnd: (winnerIndex: number) => void;
}

/** Fração média da fonte ocupada por caractere (semibold, aproximação). */
const CHAR_WIDTH = 0.58;

/**
 * Tamanho de fonte que faz o rótulo CABER no espaço da fatia (auto-fit):
 * texto tangencial usa a corda do arco no raio do rótulo; texto radial usa o
 * comprimento útil do raio. Fatias estreitas e rótulos longos encolhem a
 * fonte antes de truncar.
 */
function fitLabel(
  label: string,
  arcDeg: number,
  radius: number,
  size: number,
  vertical: boolean,
  textScale: number,
): { fontSize: number; text: string } {
  const base = Math.max(11, size * 0.045);
  const floor = 8;
  const len = Math.max(1, label.length);

  const halfArcRad = (Math.min(arcDeg, 180) / 2) * (Math.PI / 180);
  // Largura disponível na direção em que o texto corre.
  const avail = vertical
    ? radius * 0.62 // ao longo do raio (entre o eixo central e a borda)
    : 2 * radius * 0.7 * Math.sin(halfArcRad) * 0.92; // corda no raio do rótulo
  // Na direção transversal, a fatia também limita a ALTURA da fonte.
  const cross = 2 * radius * (vertical ? 0.45 : 0.55) * Math.sin(halfArcRad);

  const fit = Math.min(avail / (len * CHAR_WIDTH), cross);
  const fontSize = Math.max(floor, Math.min(base, fit)) * textScale;

  // Última linha de defesa: trunca só o que nem no tamanho mínimo cabe.
  const maxChars = Math.floor(avail / (floor * textScale * CHAR_WIDTH));
  const text = label.length > maxChars && maxChars > 2 ? `${label.slice(0, maxChars - 1)}…` : label;
  return { fontSize, text };
}

/** Rotação do rótulo conforme orientação escolhida. */
function labelRotation(mid: number, vertical: boolean): number {
  if (!vertical) return mid;
  // Radial (ao longo do raio); inverte na metade esquerda/inferior p/ não ficar de cabeça pra baixo.
  let rot = mid - 90;
  if (mid > 90 && mid < 270) rot += 180;
  return rot;
}

export const Wheel = forwardRef<WheelHandle, WheelProps>(function Wheel(
  {
    size,
    segments,
    fontFamily,
    durationMs,
    pointerColor,
    backgroundColor,
    isSpinning,
    verticalText,
    textScale,
    pointerType,
    pointerEmoji,
    pointerImage,
    onSpinStart,
    onSpinEnd,
  },
  ref,
) {
  const rotation = useSharedValue(0);
  const prevAngle = useSharedValue(0); // ângulo do toque anterior (rad), p/ seguir o dedo
  const count = segments.length;
  const cx = size / 2;
  const cy = size / 2;
  // Aro fino e claro na borda externa; as fatias ficam logo dentro dele.
  const ringWidth = Math.max(3, size * 0.013);
  const radius = size / 2 - ringWidth - 2;
  // Pesos dos setores (default 1) e arcos proporcionais.
  const weights = useMemo(
    () => segments.map((s) => Math.max(0.1, s.weight ?? 1)),
    [segments],
  );
  const arcs = useMemo(() => segmentArcs(weights), [weights]);

  const animatedProps = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  // Giro padrão (usado pelo botão E pelo flick): várias voltas + vencedor justo.
  // Fluidez: desaceleração longa (ease-out tipo "expo") + pequeno overshoot que
  // assenta de volta na posição exata — sensação natural de roda real.
  const triggerSpin = useCallback(() => {
    if (isSpinning || count < 2) return;
    const { targetRotation, winnerIndex } = computeSpin(rotation.value, weights);
    // Voltas extras proporcionais à duração (~1,2 volta/segundo). Somar voltas
    // inteiras NÃO muda o vencedor, mas faz a roda girar o tempo todo — assim a
    // duração é PERCEBIDA, em vez de a roda chegar rápido e ficar rastejando.
    const extraTurns = Math.max(1, Math.round((durationMs / 1000) * 1.2));
    const target = targetRotation + extraTurns * 360;
    onSpinStart();
    rotation.value = withSequence(
      withTiming(target + SPIN_OVERSHOOT_DEG, {
        duration: durationMs,
        // Ease-out distribuído (cubic): a roda desacelera ao longo de TODA a
        // duração, sem o "salto e rastejo" do bezier anterior.
        easing: Easing.out(Easing.cubic),
      }),
      withTiming(
        target,
        { duration: SPIN_SETTLE_MS, easing: Easing.out(Easing.quad) },
        (finished) => {
          'worklet';
          if (finished) runOnJS(onSpinEnd)(winnerIndex);
        },
      ),
    );
  }, [isSpinning, count, weights, rotation, onSpinStart, onSpinEnd, durationMs]);

  useImperativeHandle(ref, () => ({ spin: triggerSpin }), [triggerSpin]);

  // Conteúdo estático do SVG memoizado: não recalcula a cada giro (otimização).
  const wheelContent = useMemo(() => {
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Máscaras de recorte: cada imagem é limitada ao formato da sua fatia. */}
        <Defs>
          {segments.map((s, i) =>
            s.image ? (
              <ClipPath id={`clip-${s.id}`} key={`clip-${s.id}`}>
                <Path d={arcPath(cx, cy, radius, arcs[i].start, arcs[i].end)} />
              </ClipPath>
            ) : null,
          )}
        </Defs>

        {segments.map((s, i) => {
          const { start, end, mid } = arcs[i];
          const path = arcPath(cx, cy, radius, start, end);
          const hasImage = !!s.image;
          const bbox = hasImage ? wedgeBBox(cx, cy, radius, start, end) : null;
          const rot = labelRotation(mid, verticalText);
          const fill = hasImage ? '#FFFFFF' : readableTextColor(s.color);
          const stroke = hasImage ? '#0F172A' : undefined;
          const strokeW = hasImage ? 0.7 : undefined;

          // Rótulo em UMA linha, com auto-fit (encolhe antes de truncar). No modo
          // vertical (radial) fica mais próximo do centro e se adapta ao espaço;
          // no tangencial, na posição usual.
          const textLines: { x: number; y: number; text: string; fontSize: number }[] = [];
          if (s.label) {
            const fitted = fitLabel(s.label, end - start, radius, size, verticalText, textScale);
            const labelR = radius * (verticalText ? 0.52 : 0.7);
            const p = polarToCartesian(cx, cy, labelR, mid);
            textLines.push({ x: p.x, y: p.y, text: fitted.text, fontSize: fitted.fontSize });
          }

          return (
            <G key={s.id}>
              {/* Cor de base (também serve de fundo caso a imagem tenha transparência). */}
              <Path d={path} fill={s.color} stroke="#0F172A" strokeWidth={1} />

              {/* Imagem preenchendo a fatia: "slice" cobre a área sem distorcer. */}
              {hasImage && bbox ? (
                <>
                  <SvgImage
                    href={s.image}
                    x={bbox.x}
                    y={bbox.y}
                    width={bbox.width}
                    height={bbox.height}
                    preserveAspectRatio="xMidYMid slice"
                    clipPath={`url(#clip-${s.id})`}
                  />
                  <Path d={path} fill="none" stroke="#0F172A" strokeWidth={1} />
                </>
              ) : null}

              {textLines.map((ln, li) => (
                <SvgText
                  key={li}
                  x={ln.x}
                  y={ln.y}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={strokeW}
                  fontSize={ln.fontSize}
                  fontFamily={fontFamily}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${rot} ${ln.x} ${ln.y})`}
                >
                  {ln.text}
                </SvgText>
              ))}
            </G>
          );
        })}

        {/* Aro fino e claro (estilo limpo) */}
        <Circle cx={cx} cy={cy} r={radius + ringWidth / 2} fill="none" stroke="#FFFFFF" strokeWidth={ringWidth} />
        <Circle cx={cx} cy={cy} r={radius + ringWidth} fill="none" stroke="#D7DBE2" strokeWidth={1} />
        <Circle cx={cx} cy={cy} r={radius} fill="none" stroke="#D7DBE2" strokeWidth={1} />
      </Svg>
    );
  }, [segments, arcs, size, fontFamily, verticalText, textScale, cx, cy, radius, ringWidth]);

  // Giro por toque/arraste (mesmo gesto no toque e no mouse/web).
  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!isSpinning && count >= 2)
        .onBegin((e) => {
          'worklet';
          cancelAnimation(rotation);
          // Coordenadas relativas ao centro (camada que NÃO gira → sentido estável).
          prevAngle.value = Math.atan2(e.y - cy, e.x - cx);
        })
        .onUpdate((e) => {
          'worklet';
          const a = Math.atan2(e.y - cy, e.x - cx);
          let delta = a - prevAngle.value;
          // Normaliza p/ [-π, π] (evita salto ao cruzar ±180°).
          if (delta > Math.PI) delta -= 2 * Math.PI;
          else if (delta < -Math.PI) delta += 2 * Math.PI;
          rotation.value += (delta * 180) / Math.PI; // a roleta segue o dedo
          prevAngle.value = a;
        })
        .onFinalize((e) => {
          'worklet';
          const rx = e.x - cx;
          const ry = e.y - cy;
          const r2 = rx * rx + ry * ry;
          // Velocidade angular (deg/s) do gesto — só para decidir se houve "flick".
          let angVel =
            r2 > MIN_TOUCH_RADIUS_SQ
              ? ((rx * e.velocityY - ry * e.velocityX) / r2) * (180 / Math.PI)
              : 0;
          angVel *= VELOCITY_BOOST;
          if (Math.abs(angVel) < MIN_FLICK_DEG_PER_S) return; // foi só um ajuste, não giro
          // Houve flick → gira igual ao botão (a partir da posição atual).
          runOnJS(triggerSpin)();
        }),
    [isSpinning, count, triggerSpin, rotation, prevAngle, cx, cy],
  );

  // Toque simples (sem arrastar) gira a roleta — o eixo central (↻) é o gatilho.
  const tapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!isSpinning && count >= 2)
        .maxDistance(14)
        .onEnd((_e, success) => {
          'worklet';
          if (success) runOnJS(triggerSpin)();
        }),
    [isSpinning, count, triggerSpin],
  );

  // Toque dispara o giro; arraste segue o dedo e o flick também gira.
  const wheelGesture = useMemo(
    () => Gesture.Race(panGesture, tapGesture),
    [panGesture, tapGesture],
  );

  // Ponteiro: imagem, emoji ou seta padrão.
  const ptSize = Math.max(30, size * 0.12);
  const useImage = pointerType === 'image' && !!pointerImage;
  const useEmoji = pointerType === 'emoji' && !!pointerEmoji;
  const isCustom = useImage || useEmoji;

  const notchW = size * 0.085;
  const notchH = size * 0.062;
  const hubSize = Math.max(44, radius * 0.34);
  const coloredTop = size / 2 - radius; // y do topo da área colorida

  return (
    <GestureDetector gesture={wheelGesture}>
      <View style={{ width: size, height: size }}>
        <Animated.View style={animatedProps}>{wheelContent}</Animated.View>

        {/* Ponteiro: imagem, emoji ou entalhe (recorte) no topo */}
        {isCustom ? (
          <View style={[styles.pointer, { top: -ptSize * 0.45 }]} pointerEvents="none">
            {useImage ? (
              <Image source={{ uri: pointerImage }} style={{ width: ptSize, height: ptSize }} resizeMode="contain" />
            ) : (
              <Text style={{ fontSize: ptSize, lineHeight: ptSize * 1.1 }}>{pointerEmoji}</Text>
            )}
          </View>
        ) : (
          <View style={[styles.pointer, { top: coloredTop - 2 }]} pointerEvents="none">
            <Svg width={notchW} height={notchH} viewBox="0 0 34 24">
              <Path d="M0 0 L34 0 L17 24 Z" fill={backgroundColor} stroke="#CFD4DC" strokeWidth={1.3} />
            </Svg>
          </View>
        )}

        {/* Eixo central fixo (não gira) com ícone de girar */}
        <View
          pointerEvents="none"
          style={[
            styles.hub,
            { width: hubSize, height: hubSize, borderRadius: hubSize / 2, top: cy - hubSize / 2, left: cx - hubSize / 2 },
          ]}
        >
          <Text style={{ fontSize: hubSize * 0.5, color: '#3A3F46', lineHeight: hubSize * 0.64 }}>↻</Text>
        </View>
      </View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  pointer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  hub: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E6EC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9,
  },
});
