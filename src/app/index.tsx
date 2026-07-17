import { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRoulette } from '@/contexts/RouletteContext';
import { Wheel, type WheelHandle } from '@/components/Wheel';
import { WinAnimation } from '@/components/WinAnimation';
import { LeadFormModal } from '@/components/LeadFormModal';
import { DEFAULT_LEAD_FIELDS } from '@/constants/defaults';
import { FONT_FAMILIES } from '@/constants/theme';
import { readableTextColor } from '@/utils/colors';

export default function HomeScreen() {
  const { config, palette } = useRoulette();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const wheelRef = useRef<WheelHandle>(null);

  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
  const [celebrateId, setCelebrateId] = useState(0);
  // Resultado central: aparece ao terminar o giro e some ao toque na tela.
  const [resultShown, setResultShown] = useState(false);
  // Formulário de lead: abre ao dispensar o resultado (se habilitado nas configs).
  const [leadVisible, setLeadVisible] = useState(false);

  const fontFamily = FONT_FAMILIES[config.fontFamily];
  const winner = winnerIndex != null ? config.segments[winnerIndex] : null;
  const textScale = config.textScale ?? 1;

  // Altura responsiva da logo (limitada para não competir com a roleta).
  const logoHeight = config.logo ? Math.min(Math.max(height * 0.1, 52), 104) : 0;

  // Dimensiona a roleta pela PROPORÇÃO real da tela: o diâmetro é a menor das
  // dimensões úteis (largura − margens, altura − topo/logo/folgas), SEM teto fixo
  // de pixels. Assim a roda ocupa a maior fração possível em qualquer dispositivo
  // (totem, tablet, celular) — em portrait fica limitada pela largura; em telas
  // baixas, pela altura. `wheelScale` (0.6–1.0) ainda permite reduzir.
  const SCREEN_MARGIN = 8;
  const RESERVED_V = 64 /* topo (título/engrenagem) */ + 40 /* folgas + safe */ + logoHeight;
  const availW = width - SCREEN_MARGIN * 2;
  const availH = height - RESERVED_V;
  const wheelSize = Math.max(0, Math.min(availW, availH)) * config.wheelScale;

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
          {/* Espaçador invisível (mesma largura do botão) para centralizar o título */}
          <View style={styles.iconSpacer} />
          <Text
            style={[styles.title, { color: palette.text, fontFamily, fontSize: 26 * textScale }]}
            numberOfLines={1}
          >
            {config.title}
          </Text>
          <Pressable
            onPress={() => router.push('/settings')}
            style={[styles.iconBtn, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}
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
            // toque no centro (↻), arraste ou flick giram a roda

            size={wheelSize}
            segments={config.segments}
            fontFamily={fontFamily}
            durationMs={config.spinDurationMs}
            pointerColor={palette.pointer}
            backgroundColor={backgroundColor}
            isSpinning={isSpinning}
            verticalText={config.verticalText}
            textScale={textScale}
            pointerType={config.pointerType}
            pointerEmoji={config.pointerEmoji}
            pointerImage={config.pointerImage}
            onSpinStart={() => {
              setIsSpinning(true);
              setResultShown(false);
            }}
            onSpinEnd={(idx) => {
              setIsSpinning(false);
              setWinnerIndex(idx);
              setCelebrateId((id) => id + 1);
              setResultShown(true);
              triggerHaptic();
            }}
          />
        </View>
      </View>

      </SafeAreaView>

      {/* Resultado central + celebração: cobre a tela e some ao toque. */}
      {resultShown ? (
        <Pressable
          style={styles.resultOverlay}
          onPress={() => {
            setResultShown(false);
            if (config.leadCaptureEnabled && winner) setLeadVisible(true);
          }}
        >
          {/* Animação de vitória atrás (não captura o toque) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <WinAnimation key={celebrateId} type={config.winAnimation} active />
          </View>

          {/* Card do resultado, centralizado (imagem da fatia + nome) */}
          {winner ? (
            <View style={[styles.resultCard, { backgroundColor: winner.color, borderRadius: palette.radius.card }]}>
              {winner.image ? (
                <Image
                  source={{ uri: winner.image }}
                  style={[styles.resultImage, { borderRadius: palette.radius.control }]}
                  resizeMode="contain"
                />
              ) : null}
              <Text
                style={[styles.resultLabel, { color: readableTextColor(winner.color), fontFamily, fontSize: 32 * textScale }]}
                numberOfLines={3}
              >
                {winner.label || '—'}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.resultHint, { color: '#FFFFFF', fontFamily }]}>toque para continuar</Text>
        </Pressable>
      ) : null}

      <LeadFormModal
        visible={leadVisible}
        fields={config.leadFields?.length ? config.leadFields : DEFAULT_LEAD_FIELDS}
        prizeLabel={winner?.label ?? ''}
        palette={palette}
        fontFamily={fontFamily}
        onClose={() => setLeadVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  bgImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  safe: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 6, paddingVertical: 8, alignItems: 'center', justifyContent: 'space-between', gap: 8, width: '100%', alignSelf: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  title: { fontSize: 26, flex: 1, textAlign: 'center' },
  logo: { width: '100%', maxWidth: 320, alignSelf: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconSpacer: { width: 44, height: 44 },
  iconText: { fontSize: 20 },
  wheelArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  resultCard: { paddingHorizontal: 28, paddingVertical: 22, maxWidth: '90%', alignItems: 'center', gap: 14 },
  resultImage: { width: 160, height: 160, maxWidth: '70%' },
  resultLabel: { fontSize: 32, fontWeight: '700', textAlign: 'center' },
  resultHint: { position: 'absolute', bottom: 56, fontSize: 14, opacity: 0.85 },
});
