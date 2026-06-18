import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Segment } from '@/types';
import type { Palette } from '@/constants/theme';
import { SEGMENT_PALETTE } from '@/constants/theme';

interface SegmentEditorProps {
  segment: Segment;
  index: number;
  palette: Palette;
  fontFamily: string;
  canRemove: boolean;
  busy: boolean;
  onChangeLabel: (label: string) => void;
  onChangeColor: (color: string) => void;
  onOpenPicker: () => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onRemove: () => void;
}

export function SegmentEditor({
  segment,
  index,
  palette,
  fontFamily,
  canRemove,
  busy,
  onChangeLabel,
  onChangeColor,
  onOpenPicker,
  onPickImage,
  onRemoveImage,
  onRemove,
}: SegmentEditorProps) {
  return (
    <View style={[styles.row, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <View style={styles.header}>
        <Pressable
          onPress={onOpenPicker}
          style={[styles.swatch, { backgroundColor: segment.color, borderColor: palette.border }]}
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
          style={[styles.imageBtn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
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
  imageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  thumb: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#0F172A' },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  imageBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1, minWidth: 140, alignItems: 'center' },
  imageBtnText: { fontSize: 14 },
  imageRemove: { paddingHorizontal: 6, paddingVertical: 6 },
  imageRemoveText: { fontSize: 13, textDecorationLine: 'underline' },
});
