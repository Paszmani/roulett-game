import { useEffect, useId, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { Palette } from '@/constants/theme';
import { hexToHsl, hslToHex, normalizeHex, readableTextColor } from '@/utils/colors';

interface ColorPickerModalProps {
  visible: boolean;
  color: string;
  palette: Palette;
  fontFamily: string;
  /** Cores de acesso rápido (1 toque). */
  swatches: string[];
  onChange: (hex: string) => void;
  onClose: () => void;
}

interface GradientStop {
  offset: number;
  color: string;
}

/** Barra de canal (matiz/saturação/luminosidade) controlada por toque/arraste. */
function ChannelSlider({
  fraction,
  stops,
  palette,
  onChangeFraction,
}: {
  fraction: number;
  stops: GradientStop[];
  palette: Palette;
  onChangeFraction: (f: number) => void;
}) {
  const id = useId().replace(/:/g, '');
  const [width, setWidth] = useState(0);
  const clamped = Math.max(0, Math.min(1, fraction));

  function handle(e: GestureResponderEvent) {
    const x = e.nativeEvent.locationX;
    if (width > 0) onChangeFraction(Math.max(0, Math.min(1, x / width)));
  }

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handle}
      onResponderMove={handle}
      style={styles.slider}
    >
      {width > 0 ? (
        <Svg width={width} height={26}>
          <Defs>
            <LinearGradient id={`g-${id}`} x1="0" y1="0" x2="1" y2="0">
              {stops.map((s, i) => (
                <Stop key={i} offset={s.offset} stopColor={s.color} />
              ))}
            </LinearGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={26} rx={13} fill={`url(#g-${id})`} />
        </Svg>
      ) : null}
      <View
        pointerEvents="none"
        style={[styles.thumb, { left: clamped * width - 10, borderColor: palette.text }]}
      />
    </View>
  );
}

export function ColorPickerModal({
  visible,
  color,
  palette,
  fontFamily,
  swatches,
  onChange,
  onClose,
}: ColorPickerModalProps) {
  const [hsl, setHsl] = useState(() => hexToHsl(color));
  const [hexText, setHexText] = useState(color);

  // Inicializa a partir da cor recebida sempre que o modal abre.
  useEffect(() => {
    if (visible) {
      setHsl(hexToHsl(color));
      setHexText(normalizeHex(color) ?? color);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const current = hslToHex(hsl.h, hsl.s, hsl.l);

  function apply(next: { h?: number; s?: number; l?: number }) {
    const merged = { ...hsl, ...next };
    setHsl(merged);
    const hex = hslToHex(merged.h, merged.s, merged.l);
    setHexText(hex);
    onChange(hex);
  }

  function onHexChange(text: string) {
    setHexText(text);
    const norm = normalizeHex(text);
    if (norm) {
      setHsl(hexToHsl(norm));
      onChange(norm);
    }
  }

  const hueStops: GradientStop[] = [
    { offset: 0, color: '#FF0000' },
    { offset: 1 / 6, color: '#FFFF00' },
    { offset: 2 / 6, color: '#00FF00' },
    { offset: 3 / 6, color: '#00FFFF' },
    { offset: 4 / 6, color: '#0000FF' },
    { offset: 5 / 6, color: '#FF00FF' },
    { offset: 1, color: '#FF0000' },
  ];
  const satStops: GradientStop[] = [
    { offset: 0, color: hslToHex(hsl.h, 0, hsl.l) },
    { offset: 1, color: hslToHex(hsl.h, 100, hsl.l) },
  ];
  const lightStops: GradientStop[] = [
    { offset: 0, color: '#000000' },
    { offset: 0.5, color: hslToHex(hsl.h, hsl.s, 50) },
    { offset: 1, color: '#FFFFFF' },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Preview + hex */}
          <View style={styles.headerRow}>
            <View style={[styles.preview, { backgroundColor: current, borderColor: palette.border }]}>
              <Text style={{ color: readableTextColor(current), fontFamily, fontSize: 12 }}>Aa</Text>
            </View>
            <View style={[styles.hexBox, { borderColor: palette.border, backgroundColor: palette.surfaceAlt }]}>
              <Text style={[styles.hash, { color: palette.textMuted, fontFamily }]}>#</Text>
              <TextInput
                value={hexText.replace('#', '')}
                onChangeText={(t) => onHexChange(t)}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                placeholder="RRGGBB"
                placeholderTextColor={palette.textMuted}
                style={[styles.hexInput, { color: palette.text, fontFamily }]}
              />
            </View>
          </View>

          {/* Sliders H / S / L */}
          <View style={styles.sliders}>
            <ChannelSlider
              fraction={hsl.h / 360}
              stops={hueStops}
              palette={palette}
              onChangeFraction={(f) => apply({ h: Math.round(f * 360) })}
            />
            <ChannelSlider
              fraction={hsl.s / 100}
              stops={satStops}
              palette={palette}
              onChangeFraction={(f) => apply({ s: Math.round(f * 100) })}
            />
            <ChannelSlider
              fraction={hsl.l / 100}
              stops={lightStops}
              palette={palette}
              onChangeFraction={(f) => apply({ l: Math.round(f * 100) })}
            />
          </View>

          {/* Acesso rápido */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatches}>
            {swatches.map((c) => (
              <Pressable
                key={c}
                onPress={() => onHexChange(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: c },
                  normalizeHex(c) === normalizeHex(current) && { borderColor: palette.text, borderWidth: 3 },
                ]}
              />
            ))}
          </ScrollView>

          <Pressable style={[styles.done, { backgroundColor: palette.primary }]} onPress={onClose}>
            <Text style={{ color: palette.primaryText, fontFamily, fontSize: 16 }}>Concluir</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 380, borderRadius: 24, borderWidth: 1, padding: 20, gap: 18 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  preview: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  hexBox: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 48 },
  hash: { fontSize: 18 },
  hexInput: { flex: 1, fontSize: 18, letterSpacing: 2, paddingVertical: 0, marginLeft: 2 },
  sliders: { gap: 14 },
  slider: { height: 26, borderRadius: 13, justifyContent: 'center' },
  thumb: {
    position: 'absolute',
    top: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  swatches: { flexDirection: 'row', gap: 8, paddingVertical: 2 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderColor: 'transparent' },
  done: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
});
