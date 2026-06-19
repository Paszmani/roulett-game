import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import type { WinAnimationType } from '@/types';
import { WinFlames } from '@/components/WinFlames';

/**
 * Camada de celebração de vitória (partículas em react-native-reanimated).
 * Funciona em Android e Web (PWA) sem Skia/Lottie. Monta só quando `active`.
 * Cada partícula tem um shared value linear (0→1) e calcula sua trajetória
 * no worklet — assim variamos física por tipo sem múltiplas animações.
 */

const CONFETTI_COLORS = ['#FF5470', '#FF9E3D', '#FFD23F', '#37D67A', '#36A4FF', '#9B6BFF'];
const FIREWORK_COLORS = ['#FFD23F', '#FF5470', '#36A4FF', '#37D67A', '#FF9E3D', '#FFFFFF'];

interface BaseCfg {
  id: number;
  delay: number;
  duration: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  rot: number;
  size: number;
  color: string;
  extra: number; // uso livre por tipo (giros / gravidade)
}

function useProgress(delay: number, duration: number) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.linear }));
    return () => cancelAnimation(p);
  }, [p, delay, duration]);
  return p;
}

function Confetti(c: BaseCfg) {
  const p = useProgress(c.delay, c.duration);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    return {
      opacity: t > 0.85 ? (1 - t) / 0.15 : 1,
      transform: [
        { translateX: c.dx * t },
        { translateY: c.dy * (t * t * 0.6 + t * 0.4) },
        { rotate: `${c.rot * t}deg` },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: c.startX, top: c.startY, width: c.size, height: c.size * 1.6, borderRadius: 2, backgroundColor: c.color }, style]}
    />
  );
}

function Spark(c: BaseCfg) {
  const p = useProgress(c.delay, c.duration);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    const eo = 1 - (1 - t) * (1 - t);
    return {
      opacity: 1 - t,
      transform: [
        { translateX: c.dx * eo },
        { translateY: c.dy * eo + c.extra * t * t },
        { scale: 1 - 0.4 * t },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: c.startX, top: c.startY, width: c.size, height: c.size, borderRadius: c.size / 2, backgroundColor: c.color }, style]}
    />
  );
}

function Coin(c: BaseCfg) {
  const p = useProgress(c.delay, c.duration);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    return {
      opacity: t > 0.88 ? (1 - t) / 0.12 : 1,
      transform: [
        { translateX: c.dx * t },
        { translateY: c.dy * (t * t * 0.7 + t * 0.3) },
        { scaleX: Math.cos(t * Math.PI * c.extra) },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: c.startX, top: c.startY, width: c.size, height: c.size, borderRadius: c.size / 2, backgroundColor: '#F5B731', borderWidth: 2, borderColor: '#C8881A' },
        style,
      ]}
    />
  );
}

function Glyph(c: BaseCfg & { glyph: string; rise?: boolean }) {
  const p = useProgress(c.delay, c.duration);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    const fadeIn = t < 0.2 ? t / 0.2 : 1;
    const fadeOut = t > 0.7 ? (1 - t) / 0.3 : 1;
    if (c.rise) {
      const up = 1 - (1 - t) * (1 - t);
      return {
        opacity: fadeIn * fadeOut,
        transform: [{ translateX: c.dx * Math.sin(t * Math.PI * 2) }, { translateY: -c.dy * up }, { scale: t < 0.25 ? t / 0.25 : 1 - (t - 0.25) * 0.2 }],
      };
    }
    const scale = t < 0.3 ? (t / 0.3) * 1.15 : 1.15 - (t - 0.3) * 0.5;
    return {
      opacity: fadeIn * fadeOut,
      transform: [{ translateY: -26 * t }, { scale }, { rotate: `${c.rot * t}deg` }],
    };
  });
  return (
    <Animated.Text
      pointerEvents="none"
      style={[{ position: 'absolute', left: c.startX, top: c.startY, fontSize: c.size, color: c.color, lineHeight: c.size * 1.1 }, style]}
    >
      {c.glyph}
    </Animated.Text>
  );
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function WinAnimation({ type, active }: { type: WinAnimationType; active: boolean }) {
  const { width, height } = useWindowDimensions();

  const cfgs = useMemo<BaseCfg[]>(() => {
    const arr: BaseCfg[] = [];
    if (type === 'confetti') {
      for (let i = 0; i < 48; i++)
        arr.push({ id: i, delay: rand(0, 500), duration: rand(1900, 3200), startX: rand(0, width), startY: -20, dx: rand(-90, 90), dy: height + 60, rot: rand(-540, 540), size: rand(7, 11), color: CONFETTI_COLORS[i % CONFETTI_COLORS.length], extra: 0 });
    } else if (type === 'fireworks') {
      const bursts = 4;
      for (let b = 0; b < bursts; b++) {
        const ox = rand(width * 0.2, width * 0.8);
        const oy = rand(height * 0.2, height * 0.55);
        for (let i = 0; i < 22; i++) {
          const ang = (i / 22) * Math.PI * 2;
          const dist = rand(70, 130);
          arr.push({ id: b * 100 + i, delay: b * 320 + rand(0, 60), duration: rand(800, 1150), startX: ox, startY: oy, dx: Math.cos(ang) * dist, dy: Math.sin(ang) * dist, rot: 0, size: 7, color: FIREWORK_COLORS[(i + b) % FIREWORK_COLORS.length], extra: 60 });
        }
      }
    } else if (type === 'stars') {
      for (let i = 0; i < 30; i++)
        arr.push({ id: i, delay: i * 40, duration: rand(1400, 2000), startX: rand(0, width), startY: rand(60, height * 0.7), dx: 0, dy: 0, rot: rand(-20, 20), size: rand(16, 30), color: '#FFD23F', extra: 0 });
    } else if (type === 'coins') {
      for (let i = 0; i < 28; i++)
        arr.push({ id: i, delay: rand(0, 500), duration: rand(1500, 2600), startX: rand(0, width), startY: -24, dx: rand(-40, 40), dy: height + 40, rot: 0, size: 22, color: '#F5B731', extra: rand(4, 8) });
    } else if (type === 'hearts') {
      for (let i = 0; i < 24; i++)
        arr.push({ id: i, delay: i * 70, duration: rand(2000, 2800), startX: rand(0, width), startY: height - 20, dx: rand(-44, 44), dy: height * 0.85, rot: 0, size: rand(18, 34), color: '#FF5470', extra: 0 });
    }
    return arr;
  }, [type, width, height]);

  if (!active) return null;
  if (type === 'fire') return <WinFlames active={active} />;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {cfgs.map((c) => {
        if (type === 'confetti') return <Confetti key={c.id} {...c} />;
        if (type === 'fireworks') return <Spark key={c.id} {...c} />;
        if (type === 'coins') return <Coin key={c.id} {...c} />;
        if (type === 'stars') return <Glyph key={c.id} {...c} glyph="★" />;
        if (type === 'hearts') return <Glyph key={c.id} {...c} glyph="♥" rise />;
        return null;
      })}
    </View>
  );
}
