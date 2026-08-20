import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { WinFlames } from '@/components/WinFlames';

/**
 * Fogo do plano de fundo durante o giro (fase 1a do efeito "Chamas"), reusando
 * a camada de chamas/brasas do WinFlames. Quando `extinguishing` vira true — a
 * roleta parou e os extintores entram —, o fundo se APAGA junto: as chamas
 * baixam e somem, em sincronia com o jato de espuma do ExtinguishOverlay.
 */
export function FireBackground({ extinguishing }: { extinguishing: boolean }) {
  const die = useSharedValue(0);

  useEffect(() => {
    if (extinguishing) {
      die.value = withTiming(1, { duration: 620, easing: Easing.in(Easing.quad) });
    }
    return () => cancelAnimation(die);
  }, [extinguishing, die]);

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      opacity: 1 - die.value,
      transform: [{ translateY: 40 * die.value }, { scaleY: 1 - 0.35 * die.value }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transformOrigin: 'bottom' }, style]}>
      <WinFlames active />
    </Animated.View>
  );
}
