import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import type { Palette } from '@/constants/theme';
import type { LeadField } from '@/types';
import { saveLead, terminalId, type Lead } from '@/leads/leadStore';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LeadFormModalProps {
  visible: boolean;
  /** Campos do formulário (configuráveis; ver DEFAULT_LEAD_FIELDS). */
  fields: LeadField[];
  /** Rótulo do prêmio sorteado — vira a coluna `premio` do lead. */
  prizeLabel: string;
  palette: Palette;
  fontFamily: string;
  onClose: () => void;
}

/**
 * Formulário de captura de lead exibido após o resultado do giro. Como no
 * Kiosk Maze, o formulário é GERADO a partir da lista de campos configurada:
 * cada campo vira um controle conforme seu tipo, com validação leve
 * (obrigatório + formato de e-mail). O prêmio é a isca — capturamos o lead
 * junto com o que a pessoa ganhou.
 */
export function LeadFormModal({ visible, fields, prizeLabel, palette, fontFamily, onClose }: LeadFormModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Campos sem rótulo (recém-criados no editor) não aparecem no formulário.
  const activeFields = fields.filter((f) => f.label.trim().length > 0);

  // Estado limpo a cada abertura (o modal é reutilizado entre giros).
  useEffect(() => {
    if (visible) {
      setValues({});
      setError('');
      setSent(false);
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  function setValue(id: string, value: string) {
    setValues((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit() {
    for (const field of activeFields) {
      const value = (values[field.id] ?? '').trim();
      if (field.required && value.length === 0) {
        setError(`Preencha: ${field.label}`);
        return;
      }
      if (field.type === 'email' && value.length > 0 && !EMAIL_RE.test(value)) {
        setError('E-mail inválido.');
        return;
      }
    }
    setError('');

    // Chaves = RÓTULOS configurados (viram os cabeçalhos do CSV, na ordem dos
    // campos). Dois campos com o mesmo rótulo caem na mesma coluna.
    const leadFields: Record<string, string> = {};
    for (const field of activeFields) leadFields[field.label.trim()] = (values[field.id] ?? '').trim();
    leadFields['Prêmio'] = prizeLabel;

    const lead: Lead = {
      fields: leadFields,
      score: 0,
      terminalId: terminalId(),
      themeId: 'roleta',
      timestamp: new Date().toISOString(),
    };

    try {
      await saveLead(lead);
      setSent(true);
      closeTimer.current = setTimeout(onClose, 1600);
    } catch {
      setError('Não foi possível salvar. Tente novamente.');
    }
  }

  const inputStyle = [
    styles.input,
    {
      color: palette.text,
      backgroundColor: palette.surface,
      borderColor: palette.border,
      borderRadius: palette.radius.control,
      fontFamily,
    },
  ];

  function renderField(field: LeadField) {
    const value = values[field.id] ?? '';
    const label = field.label + (field.required ? ' *' : '');

    if (field.type === 'checkbox') {
      return (
        <View
          key={field.id}
          style={[styles.checkboxRow, { backgroundColor: palette.surface, borderColor: palette.border, borderRadius: palette.radius.control }]}
        >
          <Text style={[styles.checkboxLabel, { color: palette.text, fontFamily }]}>{label}</Text>
          <Switch value={value === 'sim'} onValueChange={(v) => setValue(field.id, v ? 'sim' : '')} />
        </View>
      );
    }

    if (field.type === 'select') {
      return (
        <View key={field.id} style={styles.selectWrap}>
          <Text style={[styles.selectLabel, { color: palette.textMuted, fontFamily }]}>{label}</Text>
          <View style={styles.selectOptions}>
            {(field.options ?? []).map((opt) => {
              const active = value === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => setValue(field.id, active ? '' : opt)}
                  style={[
                    styles.selectChip,
                    {
                      backgroundColor: active ? palette.primary : palette.surface,
                      borderColor: palette.border,
                      borderRadius: palette.radius.control,
                    },
                  ]}
                >
                  <Text style={{ color: active ? palette.primaryText : palette.text, fontFamily, fontSize: 14 }}>{opt}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    }

    return (
      <TextInput
        key={field.id}
        value={value}
        onChangeText={(t) => setValue(field.id, t)}
        placeholder={label}
        placeholderTextColor={palette.textMuted}
        autoCapitalize={field.type === 'email' ? 'none' : 'words'}
        keyboardType={field.type === 'email' ? 'email-address' : field.type === 'tel' ? 'phone-pad' : 'default'}
        inputMode={field.type === 'email' ? 'email' : field.type === 'tel' ? 'tel' : 'text'}
        maxLength={field.maxLength ?? 80}
        style={inputStyle}
      />
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: palette.background, borderColor: palette.border, borderRadius: palette.radius.card },
          ]}
        >
          {sent ? (
            <Text style={[styles.thanks, { color: palette.text, fontFamily }]}>Obrigado! 🎉</Text>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.form}>
              <Text style={[styles.title, { color: palette.text, fontFamily }]}>Cadastre-se para resgatar</Text>
              {prizeLabel ? (
                <Text style={[styles.prize, { color: palette.primary, fontFamily }]} numberOfLines={2}>
                  {prizeLabel}
                </Text>
              ) : null}

              {activeFields.map(renderField)}

              {error ? <Text style={[styles.error, { fontFamily }]}>{error}</Text> : null}

              <Pressable
                onPress={() => void handleSubmit()}
                style={[styles.submit, { backgroundColor: palette.primary, borderRadius: palette.radius.control }]}
              >
                <Text style={[styles.submitText, { color: palette.primaryText, fontFamily }]}>Enviar</Text>
              </Pressable>
              <Pressable onPress={onClose} style={styles.skip}>
                <Text style={[styles.skipText, { color: palette.textMuted, fontFamily }]}>Agora não</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: { width: '100%', maxWidth: 400, borderWidth: 1, padding: 22, maxHeight: '90%' },
  form: { gap: 12 },
  title: { fontSize: 20, textAlign: 'center' },
  prize: { fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  input: { fontSize: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, minHeight: 48 },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 48,
    gap: 12,
  },
  checkboxLabel: { fontSize: 15, flex: 1 },
  selectWrap: { gap: 6 },
  selectLabel: { fontSize: 13 },
  selectOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: { paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1 },
  error: { color: '#F87171', fontSize: 14, textAlign: 'center' },
  submit: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  submitText: { fontSize: 17, fontWeight: '700' },
  skip: { alignItems: 'center', paddingVertical: 10 },
  skipText: { fontSize: 14 },
  thanks: { fontSize: 26, textAlign: 'center', paddingVertical: 28 },
});
