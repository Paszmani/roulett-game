import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
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
import { arcPath, polarToCartesian, segmentMidAngle, wedgeBBox } from '@/utils/geometry';
import { readableTextColor } from '@/utils/colors';
import { computeSpin } from '@/domain/roulette';

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
  isSpinning: boolean;
  /** Texto das fatias na vertical (radial, ao longo do raio). */
  verticalText: boolean;
  pointerType: PointerType;
  pointerEmoji?: string;
  pointerImage?: string;
  onSpinStart: () => void;
  onSpinEnd: (winnerIndex: number) => void;
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
    isSpinning,
    verticalText,
    pointerType,
    pointerEmoji,
    pointerImage,
    onSpinStart,
    onSpinEnd,
  },
  ref,
) {
  const rotation = useSharedValue(0);
  const count = segments.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;
  const seg = 360 / count;

  const animatedProps = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useImperativeHandle(ref, () => ({
    spin() {
      if (isSpinning || count < 2) return;
      const { targetRotation, winnerIndex } = computeSpin(rotation.value, count);
      onSpinStart();
      rotation.value = withTiming(
        targetRotation,
        { duration: durationMs, easing: Easing.out(Easing.cubic) },
        (finished) => {
          'worklet';
          if (finished) runOnJS(onSpinEnd)(winnerIndex);
        },
      );
    },
  }));

  // Conteúdo estático do SVG memoizado: não recalcula a cada giro (otimização).
  const wheelContent = useMemo(() => {
    const labelSize = Math.max(11, size * 0.045);
    return (
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Máscaras de recorte: cada imagem é limitada ao formato da sua fatia. */}
        <Defs>
          {segments.map((s, i) =>
            s.image ? (
              <ClipPath id={`clip-${s.id}`} key={`clip-${s.id}`}>
                <Path d={arcPath(cx, cy, radius, i * seg, i * seg + seg)} />
              </ClipPath>
            ) : null,
          )}
        </Defs>

        {segments.map((s, i) => {
          const start = i * seg;
          const end = start + seg;
          const mid = segmentMidAngle(i, count);
          const labelPos = polarToCartesian(cx, cy, radius * 0.62, mid);
          const path = arcPath(cx, cy, radius, start, end);
          const hasImage = !!s.image;
          const bbox = hasImage ? wedgeBBox(cx, cy, radius, start, end) : null;
          const rot = labelRotation(mid, verticalText);
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

              {s.label ? (
                <SvgText
                  x={labelPos.x}
                  y={labelPos.y}
                  fill={hasImage ? '#FFFFFF' : readableTextColor(s.color)}
                  stroke={hasImage ? '#0F172A' : undefined}
                  strokeWidth={hasImage ? 0.7 : undefined}
                  fontSize={labelSize}
                  fontFamily={fontFamily}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  transform={`rotate(${rot} ${labelPos.x} ${labelPos.y})`}
                >
                  {s.label.length > 14 ? `${s.label.slice(0, 13)}…` : s.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}

        {/* Cubo central */}
        <Circle cx={cx} cy={cy} r={radius * 0.12} fill="#0F172A" />
        <Circle cx={cx} cy={cy} r={radius * 0.08} fill={pointerColor} />
      </Svg>
    );
  }, [segments, size, fontFamily, verticalText, pointerColor, cx, cy, radius, seg, count]);

  // Ponteiro: imagem, emoji ou seta padrão.
  const ptSize = Math.max(30, size * 0.12);
  const useImage = pointerType === 'image' && !!pointerImage;
  const useEmoji = pointerType === 'emoji' && !!pointerEmoji;
  const isCustom = useImage || useEmoji;

  return (
    <View style={{ width: size, height: size }}>
      {/* Ponteiro fixo no topo (não gira) */}
      <View style={[styles.pointer, { top: isCustom ? -ptSize * 0.55 : -2 }]} pointerEvents="none">
        {useImage ? (
          <Image
            source={{ uri: pointerImage }}
            style={{ width: ptSize, height: ptSize }}
            resizeMode="contain"
          />
        ) : useEmoji ? (
          <Text style={{ fontSize: ptSize, lineHeight: ptSize * 1.1 }}>{pointerEmoji}</Text>
        ) : (
          <Svg width={36} height={28} viewBox="0 0 36 28">
            <Path d="M18 28 L2 2 L34 2 Z" fill={pointerColor} />
          </Svg>
        )}
      </View>

      <Animated.View style={animatedProps}>{wheelContent}</Animated.View>
    </View>
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
});
