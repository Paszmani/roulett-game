import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { Segment, WinAnimationType } from '@/types';
import type { Palette } from '@/constants/theme';
import { SEGMENT_PALETTE, WIN_ANIMATION_OPTIONS } from '@/constants/theme';

interface SegmentEditorProps {
  segment: Segment;
  index: number;
  palette: Palette;
  fontFamily: string;
  canRemove: boolean;
  busy: boolean;
  /** Ocupada carregando a imagem da tela de resultado desta fatia. */
  resultBusy: boolean;
  /** Animação global — rotula a opção "Padrão" do seletor por fatia. */
  defaultAnimation: WinAnimationType;
  /** Chance de vitória (%) calculada sobre o total de pesos. */
  chancePercent: number;
  onChangeLabel: (label: string) => void;
  onChangeColor: (color: string) => void;
  onChangeWeight: (delta: number) => void;
  onOpenPicker: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onRemove: () => void;
  /** Tela de resultado personalizada. */
  onToggleResult: (enabled: boolean) => void;
  onChangeResultText: (text: string) => void;
  onPickResultImage: () => void;
  onRemoveResultImage: () => void;
  /** `undefined` = usar a animação global (padrão). */
  onChangeResultAnimation: (animation: WinAnimationType | undefined) => void;
}

export function SegmentEditor({
  segment,
  index,
  palette,
  fontFamily,
  canRemove,
  busy,
  resultBusy,
  defaultAnimation,
  chancePercent,
  onChangeLabel,
  onChangeColor,
  onChangeWeight,
  onOpenPicker,
  onPickImage,
  onRemoveImage,
  onRemove,
  onToggleResult,
  onChangeResultText,
  onPickResultImage,
  onRemoveResultImage,
  onChangeResultAnimation,
}: SegmentEditorProps) {
  const weight = segment.weight ?? 1;
  const result = segment.resultOverride;
  const resultEnabled = result?.enabled ?? false;
  const resultAnimation = result?.animation; // undefined = padrão (global)
  return (
    <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.card }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onOpenPicker}
          style={[styles.swatch, { backgroundColor: segment.color, borderColor: palette.border, borderRadius: palette.radius.small }]}
        />
        <TextInput
          value={segment.label}
          onChangeText={onChangeLabel}
          placeholder={`Opção ${index + 1}`}
          placeholderTextColor={palette.textMuted}
          style={[styles.input, { color: palette.text, fontFamily }]}
          maxLength={24}
        />
        <Pressable
          onPress={onRemove}
          disabled={!canRemove}
          style={[styles.remove, { opacity: canRemove ? 1 : 0.3 }]}
          hitSlop={8}
        >
          <Text style={[styles.removeText, { color: palette.text }]}>✕</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.palette}
      >
        {SEGMENT_PALETTE.map((color) => (
          <Pressable
            key={color}
            onPress={() => onChangeColor(color)}
            style={[
              styles.colorDot,
              { backgroundColor: color },
              segment.color === color && { borderColor: palette.text, borderWidth: 3 },
            ]}
          />
        ))}
      </ScrollView>

      {/* Peso (chance relativa e tamanho do arco) */}
      <View style={styles.weightRow}>
        <Text style={[styles.weightLabel, { color: palette.textMuted, fontFamily }]}>
          Chance: {chancePercent}%
        </Text>
        <View style={[styles.weightStepper, { backgroundColor: palette.surfaceAlt, borderColor: palette.border, borderRadius: palette.radius.control }]}>
          <Pressable onPress={() => onChangeWeight(-1)} disabled={weight <= 1} style={[styles.weightBtn, { opacity: weight <= 1 ? 0.3 : 1 }]} hitSlop={6}>
            <Text style={[styles.weightBtnText, { color: palette.text }]}>−</Text>
          </Pressable>
          <Text style={[styles.weightValue, { color: palette.text, fontFamily }]}>{weight}×</Text>
          <Pressable onPress={() => onChangeWeight(1)} style={styles.weightBtn} hitSlop={6}>
            <Text style={[styles.weightBtnText, { color: palette.text }]}>+</Text>
          </Pressable>
        </View>
      </View>

      {/* Imagem da fatia */}
      <View style={styles.imageRow}>
        {segment.image ? (
          <Image source={{ uri: segment.image }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbEmpty, { borderColor: palette.border }]}>
            <Text style={{ color: palette.textMuted, fontSize: 18 }}>🖼️</Text>
          </View>
        )}

        <Pressable
          onPress={onPickImage}
          disabled={busy}
          style={[styles.imageBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border, borderRadius: palette.radius.control }]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={palette.text} />
          ) : (
            <Text style={[styles.imageBtnText, { color: palette.text, fontFamily }]}>
              {segment.image ? 'Trocar imagem' : 'Adicionar imagem'}
            </Text>
          )}
        </Pressable>

        {segment.image ? (
          <Pressable onPress={onRemoveImage} disabled={busy} style={styles.imageRemove} hitSlop={6}>
            <Text style={[styles.imageRemoveText, { color: palette.textMuted }]}>Remover</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Tela de resultado personalizada (opcional por fatia) */}
      <View style={[styles.resultBlock, { borderTopColor: palette.border }]}>
        <View style={styles.resultToggleRow}>
          <Text style={[styles.resultToggleLabel, { color: palette.text, fontFamily }]}>
            Tela de resultado personalizada
          </Text>
          <Switch value={resultEnabled} onValueChange={onToggleResult} />
        </View>

        {resultEnabled ? (
          <View style={styles.resultBody}>
            {/* Texto alternativo (centralizado, multilinha) */}
            <Text style={[styles.miniLabel, { color: palette.textMuted, fontFamily }]}>
              Texto (vazio = nome da fatia)
            </Text>
            <TextInput
              value={result?.text ?? ''}
              onChangeText={onChangeResultText}
              placeholder={segment.label || `Opção ${index + 1}`}
              placeholderTextColor={palette.textMuted}
              style={[
                styles.resultTextInput,
                { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.border, borderRadius: palette.radius.control, fontFamily },
              ]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={140}
            />

            {/* Imagem da tela de resultado (abaixo do texto) */}
            <Text style={[styles.miniLabel, { color: palette.textMuted, fontFamily }]}>
              Imagem do resultado (abaixo do texto)
            </Text>
            <View style={styles.imageRow}>
              {result?.image ? (
                <Image source={{ uri: result.image }} style={styles.thumb} resizeMode="cover" />
              ) : (
                <View style={[styles.thumb, styles.thumbEmpty, { borderColor: palette.border }]}>
                  <Text style={{ color: palette.textMuted, fontSize: 18 }}>🖼️</Text>
                </View>
              )}
              <Pressable
                onPress={onPickResultImage}
                disabled={resultBusy}
                style={[styles.imageBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border, borderRadius: palette.radius.control }]}
              >
                {resultBusy ? (
                  <ActivityIndicator size="small" color={palette.text} />
                ) : (
                  <Text style={[styles.imageBtnText, { color: palette.text, fontFamily }]}>
                    {result?.image ? 'Trocar imagem' : 'Adicionar imagem'}
                  </Text>
                )}
              </Pressable>
              {result?.image ? (
                <Pressable onPress={onRemoveResultImage} disabled={resultBusy} style={styles.imageRemove} hitSlop={6}>
                  <Text style={[styles.imageRemoveText, { color: palette.textMuted }]}>Remover</Text>
                </Pressable>
              ) : null}
            </View>

            {/* Seletor de animação (Padrão = animação global) */}
            <Text style={[styles.miniLabel, { color: palette.textMuted, fontFamily }]}>Animação desta fatia</Text>
            <View style={styles.animRow}>
              <Pressable
                onPress={() => onChangeResultAnimation(undefined)}
                style={[
                  styles.animChip,
                  { backgroundColor: resultAnimation === undefined ? palette.primary : palette.surfaceAlt, borderColor: palette.border, borderRadius: palette.radius.control },
                ]}
              >
                <Text style={{ color: resultAnimation === undefined ? palette.primaryText : palette.text, fontFamily, fontSize: 14 }}>
                  Padrão ({WIN_ANIMATION_OPTIONS.find((o) => o.key === defaultAnimation)?.label ?? defaultAnimation})
                </Text>
              </Pressable>
              {WIN_ANIMATION_OPTIONS.map((opt) => {
                const active = resultAnimation === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    onPress={() => onChangeResultAnimation(opt.key)}
                    style={[
                      styles.animChip,
                      { backgroundColor: active ? palette.primary : palette.surfaceAlt, borderColor: palette.border, borderRadius: palette.radius.control },
                    ]}
                  >
                    <Text style={{ color: active ? palette.primaryText : palette.text, fontFamily, fontSize: 14 }}>
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: 16, borderWidth: 1, padding: 12, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  swatch: { width: 26, height: 26, borderRadius: 8, borderWidth: 1 },
  input: { flex: 1, fontSize: 16, paddingVertical: 4 },
  remove: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 16 },
  palette: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  colorDot: { width: 28, height: 28, borderRadius: 14, borderColor: 'transparent' },
  weightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  weightLabel: { fontSize: 13 },
  weightStepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 4 },
  weightBtn: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  weightBtnText: { fontSize: 18 },
  weightValue: { fontSize: 14, minWidth: 28, textAlign: 'center' },
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0F172A' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  imageBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, minWidth: 140, alignItems: 'center' },
  imageBtnText: { fontSize: 14 },
  imageRemove: { paddingHorizontal: 6, paddingVertical: 6 },
  imageRemoveText: { fontSize: 13, textDecorationLine: 'underline' },
  // Bloco da tela de resultado personalizada
  resultBlock: { borderTopWidth: 1, paddingTop: 12, gap: 8 },
  resultToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  resultToggleLabel: { fontSize: 14, flex: 1 },
  resultBody: { gap: 8, marginTop: 2 },
  miniLabel: { fontSize: 12, letterSpacing: 0.5 },
  resultTextInput: { minHeight: 64, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, textAlign: 'center' },
  animRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  animChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
