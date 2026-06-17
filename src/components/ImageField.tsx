import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Palette } from '@/constants/theme';

interface ImageFieldProps {
  image?: string;
  palette: Palette;
  fontFamily: string;
  busy: boolean;
  /** Formato da miniatura: quadrada (logo) ou ampla (fundo). */
  shape?: 'square' | 'wide';
  onPick: () => void;
  onRemove: () => void;
}

export function ImageField({
  image,
  palette,
  fontFamily,
  busy,
  shape = 'square',
  onPick,
  onRemove,
}: ImageFieldProps) {
  const thumbStyle = shape === 'wide' ? styles.thumbWide : styles.thumbSquare;
  return (
    <View style={styles.row}>
      {image ? (
        <Image source={{ uri: image }} style={[thumbStyle, styles.thumb]} resizeMode="cover" />
      ) : (
        <View style={[thumbStyle, styles.thumb, styles.thumbEmpty, { borderColor: palette.border }]}>
          <Text style={{ color: palette.textMuted, fontSize: 18 }}>🖼️</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          onPress={onPick}
          disabled={busy}
          style={[styles.btn, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
        >
          {busy ? (
            <ActivityIndicator size="small" color={palette.text} />
          ) : (
            <Text style={[styles.btnText, { color: palette.text, fontFamily }]}>
              {image ? 'Trocar imagem' : 'Adicionar imagem'}
            </Text>
          )}
        </Pressable>

        {image ? (
          <Pressable onPress={onRemove} disabled={busy} style={styles.remove} hitSlop={6}>
            <Text style={[styles.removeText, { color: palette.textMuted }]}>Remover</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { backgroundColor: '#0F172A' },
  thumbSquare: { width: 56, height: 56, borderRadius: 12 },
  thumbWide: { width: 84, height: 56, borderRadius: 12 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderStyle: 'dashed' },
  actions: { flex: 1, gap: 6 },
  btn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  btnText: { fontSize: 14 },
  remove: { alignSelf: 'flex-start', paddingVertical: 2 },
  removeText: { fontSize: 13, textDecorationLine: 'underline' },
});
