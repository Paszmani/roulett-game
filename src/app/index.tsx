import { useRef, useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useRoulette } from '@/contexts/RouletteContext';
import { Wheel, type WheelHandle } from '@/components/Wheel';
import { WinAnimation } from '@/components/WinAnimation';
import { FireBackground } from '@/components/FireBackground';
import { FireRing } from '@/components/FireRing';
import { ExtinguishOverlay } from '@/components/ExtinguishOverlay';
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
  // Fase de extinção do efeito "Chamas": ocorre ENTRE o fim do giro e o
  // resultado (extintores apagam o fogo). Fora do modo fogo, nunca é usada.
  const [extinguishing, setExtinguishing] = useState(false);
  // Formulário de lead: abre ao dispensar o resultado (se habilitado nas configs).
  const [leadVisible, setLeadVisible] = useState(false);

  // Efeito de giro "Chamas": fogo no fundo + anel na roleta durante o giro e
  // extinção antes do resultado. Opcional — ausente/'none' mantém o padrão.
  const fireMode = config.spinEffect === 'fire';
  const fireActive = fireMode && (isSpinning || extinguishing);

  const fontFamily = FONT_FAMILIES[config.fontFamily];
  const winner = winnerIndex != null ? config.segments[winnerIndex] : null;
  const textScale = config.textScale ?? 1;

  // Tela de resultado personalizada da fatia vencedora (quando habilitada).
  // Cada campo cai no padrão: texto vazio → nome; sem imagem → imagem da fatia;
  // sem animação → animação global.
  const resultOverride = winner?.resultOverride?.enabled ? winner.resultOverride : null;
  const resultText = resultOverride?.text?.trim() ? resultOverride.text : winner?.label || '—';
  const resultImage = resultOverride?.image ?? winner?.image;
  const resultAnimation = resultOverride?.animation ?? config.winAnimation;
  // Imagem do resultado dimensionada à tela (limitada para caber no card).
  const resultImgW = Math.min(width * 0.7, 420);
  const resultImgH = Math.min(height * 0.4, 420);

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

      {/* Modo Chamas — fase 1a: fogo no plano de fundo (apaga junto na parada). */}
      {fireActive ? <FireBackground extinguishing={extinguishing} /> : null}

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
              triggerHaptic();
              if (fireMode) {
                // Modo Chamas: extingue o fogo primeiro; o resultado só aparece
                // quando o ExtinguishOverlay chamar onDone (~900ms).
                setExtinguishing(true);
              } else {
                setCelebrateId((id) => id + 1);
                setResultShown(true);
              }
            }}
          />

          {/* Modo Chamas — fase 1b: anel de fogo lambendo a borda da roleta. */}
          {fireActive ? (
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center]}>
              <FireRing size={wheelSize} active extinguishing={extinguishing} />
            </View>
          ) : null}
        </View>
      </View>

      </SafeAreaView>

      {/* Modo Chamas — fase 2: extintores apagam o fogo; ao fim, revela o resultado. */}
      {fireMode && extinguishing ? (
        <ExtinguishOverlay
          active
          onDone={() => {
            setExtinguishing(false);
            setCelebrateId((id) => id + 1);
            setResultShown(true);
          }}
        />
      ) : null}

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
            <WinAnimation key={celebrateId} type={resultAnimation} active />
          </View>

          {/* Card do resultado, centralizado. Personalizado: texto no topo e
              imagem abaixo. Padrão: imagem da fatia acima do nome. */}
          {winner ? (
            <View style={[styles.resultCard, { backgroundColor: winner.color, borderRadius: palette.radius.card }]}>
              {resultOverride ? (
                <>
                  <Text
                    style={[styles.resultLabel, { color: readableTextColor(winner.color), fontFamily, fontSize: 32 * textScale }]}
                  >
                    {resultText}
                  </Text>
                  {resultImage ? (
                    <Image
                      source={{ uri: resultImage }}
                      style={[styles.resultImage, { width: resultImgW, height: resultImgH, borderRadius: palette.radius.control }]}
                      resizeMode="contain"
                    />
                  ) : null}
                </>
              ) : (
                <>
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
                </>
              )}
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
  center: { alignItems: 'center', justifyContent: 'center' },
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
