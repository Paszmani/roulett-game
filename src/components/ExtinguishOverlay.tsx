import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/**
 * Fase de PARADA do efeito "Chamas": extintores apagam o fogo antes do resultado.
 * Dois bocais nos cantos inferiores disparam um leque de espuma em direção ao
 * centro (onde está a roleta), enquanto vapor sobe e um clarão branco sela a
 * extinção. Ao fim de DURATION, chama `onDone` — o index revela o resultado.
 *
 * Tudo em View + Reanimated (sem SVG pesado): roda liso em Android/Web/Electron.
 */

const DURATION = 900;

function useProgress(delay: number, duration: number) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.quad) }));
    return () => cancelAnimation(p);
  }, [p, delay, duration]);
  return p;
}

interface FoamCfg {
  id: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  size: number;
  delay: number;
  duration: number;
}

function Foam({ x, y, dx, dy, size, delay, duration }: FoamCfg) {
  const p = useProgress(delay, duration);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    return {
      opacity: Math.min(1, t * 6) * (1 - Math.max(0, (t - 0.5) / 0.5)),
      transform: [{ translateX: dx * t }, { translateY: dy * t }, { scale: 0.3 + 1.15 * t }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: '#F4F8FF' },
        style,
      ]}
    />
  );
}

interface SteamCfg {
  id: number;
  x: number;
  y: number;
  rise: number;
  drift: number;
  size: number;
  delay: number;
  duration: number;
}

function Steam({ x, y, rise, drift, size, delay, duration }: SteamCfg) {
  const p = useProgress(delay, duration);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    return {
      opacity: Math.min(1, t * 4) * (1 - t) * 0.5,
      transform: [{ translateY: -rise * t }, { translateX: drift * t }, { scale: 0.6 + 1.7 * t }],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(214,216,222,1)' },
        style,
      ]}
    />
  );
}

/** Clarão branco no centro que sela a extinção (aparece e some rápido). */
function Bloom({ x, y, size }: { x: number; y: number; size: number }) {
  const p = useProgress(120, 320);
  const style = useAnimatedStyle(() => {
    'worklet';
    const t = p.value;
    return { opacity: (1 - t) * 0.5, transform: [{ scale: 0.5 + t }] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: size / 2, backgroundColor: '#FFFFFF' },
        style,
      ]}
    />
  );
}

interface ExtinguishOverlayProps {
  active: boolean;
  /** Centro do alvo (a roleta). Padrão: centro da tela. */
  targetX?: number;
  targetY?: number;
  onDone: () => void;
}

export function ExtinguishOverlay({ active, targetX, targetY, onDone }: ExtinguishOverlayProps) {
  const { width, height } = useWindowDimensions();
  const cx = targetX ?? width / 2;
  const cy = targetY ?? height / 2;

  // `onDone` num ref: agenda o encerramento UMA vez no mount, sem depender da
  // identidade do callback (evita reagendar a cada render do pai).
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => doneRef.current(), DURATION);
    return () => clearTimeout(timer);
  }, [active]);

  // Dois bocais nos cantos inferiores, mirando o centro em leque.
  const foam = useMemo<FoamCfg[]>(() => {
    if (!active) return [];
    const nozzles = [
      { x: width * 0.08, y: height * 0.94 },
      { x: width * 0.92, y: height * 0.94 },
    ];
    const perNozzle = Math.min(20, Math.max(10, Math.round(width / 60)));
    const arr: FoamCfg[] = [];
    let id = 0;
    for (const n of nozzles) {
      for (let i = 0; i < perNozzle; i++) {
        const spread = (i / (perNozzle - 1) - 0.5) * 0.6; // leque
        const tx = cx + spread * width * 0.5 + (Math.random() - 0.5) * 60;
        const ty = cy + (Math.random() - 0.5) * 80;
        arr.push({
          id: id++,
          x: n.x,
          y: n.y,
          dx: tx - n.x,
          dy: ty - n.y,
          size: 26 + Math.random() * 40,
          delay: Math.random() * 160,
          duration: 420 + Math.random() * 200,
        });
      }
    }
    return arr;
  }, [active, width, height, cx, cy]);

  const steam = useMemo<SteamCfg[]>(() => {
    if (!active) return [];
    const count = Math.min(22, Math.max(10, Math.round(width / 55)));
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: cx + (Math.random() - 0.5) * width * 0.5,
      y: cy + (Math.random() - 0.3) * height * 0.25,
      rise: 120 + Math.random() * 220,
      drift: (Math.random() - 0.5) * 90,
      size: 40 + Math.random() * 70,
      delay: 220 + Math.random() * 320,
      duration: 500 + Math.random() * 300,
    }));
  }, [active, width, height, cx, cy]);

  if (!active) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {steam.map((s) => (
        <Steam key={`s-${s.id}`} {...s} />
      ))}
      <Bloom x={cx} y={cy} size={Math.min(width, height) * 0.7} />
      {foam.map((f) => (
        <Foam key={`f-${f.id}`} {...f} />
      ))}
    </View>
  );
}
