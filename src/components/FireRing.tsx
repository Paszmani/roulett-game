import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';

/**
 * Aro de fogo CONTÍNUO ao redor da roleta (fase 1 do efeito "Chamas"). Em vez de
 * chamas soltas espetadas, o fogo é uma faixa coesa: um brilho radial contínuo
 * na borda + duas "coroas" de chama onduladas (um anel de línguas sem intervalos)
 * que oscilam em direções opostas, dando vida sem girar. A roda gira por dentro.
 *
 * Técnica: SVG (Path/Circle/gradientes) + transforms na thread de UI via
 * Reanimated — garantida em Android, Web/PWA e Electron (sem Skia/Lottie).
 *
 * Ao entrar em `extinguishing`, o aro RECOLHE para dentro e some, sincronizado
 * com a espuma do ExtinguishOverlay.
 */

function polar(cx: number, cy: number, r: number, a: number): [number, number] {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

/**
 * Anel ondulado (coroa de chamas) como UM path fechado com furo interno
 * (fillRule evenodd). `tips` línguas: cada uma é uma corcova (vale→pico→vale) via
 * curva quadrática — o contorno externo fica contínuo, sem intervalos.
 */
function crownPath(
  cx: number,
  cy: number,
  rInner: number,
  rBase: number,
  rTip: number,
  tips: number,
  phase: number,
): string {
  const step = (Math.PI * 2) / tips;
  let d = '';
  for (let i = 0; i < tips; i++) {
    const a0 = phase + i * step; // vale inicial
    const am = a0 + step * 0.5; // ponta da língua
    const a1 = a0 + step; // vale final
    const [vx0, vy0] = polar(cx, cy, rBase, a0);
    const [px, py] = polar(cx, cy, rTip, am);
    const [vx1, vy1] = polar(cx, cy, rBase, a1);
    // Controles perto do eixo da ponta e em raio baixo: as laterais sobem quase
    // retas e convergem numa PONTA afiada (barriga levemente côncava = chama).
    const [c0x, c0y] = polar(cx, cy, rBase * 1.04, am - step * 0.14);
    const [c1x, c1y] = polar(cx, cy, rBase * 1.04, am + step * 0.14);
    if (i === 0) d += `M ${vx0.toFixed(2)} ${vy0.toFixed(2)} `;
    d += `Q ${c0x.toFixed(2)} ${c0y.toFixed(2)} ${px.toFixed(2)} ${py.toFixed(2)} `; // vale → ponta
    d += `Q ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${vx1.toFixed(2)} ${vy1.toFixed(2)} `; // ponta → vale
  }
  d += 'Z ';
  // Furo interno (círculo no sentido oposto) → o preenchimento vira anel.
  const seg = 40;
  const [ix, iy] = polar(cx, cy, rInner, 0);
  d += `M ${ix.toFixed(2)} ${iy.toFixed(2)} `;
  for (let i = 1; i <= seg; i++) {
    const [x, y] = polar(cx, cy, rInner, -(i / seg) * Math.PI * 2);
    d += `L ${x.toFixed(2)} ${y.toFixed(2)} `;
  }
  d += 'Z';
  return d;
}

interface CrownProps {
  side: number;
  cx: number;
  cy: number;
  rInner: number;
  rBase: number;
  rTip: number;
  tips: number;
  phase: number;
  swayDeg: number;
  period: number;
  gradId: string;
  extinguishing: boolean;
}

function Crown({ side, cx, cy, rInner, rBase, rTip, tips, phase, swayDeg, period, gradId, extinguishing }: CrownProps) {
  const t = useSharedValue(0);
  const die = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [t, period]);

  useEffect(() => {
    if (extinguishing) {
      die.value = withTiming(1, { duration: 520, easing: Easing.in(Easing.quad) });
    }
    return () => cancelAnimation(die);
  }, [extinguishing, die]);

  const d = useMemo(
    () => crownPath(cx, cy, rInner, rBase, rTip, tips, phase),
    [cx, cy, rInner, rBase, rTip, tips, phase],
  );

  const style = useAnimatedStyle(() => {
    'worklet';
    const alive = 1 - die.value;
    const sway = (t.value - 0.5) * 2 * swayDeg; // oscila ±swayDeg (cintila sem girar)
    return {
      opacity: (0.72 + 0.28 * t.value) * alive,
      transform: [{ rotate: `${sway}deg` }, { scale: (0.98 + 0.05 * t.value) * (1 - 0.5 * die.value) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: side, height: side, transformOrigin: `${cx}px ${cy}px` }, style]}
    >
      <Svg width={side} height={side}>
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FFF3B0" />
            <Stop offset="0.5" stopColor="#FF8A3D" />
            <Stop offset="1" stopColor="#E0392B" />
          </LinearGradient>
        </Defs>
        <Path d={d} fill={`url(#${gradId})`} fillRule="evenodd" />
      </Svg>
    </Animated.View>
  );
}

interface FireRingProps {
  /** Diâmetro da roleta (px). O aro se ajusta a esse tamanho. */
  size: number;
  /** Monta o aro (deve valer durante o giro). */
  active: boolean;
  /** Dispara o recolhimento/extinção do aro. */
  extinguishing?: boolean;
}

export function FireRing({ size, active, extinguishing = false }: FireRingProps) {
  const geom = useMemo(() => {
    const R = size / 2;
    const side = Math.ceil(size * 1.36);
    const cx = side / 2;
    const cy = side / 2;
    return {
      side,
      cx,
      cy,
      R,
      rInner: R * 0.98, // base do fogo pega a borda da roda
      rBase: R * 1.03, // vales logo fora do aro
      rTip: R * 1.2, // pontas das línguas (afiadas)
      glowR: R * 1.22,
    };
  }, [size]);

  // Brilho radial contínuo do aro (some na extinção).
  const glowDie = useSharedValue(0);
  useEffect(() => {
    if (extinguishing) glowDie.value = withTiming(1, { duration: 480, easing: Easing.in(Easing.quad) });
    return () => cancelAnimation(glowDie);
  }, [extinguishing, glowDie]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 1 - glowDie.value }));

  if (!active || size <= 0) return null;

  const { side, cx, cy, R, rInner, rBase, rTip, glowR } = geom;

  return (
    <View pointerEvents="none" style={{ width: side, height: side, alignItems: 'center', justifyContent: 'center' }}>
      {/* Brilho radial contínuo + aro-base luminoso (a "chama única"). */}
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: side, height: side }, glowStyle]}>
        <Svg width={side} height={side}>
          <Defs>
            <RadialGradient id="fire-ring-glow" cx={cx} cy={cy} r={glowR} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFB43C" stopOpacity="0" />
              <Stop offset={`${(R * 0.7) / glowR}`} stopColor="#FFDD88" stopOpacity="0" />
              <Stop offset={`${(R * 0.9) / glowR}`} stopColor="#FFC24A" stopOpacity="0.45" />
              <Stop offset={`${R / glowR}`} stopColor="#FF7A2E" stopOpacity="0.75" />
              <Stop offset={`${(R * 1.08) / glowR}`} stopColor="#E0392B" stopOpacity="0.4" />
              <Stop offset="1" stopColor="#E0392B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={glowR} fill="url(#fire-ring-glow)" />
          {/* Aro-base sólido quente selando a borda da roda. */}
          <Circle cx={cx} cy={cy} r={R * 1.01} stroke="#FF8A3D" strokeWidth={Math.max(3, size * 0.02)} strokeOpacity={0.7} fill="none" />
        </Svg>
      </Animated.View>

      {/* Duas coroas de chama onduladas (contínuas), oscilando em oposição. */}
      <Crown
        side={side}
        cx={cx}
        cy={cy}
        rInner={rInner}
        rBase={rBase}
        rTip={rTip}
        tips={Math.max(20, Math.round(size / 26))}
        phase={0}
        swayDeg={3.5}
        period={520}
        gradId="fire-crown-a"
        extinguishing={extinguishing}
      />
      <Crown
        side={side}
        cx={cx}
        cy={cy}
        rInner={rInner}
        rBase={rBase * 1.01}
        rTip={rTip * 0.9}
        tips={Math.max(26, Math.round(size / 20))}
        phase={Math.PI / 7}
        swayDeg={-4.5}
        period={360}
        gradId="fire-crown-b"
        extinguishing={extinguishing}
      />
    </View>
  );
}
