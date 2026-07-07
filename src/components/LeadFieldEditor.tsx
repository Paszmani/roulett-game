import { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { Palette } from '@/constants/theme';
import type { LeadField, LeadFieldType } from '@/types';

const TYPE_OPTIONS: { key: LeadFieldType; label: string }[] = [
  { key: 'text', label: 'Texto' },
  { key: 'email', label: 'E-mail' },
  { key: 'tel', label: 'Telefone' },
  { key: 'select', label: 'Escolha' },
  { key: 'checkbox', label: 'Sim/Não' },
];

interface LeadFieldEditorProps {
  field: LeadField;
  palette: Palette;
  fontFamily: string;
  canRemove: boolean;
  onChange: (partial: Partial<LeadField>) => void;
  onRemove: () => void;
}

/** Editor de um campo do formulário de lead (rótulo, tipo, obrigatório, opções). */
export function LeadFieldEditor({ field, palette, fontFamily, canRemove, onChange, onRemove }: LeadFieldEditorProps) {
  // Texto local das opções: evita brigar com o cursor ao digitar vírgulas
  // (o valor commitado é o array já normalizado).
  const [optionsText, setOptionsText] = useState((field.options ?? []).join(', '));

  function commitOptions(text: string) {
    setOptionsText(text);
    onChange({
      options: text
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    });
  }

  return (
    <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.card }]}>
      <View style={styles.labelRow}>
        <TextInput
          value={field.label}
          onChangeText={(label) => onChange({ label })}
          placeholder="Rótulo do campo (ex.: Empresa)"
          placeholderTextColor={palette.textMuted}
          maxLength={40}
          style={[
            styles.labelInput,
            { color: palette.text, backgroundColor: palette.background, borderColor: palette.border, borderRadius: palette.radius.control, fontFamily },
          ]}
        />
        {canRemove ? (
          <Pressable onPress={onRemove} style={[styles.removeBtn, { borderColor: palette.border, borderRadius: palette.radius.control }]}>
            <Text style={[styles.removeText, { color: palette.textMuted }]}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.typeRow}>
        {TYPE_OPTIONS.map((opt) => {
          const active = field.type === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => onChange({ type: opt.key })}
              style={[
                styles.typeChip,
                { backgroundColor: active ? palette.primary : palette.background, borderColor: palette.border, borderRadius: palette.radius.control },
              ]}
            >
              <Text style={{ color: active ? palette.primaryText : palette.text, fontFamily, fontSize: 13 }}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {field.type === 'select' ? (
        <TextInput
          value={optionsText}
          onChangeText={commitOptions}
          placeholder="Opções separadas por vírgula (ex.: P, M, G)"
          placeholderTextColor={palette.textMuted}
          style={[
            styles.labelInput,
            { color: palette.text, backgroundColor: palette.background, borderColor: palette.border, borderRadius: palette.radius.control, fontFamily },
          ]}
        />
      ) : null}

      <View style={styles.requiredRow}>
        <Text style={[styles.requiredLabel, { color: palette.text, fontFamily }]}>Obrigatório</Text>
        <Switch value={field.required} onValueChange={(required) => onChange({ required })} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 12, gap: 10 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  labelInput: { flex: 1, fontSize: 15, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44 },
  removeBtn: { width: 44, height: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  removeText: { fontSize: 16 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1 },
  requiredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  requiredLabel: { fontSize: 15 },
});
