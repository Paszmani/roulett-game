import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Segment } from '@/types';
import type { Palette } from '@/constants/theme';
import { readableTextColor } from '@/utils/colors';
import { WinFlames } from '@/components/WinFlames';

interface ResultModalProps {
  visible: boolean;
  segment: Segment | null;
  palette: Palette;
  fontFamily: string;
  onClose: () => void;
}

export function ResultModal({ visible, segment, palette, fontFamily, onClose }: ResultModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Chamas da vitória (atrás do conteúdo) */}
        <WinFlames active={visible} />
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <Text style={[styles.eyebrow, { color: palette.textMuted, fontFamily }]}>Resultado</Text>
          <View style={[styles.badge, { backgroundColor: segment?.color ?? palette.primary }]}>
            <Text style={[styles.badgeText, { color: readableTextColor(segment?.color ?? palette.primary), fontFamily }]}>
              {segment?.label ?? '—'}
            </Text>
          </View>
          <Pressable
            style={[styles.button, { backgroundColor: palette.primary }]}
            onPress={onClose}
          >
            <Text style={[styles.buttonText, { color: palette.primaryText, fontFamily }]}>Girar novamente</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,8,6,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  eyebrow: { fontSize: 13, letterSpacing: 1, textTransform: 'uppercase' },
  badge: { paddingVertical: 16, paddingHorizontal: 24, borderRadius: 16, minWidth: 200, alignItems: 'center' },
  badgeText: { fontSize: 24, textAlign: 'center' },
  button: { paddingVertical: 14, paddingHorizontal: 28, borderRadius: 14, marginTop: 8 },
  buttonText: { fontSize: 16 },
});
