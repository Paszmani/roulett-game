/**
 * Exportação/importação do tema (a RouletteConfig completa) como arquivo JSON
 * — o análogo do theme.json do Kiosk Maze. Funciona na web e no Electron
 * (o renderer é web); no app nativo os botões informam indisponibilidade.
 */

import { Platform } from 'react-native';
import type { RouletteConfig, Segment } from '@/types';
import { DEFAULT_CONFIG, createId } from '@/constants/defaults';
import { SEGMENT_PALETTE } from '@/constants/theme';

export type ExportThemeResult = 'ok' | 'unsupported';
export type ImportThemeResult =
  | { status: 'ok'; config: RouletteConfig }
  | { status: 'cancelled' }
  | { status: 'invalid' }
  | { status: 'unsupported' };

function isWebDocument(): boolean {
  return Platform.OS === 'web' && typeof document !== 'undefined';
}

export function exportThemeFile(config: RouletteConfig): ExportThemeResult {
  if (!isWebDocument()) return 'unsupported';
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'roleta-tema.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'ok';
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

export function importThemeFile(): Promise<ImportThemeResult> {
  if (!isWebDocument()) return Promise.resolve({ status: 'unsupported' });
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
      try {
        const config = resolveImportedTheme(JSON.parse(await file.text()));
        resolve(config ? { status: 'ok', config } : { status: 'invalid' });
      } catch {
        resolve({ status: 'invalid' });
      }
    };
    // Nem todo ambiente dispara 'cancel'; quando dispara, avisamos.
    input.addEventListener('cancel', () => resolve({ status: 'cancelled' }));
    input.click();
  });
}
