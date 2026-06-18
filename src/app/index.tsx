import { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRoulette } from '@/contexts/RouletteContext';
import { Wheel, type WheelHandle } from '@/components/Wheel';
import { ResultModal } from '@/components/ResultModal';
import { FONT_FAMILIES } from '@/constants/theme';

export default function HomeScreen() {
  const { config, palette } = useRoulette();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const wheelRef = useRef<WheelHandle>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [resultOpen, setResultOpen] = useState(false);

  const fontFamily = FONT_FAMILIES[config.fontFamily];

  // Altura responsiva da logo (limitada para não competir com a roleta).
  const logoHeight = Math.min(Math.max(height * 0.12, 64), 130);

  // Dimensiona a roleta de forma responsiva. Dois limites garantem que a roda
  // nunca estoure o layout: largura disponível e um teto de altura (menor
  // quando há logo no topo). `wheelScale` (0.6–1.0) ajusta dentro desse espaço,
  // com base mais generosa para a roda poder ficar bem maior no 100%.
  const horizontalCap = Math.min(width, 560) - 24;
  const verticalCap = height * (config.logo ? 0.5 : 0.6);
  const wheelSize = Math.min(horizontalCap, verticalCap) * config.wheelScale;

  function triggerHaptic() {
    if (config.hapticsEnabled && Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
  }

  const backgroundColor = config.backgroundColor ?? palette.background;

  return (
    <View style={[styles.root, { backgroundColor }]}>
      {/* Imagem de fundo (tem prioridade sobre a cor) */}
      {config.backgroundImage ? (
        <Image source={{ uri: config.backgroundImage }} style={styles.bgImage} resizeMode="cover" />
      ) : null}

      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
        <View style={styles.topBar}>
          {/* Espaçador (mesma largura do botão) para o título ficar centralizado */}
          <View style={styles.iconBtn} />
          <Text style={[styles.title, { color: palette.text, fontFamily }]} numberOfLines={1}>
            {config.title}
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
          >
            <Text style={[styles.iconText, { color: palette.text }]}>⚙︎</Text>
          </Pressable>
        </View>

        {/* Logo entre o título e a roleta */}
        {config.logo ? (
          <Image
            source={{ uri: config.logo }}
            style={[styles.logo, { height: logoHeight }]}
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.wheelArea}>
          <Wheel
            ref={wheelRef}
            size={wheelSize}
            segments={config.segments}
            fontFamily={fontFamily}
            durationMs={config.spinDurationMs}
            pointerColor={palette.pointer}
            isSpinning={isSpinning}
            verticalText={config.verticalText}
            pointerType={config.pointerType}
            pointerEmoji={config.pointerEmoji}
            pointerImage={config.pointerImage}
            onSpinStart={() => {
              setIsSpinning(true);
              setResultOpen(false);
            }}
            onSpinEnd={(idx) => {
              setIsSpinning(false);
              setWinnerIndex(idx);
              setResultOpen(true);
              triggerHaptic();
            }}
          />
        </View>

        <Pressable
          onPress={() => wheelRef.current?.spin()}
          disabled={isSpinning}
          style={[
            styles.spinButton,
            { backgroundColor: palette.primary, opacity: isSpinning ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.spinText, { color: palette.primaryText, fontFamily }]}>
            {isSpinning ? 'Girando…' : 'GIRAR'}
          </Text>
        </Pressable>
      </View>

      <ResultModal
        visible={resultOpen}
        segment={winnerIndex != null ? config.segments[winnerIndex] ?? null : null}
        palette={palette}
        fontFamily={fontFamily}
        onClose={() => setResultOpen(false)}
      />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingVertical: 16, alignItems: 'center', justifyContent: 'space-between', gap: 16, width: '100%', maxWidth: 640, alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  title: { fontSize: 26, flex: 1, textAlign: 'center' },
  logo: { width: '100%', maxWidth: 320, alignSelf: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 20 },
  wheelArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  spinButton: { width: '100%', maxWidth: 320, paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
  spinText: { fontSize: 20, letterSpacing: 2 },
});
