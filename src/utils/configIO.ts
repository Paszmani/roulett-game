/**
 * Exportação/importação do tema (a RouletteConfig completa) como arquivo JSON
 * — o análogo do theme.json do Kiosk Maze. Funciona em TODAS as plataformas:
 *
 * - Web/Electron: download/upload via âncora e <input type=file>;
 * - Android/iOS: grava no cache e abre a folha nativa de compartilhamento
 *   (mesmo caminho do CSV de leads) / seletor de documentos do sistema.
 *
 * As imagens (fatias/logo/fundo/ponteiro) já viajam DENTRO do JSON: o
 * imagePicker as converte para data-URI na escolha — nada extra a embutir.
 */

import { Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { RouletteConfig, Segment } from '@/types';
import { DEFAULT_CONFIG, createId } from '@/constants/defaults';
import { SEGMENT_PALETTE } from '@/constants/theme';

export type ExportThemeResult = 'downloaded' | 'shared' | 'unsupported';
export type ImportThemeResult =
  | { status: 'ok'; config: RouletteConfig }
  | { status: 'cancelled' }
  | { status: 'invalid' }
  | { status: 'unsupported' };

const FILE_NAME = 'roleta-tema.json';

function isWebDocument(): boolean {
  return Platform.OS === 'web' && typeof document !== 'undefined';
}

export async function exportThemeFile(config: RouletteConfig): Promise<ExportThemeResult> {
  const json = JSON.stringify(config, null, 2);

  if (isWebDocument()) {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = FILE_NAME;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  // Nativo: mesmo caminho do CSV de leads — grava no cache e compartilha
  // (e-mail/Drive/WhatsApp). O destinatário importa o arquivo em outro totem.
  if (!(await Sharing.isAvailableAsync())) return 'unsupported';

  const file = new File(Paths.cache, FILE_NAME);
  if (file.exists) file.delete();
  file.create();
  file.write(json);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: 'Compartilhar tema (JSON)',
    UTI: 'public.json',
  });

  return 'shared';
}

/** Saneia um segmento vindo de JSON externo (não confiável). */
function sanitizeSegment(raw: unknown, index: number): Segment | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const label = typeof s.label === 'string' ? s.label : '';
  const color = typeof s.color === 'string' && s.color ? s.color : SEGMENT_PALETTE[index % SEGMENT_PALETTE.length];
  const seg: Segment = {
    id: typeof s.id === 'string' && s.id ? s.id : createId(),
    label,
    color,
  };
  if (typeof s.image === 'string') seg.image = s.image;
  if (typeof s.weight === 'number' && Number.isFinite(s.weight) && s.weight >= 1) {
    seg.weight = Math.min(10, Math.round(s.weight));
  }
  return seg;
}

/**
 * Valida o JSON importado e o resolve sobre o DEFAULT_CONFIG (campo ausente
 * cai no padrão — mesma regra do resolveTheme do Kiosk Maze: um tema
 * incompleto nunca quebra o app).
 */
export function resolveImportedTheme(raw: unknown): RouletteConfig | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.segments)) return null;
  const segments = obj.segments
    .map((s, i) => sanitizeSegment(s, i))
    .filter((s): s is Segment => s !== null);
  if (segments.length < 2) return null;
  return { ...DEFAULT_CONFIG, ...(obj as Partial<RouletteConfig>), segments };
}

function parseTheme(text: string): RouletteConfig | null {
  try {
    return resolveImportedTheme(JSON.parse(text));
  } catch {
    return null;
  }
}

export function importThemeFile(): Promise<ImportThemeResult> {
  if (isWebDocument()) {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) {
          resolve({ status: 'cancelled' });
          return;
        }
        const config = parseTheme(await file.text());
        resolve(config ? { status: 'ok', config } : { status: 'invalid' });
      };
      // Nem todo ambiente dispara 'cancel'; quando dispara, avisamos.
      input.addEventListener('cancel', () => resolve({ status: 'cancelled' }));
      input.click();
    });
  }

  // Nativo: seletor de documentos do sistema. `type` amplo de propósito —
  // apps de e-mail/WhatsApp gravam .json com MIME genérico e um filtro
  // estrito esconderia o arquivo; a validação real é o parse.
  return (async (): Promise<ImportThemeResult> => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', 'application/octet-stream'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (picked.canceled) return { status: 'cancelled' };
    const uri = picked.assets[0]?.uri;
    if (!uri) return { status: 'cancelled' };
    try {
      const config = parseTheme(await new File(uri).text());
      return config ? { status: 'ok', config } : { status: 'invalid' };
    } catch {
      return { status: 'invalid' };
    }
  })();
}
