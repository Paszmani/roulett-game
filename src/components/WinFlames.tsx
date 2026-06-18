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
  size: number;
  delay: number;
  rise: number;
  drift: number;
}

function Ember({ left, size, delay, rise, drift }: EmberConfig) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: rise, easing: Easing.out(Easing.quad) }), -1, false),
    );
    return () => cancelAnimation(p);
  }, [p, delay, rise]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -200 * p.value }, { translateX: drift * p.value }],
    opacity: 0.9 * (1 - p.value),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', bottom: 60, left, width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFB347' },
        style,
      ]}
    />
  );
}

/**
 * Camada de chamas e brasas para a celebração de vitória.
 * Renderizada atrás do conteúdo (ex.: dentro do modal de resultado).
 * Só monta quando `active` é true — ao desmontar, as animações param.
 */
export function WinFlames({ active }: { active: boolean }) {
  const { width } = useWindowDimensions();

  const flames = useMemo<FlameConfig[]>(() => {
    const count = Math.min(16, Math.max(8, Math.round(width / 48)));
    const arr: FlameConfig[] = [];
    for (let i = 0; i < count; i++) {
      const w = 44 + Math.random() * 64;
      arr.push({
        id: i,
        width: w,
        height: w * 1.7,
        left: (i / Math.max(1, count - 1)) * (width - w),
        bottom: 14 + Math.random() * 26,
        delay: Math.random() * 220,
        period: 280 + Math.random() * 280,
      });
    }
    return arr;
  }, [width]);

  const embers = useMemo<EmberConfig[]>(() => {
    const arr: EmberConfig[] = [];
    for (let i = 0; i < 18; i++) {
      arr.push({
        id: i,
        left: width * (0.1 + Math.random() * 0.8),
        size: 3 + Math.random() * 5,
        delay: Math.random() * 1600,
        rise: 1500 + Math.random() * 1600,
        drift: (Math.random() - 0.5) * 90,
      });
    }
    return arr;
  }, [width]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* Brilho quente na base */}
      <View style={styles.glow} />
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
  glow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 220,
    backgroundColor: 'rgba(255,120,40,0.16)',
  },
});
