/** Decide se o texto sobre uma cor deve ser claro ou escuro (contraste). */
export function readableTextColor(hex: string): string {
  const c = hex.replace('#', '');
  const full = c.length === 3
    ? c.split('').map((ch) => ch + ch).join('')
    : c;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  // Luminância relativa (perceptual).
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#0F172A' : '#FFFFFF';
}
