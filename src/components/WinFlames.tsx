import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const FLAME_D =
  'M50,160 C18,140 10,96 30,60 C38,46 34,30 50,0 C66,30 62,46 70,60 C90,96 82,140 50,160 Z';

const EMBER_COLORS = ['#FFD166', '#FFB347', '#FF8A3D', '#FF6B35'];

interface FlameConfig {
  id: number;
  left: number;
  bottom: number;
  width: number;
  height: number;
  delay: number;
  period: number;
}

function Flame({ left, bottom, width, height, delay, period, id }: FlameConfig) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: period, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(t);
  }, [t, delay, period]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -10 * t.value },
      { scaleY: 0.88 + 0.34 * t.value },
      { scaleX: 1.1 - 0.22 * t.value },
    ],
    opacity: 0.8 + 0.2 * t.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left, bottom, width, height, transformOrigin: 'bottom' }, style]}
    >
      <Svg width={width} height={height} viewBox="0 0 100 160">
        <Defs>
          <LinearGradient id={`flame-${id}`} x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#FFF3B0" />
            <Stop offset="0.45" stopColor="#FF8A3D" />
            <Stop offset="1" stopColor="#E0392B" />
          </LinearGradient>
        </Defs>
        <Path d={FLAME_D} fill={`url(#flame-${id})`} />
      </Svg>
    </Animated.View>
  );
}

interface EmberConfig {
  id: number;
  left: number;
  startBottom: number;
  size: number;
  delay: number;
  rise: number;
  travel: number;
  drift: number;
  color: string;
  maxOpacity: number;
}

/** Brasa que sobe e some — agora pode nascer em qualquer altura da tela. */
function Ember({ left, startBottom, size, delay, rise, travel, drift, color, maxOpacity }: EmberConfig) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: rise, easing: Easing.out(Easing.quad) }), -1, false),
    );
    return () => cancelAnimation(p);
  }, [p, delay, rise]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: -travel * p.value },
      { translateX: drift * p.value },
      { scale: 1 - 0.45 * p.value },
    ],
    // Fade-in rápido + fade-out longo → brilha e some sem "piscar".
    opacity: maxOpacity * Math.min(1, p.value * 6) * (1 - p.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', bottom: startBottom, left, width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        style,
      ]}
    />
  );
}

/**
 * Camada de chamas e brasas para a celebração de vitória.
 * Ocupa a tela inteira: brasas sobem por toda a altura, chamas em duas
 * camadas cobrem a largura na base e há brilho quente no topo e no rodapé.
 * Só monta quando `active` é true — ao desmontar, as animações param.
 *
 * Otimização: contagens dimensionadas pela ÁREA (não estouram em telas
 * grandes), transforms 100% na thread de UI (reanimated) e nós leves
 * (Views para brasas/brilho, SVG só nas chamas).
 */
export function WinFlames({ active }: { active: boolean }) {
  const { width, height } = useWindowDimensions();

  // Chamas em duas camadas: base alta cobrindo a largura + camada de trás menor.
  const flames = useMemo<FlameConfig[]>(() => {
    const front = Math.min(18, Math.max(9, Math.round(width / 44)));
    const back = Math.max(5, Math.round(front * 0.6));
    const arr: FlameConfig[] = [];
    for (let i = 0; i < front; i++) {
      const w = 52 + Math.random() * 78;
      arr.push({
        id: i,
        width: w,
        height: w * 1.85,
        left: (i / Math.max(1, front - 1)) * (width - w),
        bottom: 8 + Math.random() * 22,
        delay: Math.random() * 240,
        period: 260 + Math.random() * 300,
      });
    }
    // Camada de trás: chamas menores e levemente acima, dão profundidade.
    for (let i = 0; i < back; i++) {
      const w = 34 + Math.random() * 46;
      arr.push({
        id: 100 + i,
        width: w,
        height: w * 1.7,
        left: Math.random() * (width - w),
        bottom: 26 + Math.random() * 40,
        delay: Math.random() * 320,
        period: 300 + Math.random() * 320,
      });
    }
    return arr;
  }, [width]);

  // Brasas espalhadas por TODA a tela (nascem em alturas variadas).
  const embers = useMemo<EmberConfig[]>(() => {
    const count = Math.min(46, Math.max(18, Math.round((width * height) / 24000)));
    const arr: EmberConfig[] = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        id: i,
        left: width * (0.04 + Math.random() * 0.92),
        // Nasce em qualquer ponto da metade inferior↑ até o topo.
        startBottom: Math.random() * (height * 0.92),
        size: 3 + Math.random() * 6,
        delay: Math.random() * 2400,
        rise: 1400 + Math.random() * 1800,
        travel: 120 + Math.random() * 260,
        drift: (Math.random() - 0.5) * 120,
        color: EMBER_COLORS[i % EMBER_COLORS.length],
        maxOpacity: 0.55 + Math.random() * 0.4,
      });
    }
    return arr;
  }, [width, height]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Tinta quente sutil cobrindo a tela toda */}
      <View style={styles.tint} />
      {/* Brilho quente na base (mais intenso) */}
      <View style={styles.glowBottom} />
      {/* Leve calor no topo, para o fogo "preencher" a tela */}
      <View style={styles.glowTop} />
      {embers.map((e) => (
        <Ember key={`e-${e.id}`} {...e} />
      ))}
      {flames.map((f) => (
        <Flame key={`f-${f.id}`} {...f} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tint: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,90,20,0.06)' },
  glowBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    backgroundColor: 'rgba(255,120,40,0.18)',
  },
  glowTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 160,
    backgroundColor: 'rgba(255,140,50,0.08)',
  },
});
