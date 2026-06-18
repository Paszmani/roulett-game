/** Expande "#abc"/"abc"/"aabbcc" para os 6 dígitos hex (sem #). */
function expandHex(hex: string): string | null {
  const c = hex.replace('#', '').trim();
  if (/^[0-9a-fA-F]{3}$/.test(c)) return c.split('').map((ch) => ch + ch).join('');
  if (/^[0-9a-fA-F]{6}$/.test(c)) return c;
  return null;
}

/** Decide se o texto sobre uma cor deve ser claro ou escuro (contraste). */
export function readableTextColor(hex: string): string {
  const full = expandHex(hex) ?? '000000';
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Luminância relativa (perceptual).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0F172A' : '#FFFFFF';
}

export interface HSL {
  h: number; // 0–360
  s: number; // 0–100
  l: number; // 0–100
}

/** Valida e normaliza para "#RRGGBB" em maiúsculas; retorna null se inválido. */
export function normalizeHex(input: string): string | null {
  const full = expandHex(input);
  return full ? `#${full.toUpperCase()}` : null;
}

export function isValidHex(input: string): boolean {
  return expandHex(input) !== null;
}

export function hexToHsl(hex: string): HSL {
  const full = expandHex(hex) ?? '000000';
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex(h: number, s: number, l: number): string {
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lN - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
