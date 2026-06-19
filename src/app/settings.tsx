import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRoulette } from '@/contexts/RouletteContext';
import { SegmentEditor } from '@/components/SegmentEditor';
import { ImageField } from '@/components/ImageField';
import { ColorPickerModal } from '@/components/ColorPickerModal';
import {
  BACKGROUND_PALETTE,
  BUTTON_COLOR_SWATCHES,
  FONT_FAMILIES,
  FONT_OPTIONS,
  POINTER_EMOJIS,
  SEGMENT_PALETTE,
  TEXT_COLOR_SWATCHES,
} from '@/constants/theme';
import { LIMITS } from '@/constants/defaults';
import { pickImage, type PickImageOptions } from '@/utils/imagePicker';
import type { FontKey, WinAnimationType } from '@/types';

const WIN_ANIMATIONS: { key: WinAnimationType; label: string }[] = [
  { key: 'confetti', label: 'Confete' },
  { key: 'fireworks', label: 'Fogos' },
  { key: 'stars', label: 'Estrelas' },
  { key: 'coins', label: 'Moedas' },
  { key: 'hearts', label: 'Corações' },
  { key: 'fire', label: 'Fogo' },
];

type PickerTarget =
  | { kind: 'segment'; id: string }
  | { kind: 'background' }
  | { kind: 'text' }
  | { kind: 'button' };

function notify(title: string, msg: string) {
  if (Platform.OS === 'web') window.alert(msg);
  else Alert.alert(title, msg);
}

export default function SettingsScreen() {
  const router = useRouter();
  const { config, palette, patch, addSegment, removeSegment, updateSegment, toggleTheme } = useRoulette();
  const fontFamily = FONT_FAMILIES[config.fontFamily];
  // Chave do item cuja imagem está sendo selecionada: `seg-<id>`, `logo` ou `background`.
  const [pickingKey, setPickingKey] = useState<string | null>(null);
  // Alvo do seletor de cor (modal): uma fatia ou o plano de fundo.
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  let pickerColor = '#FFFFFF';
  if (pickerTarget?.kind === 'segment')
    pickerColor = config.segments.find((s) => s.id === pickerTarget.id)?.color ?? '#FFFFFF';
  else if (pickerTarget?.kind === 'background') pickerColor = config.backgroundColor ?? palette.background;
  else if (pickerTarget?.kind === 'text') pickerColor = palette.text;
  else if (pickerTarget?.kind === 'button') pickerColor = palette.primary;

  const pickerSwatches =
    pickerTarget?.kind === 'background'
      ? BACKGROUND_PALETTE
      : pickerTarget?.kind === 'text'
        ? TEXT_COLOR_SWATCHES
        : pickerTarget?.kind === 'button'
          ? BUTTON_COLOR_SWATCHES
          : SEGMENT_PALETTE;

  function applyPickerColor(hex: string) {
    if (pickerTarget?.kind === 'segment') updateSegment(pickerTarget.id, { color: hex });
    else if (pickerTarget?.kind === 'background') patch({ backgroundColor: hex });
    else if (pickerTarget?.kind === 'text') patch({ textColor: hex });
    else if (pickerTarget?.kind === 'button') patch({ buttonColor: hex });
  }

  function adjustWheelScale(delta: number) {
    const next = Math.min(
      LIMITS.maxWheelScale,
      Math.max(LIMITS.minWheelScale, Math.round((config.wheelScale + delta) * 100) / 100),
    );
    patch({ wheelScale: next });
  }

  function adjustCorner(delta: number) {
    const next = Math.min(
      LIMITS.maxCornerRadius,
      Math.max(LIMITS.minCornerRadius, config.cornerRadius + delta),
    );
    patch({ cornerRadius: next });
  }

  async function handlePick(
    key: string,
    options: PickImageOptions,
    apply: (dataUri: string) => void,
  ) {
    setPickingKey(key);
    try {
      const result = await pickImage(options);
      if (result.status === 'ok' && result.dataUri) {
        apply(result.dataUri);
      } else if (result.status === 'denied') {
        notify('Permissão necessária', 'Permita o acesso às fotos para usar imagens.');
      } else if (result.status === 'error') {
        notify('Ops', 'Não foi possível carregar a imagem. Tente outra.');
      }
    } finally {
      setPickingKey(null);
    }
  }

  function adjustDuration(delta: number) {
    const next = Math.min(
      LIMITS.maxSpinMs,
      Math.max(LIMITS.minSpinMs, config.spinDurationMs + delta),
    );
    patch({ spinDurationMs: next });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <Text style={[styles.headerTitle, { color: palette.text, fontFamily }]}>Personalizar</Text>
        <Pressable onPress={() => router.back()} style={[styles.doneBtn, { backgroundColor: palette.primary, borderRadius: palette.radius.control }]}>
          <Text style={[styles.doneText, { color: palette.primaryText, fontFamily }]}>Concluir</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Título */}
        <Section title="Título" palette={palette} fontFamily={fontFamily}>
          <TextInput
            value={config.title}
            onChangeText={(t) => patch({ title: t })}
            placeholder="Nome da roleta"
            placeholderTextColor={palette.textMuted}
            style={[styles.titleInput, { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control, fontFamily }]}
            maxLength={28}
          />
        </Section>

        {/* Tema */}
        <Section title="Aparência" palette={palette} fontFamily={fontFamily}>
          <View style={[styles.toggleRow, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Text style={[styles.toggleLabel, { color: palette.text, fontFamily }]}>Tema escuro</Text>
            <Switch value={config.theme === 'dark'} onValueChange={toggleTheme} />
          </View>
          <View style={[styles.toggleRow, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Text style={[styles.toggleLabel, { color: palette.text, fontFamily }]}>Texto na vertical</Text>
            <Switch value={config.verticalText} onValueChange={(v) => patch({ verticalText: v })} />
          </View>
          <View style={[styles.toggleRow, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Text style={[styles.toggleLabel, { color: palette.text, fontFamily }]}>Vibração no resultado</Text>
            <Switch value={config.hapticsEnabled} onValueChange={(v) => patch({ hapticsEnabled: v })} />
          </View>
        </Section>

        {/* Cores e cantos (globais) */}
        <Section title="Cores e cantos" palette={palette} fontFamily={fontFamily}>
          <Pressable
            onPress={() => setPickerTarget({ kind: 'text' })}
            style={[styles.colorRow, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}
          >
            <Text style={[styles.toggleLabel, { color: palette.text, fontFamily }]}>Cor do texto</Text>
            <View style={[styles.colorPreview, { backgroundColor: palette.text, borderColor: palette.border }]} />
          </Pressable>
          <Pressable
            onPress={() => setPickerTarget({ kind: 'button' })}
            style={[styles.colorRow, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}
          >
            <Text style={[styles.toggleLabel, { color: palette.text, fontFamily }]}>Cor dos botões</Text>
            <View style={[styles.colorPreview, { backgroundColor: palette.primary, borderColor: palette.border }]} />
          </Pressable>

          <Text style={[styles.miniLabel, { color: palette.textMuted, fontFamily }]}>Arredondamento dos cantos</Text>
          <View style={[styles.stepper, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Pressable onPress={() => adjustCorner(-LIMITS.cornerRadiusStep)} style={styles.stepBtn}>
              <Text style={[styles.stepBtnText, { color: palette.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: palette.text, fontFamily }]}>{config.cornerRadius}px</Text>
            <Pressable onPress={() => adjustCorner(LIMITS.cornerRadiusStep)} style={styles.stepBtn}>
              <Text style={[styles.stepBtnText, { color: palette.text }]}>+</Text>
            </Pressable>
          </View>
        </Section>

        {/* Animação de vitória */}
        <Section title="Animação de vitória" palette={palette} fontFamily={fontFamily}>
          <View style={styles.fontRow}>
            {WIN_ANIMATIONS.map((opt) => {
              const active = config.winAnimation === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => patch({ winAnimation: opt.key })}
                  style={[
                    styles.fontChip,
                    { backgroundColor: active ? palette.primary : palette.surface, borderColor: palette.border, borderRadius: palette.radius.control },
                  ]}
                >
                  <Text style={{ color: active ? palette.primaryText : palette.text, fontFamily, fontSize: 15 }}>
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Ponteiro (seta) */}
        <Section title="Seta (ponteiro)" palette={palette} fontFamily={fontFamily}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pointerRow}>
            {/* Seta padrão */}
            <Pressable
              onPress={() => patch({ pointerType: 'shape' })}
              style={[
                styles.pointerChip,
                { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control },
                config.pointerType === 'shape' && { borderColor: palette.primary, borderWidth: 2 },
              ]}
            >
              <Text style={{ color: palette.text, fontSize: 22 }}>🔻</Text>
            </Pressable>

            {/* Emojis */}
            {POINTER_EMOJIS.map((emoji) => {
              const active = config.pointerType === 'emoji' && config.pointerEmoji === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => patch({ pointerType: 'emoji', pointerEmoji: emoji })}
                  style={[
                    styles.pointerChip,
                    { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control },
                    active && { borderColor: palette.primary, borderWidth: 2 },
                  ]}
                >
                  <Text style={{ fontSize: 22 }}>{emoji}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.hint, { color: palette.textMuted, fontFamily }]}>
            Ou use uma imagem (fica na posição da seta, apontando para o prêmio):
          </Text>
          <ImageField
            image={config.pointerImage}
            palette={palette}
            fontFamily={fontFamily}
            busy={pickingKey === 'pointer'}
            shape="square"
            onPick={() =>
              handlePick('pointer', { square: true, maxSize: 512, format: 'png' }, (uri) =>
                patch({ pointerType: 'image', pointerImage: uri }),
              )
            }
            onRemove={() => patch({ pointerType: 'shape', pointerImage: undefined })}
          />
        </Section>

        {/* Logo */}
        <Section title="Logo (acima da roleta)" palette={palette} fontFamily={fontFamily}>
          <ImageField
            image={config.logo}
            palette={palette}
            fontFamily={fontFamily}
            busy={pickingKey === 'logo'}
            shape="wide"
            onPick={() =>
              handlePick('logo', { square: false, maxSize: 1080 }, (uri) => patch({ logo: uri }))
            }
            onRemove={() => patch({ logo: undefined })}
          />
        </Section>

        {/* Plano de fundo */}
        <Section title="Plano de fundo" palette={palette} fontFamily={fontFamily}>
          <View style={styles.palette}>
            <Pressable
              onPress={() => patch({ backgroundColor: undefined })}
              style={[
                styles.bgChip,
                { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control },
                !config.backgroundColor && { borderColor: palette.primary, borderWidth: 2 },
              ]}
            >
              <Text style={{ color: palette.text, fontFamily, fontSize: 13 }}>Tema</Text>
            </Pressable>
            {BACKGROUND_PALETTE.map((color) => (
              <Pressable
                key={color}
                onPress={() => patch({ backgroundColor: color })}
                style={[
                  styles.bgDot,
                  { backgroundColor: color, borderColor: palette.border },
                  config.backgroundColor === color && { borderColor: palette.primary, borderWidth: 3 },
                ]}
              />
            ))}
            {/* Cor personalizada (abre o seletor) */}
            <Pressable
              onPress={() => setPickerTarget({ kind: 'background' })}
              style={[styles.bgChip, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}
            >
              <Text style={{ color: palette.text, fontSize: 13, fontFamily }}>🎨 Cor</Text>
            </Pressable>
          </View>

          <ImageField
            image={config.backgroundImage}
            palette={palette}
            fontFamily={fontFamily}
            busy={pickingKey === 'background'}
            shape="wide"
            onPick={() =>
              handlePick('background', { square: false, maxSize: 1920, format: 'jpeg', quality: 0.9 }, (uri) =>
                patch({ backgroundImage: uri }),
              )
            }
            onRemove={() => patch({ backgroundImage: undefined })}
          />
          {config.backgroundImage ? (
            <Text style={[styles.hint, { color: palette.textMuted, fontFamily }]}>
              A imagem de fundo tem prioridade sobre a cor.
            </Text>
          ) : null}
        </Section>

        {/* Fonte */}
        <Section title="Fonte" palette={palette} fontFamily={fontFamily}>
          <View style={styles.fontRow}>
            {FONT_OPTIONS.map((key: FontKey) => {
              const active = config.fontFamily === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => patch({ fontFamily: key })}
                  style={[
                    styles.fontChip,
                    { backgroundColor: active ? palette.primary : palette.surface, borderColor: palette.border, borderRadius: palette.radius.control },
                  ]}
                >
                  <Text style={{ color: active ? palette.primaryText : palette.text, fontFamily: FONT_FAMILIES[key], fontSize: 15 }}>
                    {key}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Duração do giro */}
        <Section title="Duração do giro" palette={palette} fontFamily={fontFamily}>
          <View style={[styles.stepper, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Pressable onPress={() => adjustDuration(-LIMITS.spinStepMs)} style={styles.stepBtn}>
              <Text style={[styles.stepBtnText, { color: palette.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: palette.text, fontFamily }]}>
              {(config.spinDurationMs / 1000).toFixed(1)}s
            </Text>
            <Pressable onPress={() => adjustDuration(LIMITS.spinStepMs)} style={styles.stepBtn}>
              <Text style={[styles.stepBtnText, { color: palette.text }]}>+</Text>
            </Pressable>
          </View>
        </Section>

        {/* Tamanho da roleta */}
        <Section title="Tamanho da roleta" palette={palette} fontFamily={fontFamily}>
          <View style={[styles.stepper, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Pressable onPress={() => adjustWheelScale(-LIMITS.wheelScaleStep)} style={styles.stepBtn}>
              <Text style={[styles.stepBtnText, { color: palette.text }]}>−</Text>
            </Pressable>
            <Text style={[styles.stepValue, { color: palette.text, fontFamily }]}>
              {Math.round(config.wheelScale * 100)}%
            </Text>
            <Pressable onPress={() => adjustWheelScale(LIMITS.wheelScaleStep)} style={styles.stepBtn}>
              <Text style={[styles.stepBtnText, { color: palette.text }]}>+</Text>
            </Pressable>
          </View>
        </Section>

        {/* Setores */}
        <Section
          title={`Opções (${config.segments.length})`}
          palette={palette}
          fontFamily={fontFamily}
        >
          <View style={{ gap: 12 }}>
            {config.segments.map((s, i) => (
              <SegmentEditor
                key={s.id}
                segment={s}
                index={i}
                palette={palette}
                fontFamily={fontFamily}
                canRemove={config.segments.length > LIMITS.minSegments}
                busy={pickingKey === `seg-${s.id}`}
                onChangeLabel={(label) => updateSegment(s.id, { label })}
                onChangeColor={(color) => updateSegment(s.id, { color })}
                onOpenPicker={() => setPickerTarget({ kind: 'segment', id: s.id })}
                onPickImage={() =>
                  handlePick(`seg-${s.id}`, { square: true, maxSize: 1080 }, (uri) =>
                    updateSegment(s.id, { image: uri }),
                  )
                }
                onRemoveImage={() => updateSegment(s.id, { image: undefined })}
                onRemove={() => removeSegment(s.id)}
              />
            ))}
          </View>
          <Pressable
            onPress={addSegment}
            disabled={config.segments.length >= LIMITS.maxSegments}
            style={[
              styles.addBtn,
              { borderColor: palette.primary, opacity: config.segments.length >= LIMITS.maxSegments ? 0.4 : 1, borderRadius: palette.radius.card },
            ]}
          >
            <Text style={[styles.addText, { color: palette.primary, fontFamily }]}>+ Adicionar opção</Text>
          </Pressable>
        </Section>
      </ScrollView>

      <ColorPickerModal
        visible={pickerTarget !== null}
        color={pickerColor}
        palette={palette}
        fontFamily={fontFamily}
        swatches={pickerSwatches}
        onChange={applyPickerColor}
        onClose={() => setPickerTarget(null)}
      />
    </SafeAreaView>
  );
}

function Section({
  title,
  palette,
  fontFamily,
  children,
}: {
  title: string;
  palette: ReturnType<typeof useRoulette>['palette'];
  fontFamily: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.textMuted, fontFamily }]}>{title.toUpperCase()}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1 },
  headerTitle: { fontSize: 20 },
  doneBtn: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 12 },
  doneText: { fontSize: 15 },
  content: { padding: 20, gap: 24, width: '100%', maxWidth: 640, alignSelf: 'center' },
  section: { gap: 10 },
  sectionTitle: { fontSize: 12, letterSpacing: 1 },
  titleInput: { fontSize: 17, borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  toggleLabel: { fontSize: 16 },
  fontRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fontChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 8, paddingVertical: 6 },
  stepBtn: { width: 48, height: 40, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 26 },
  stepValue: { fontSize: 18 },
  addBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addText: { fontSize: 15 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  bgChip: { paddingHorizontal: 14, height: 32, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bgDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
  hint: { fontSize: 12, marginTop: 2 },
  pointerRow: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  pointerChip: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12 },
  colorPreview: { width: 28, height: 28, borderRadius: 8, borderWidth: 1 },
  miniLabel: { fontSize: 12, letterSpacing: 1, marginTop: 4 },
});
