import type { FontKey, ThemeMode } from '@/types';

/** Paleta de cores por tema (claro/escuro). */
export const palettes: Record<ThemeMode, {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  accent: string;
  pointer: string;
}> = {
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceAlt: '#334155',
    text: '#F8FAFC',
    textMuted: '#94A3B8',
    border: '#334155',
    primary: '#7C3AED',
    primaryText: '#FFFFFF',
    accent: '#F59E0B',
    pointer: '#F8FAFC',
  },
  light: {
    background: '#F1F5F9',
    surface: '#FFFFFF',
    surfaceAlt: '#F8FAFC',
    text: '#0F172A',
    textMuted: '#64748B',
    border: '#E2E8F0',
    primary: '#7C3AED',
    primaryText: '#FFFFFF',
    accent: '#D97706',
    pointer: '#0F172A',
  },
};

export type Palette = (typeof palettes)[ThemeMode];

/** Emojis sugeridos para o ponteiro da roleta. */
export const POINTER_EMOJIS: string[] = [
  '🧯', '👇', '🔻', '⬇️', '📍', '🎯',
  '⭐', '🏆', '🔥', '❤️', '✨', '🎉',
  '👑', '🚀', '🎁', '⚡',
];

/** Cores sugeridas para o plano de fundo da tela (escuros, tons ricos e claros suaves). */
export const BACKGROUND_PALETTE: string[] = [
  // Escuros / neutros
  '#0F172A', '#111827', '#0B1120', '#1C1917',
  // Tons profundos (jewel tones)
  '#1E1B4B', '#172554', '#0C4A6E', '#064E3B',
  '#3B0764', '#4A044E', '#581C2C', '#7C2D12',
  // Claros / pastéis
  '#F8FAFC', '#F1F5F9', '#FEF3C7', '#FCE7F3',
  '#E0F2FE', '#DCFCE7', '#EDE9FE', '#FFE4E6',
];

/**
 * Paleta de cores para os setores da roleta.
 * Conjunto amplo e harmônico: vibrantes + tons escuros e claros para variar.
 */
export const SEGMENT_PALETTE: string[] = [
  // Vibrantes (500)
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#64748B',
  // Escuros (700) para contraste
  '#B91C1C', '#C2410C', '#A16207', '#15803D',
  '#0F766E', '#0369A1', '#1D4ED8', '#4338CA',
  '#7E22CE', '#BE185D',
  // Claros / pastéis
  '#FCA5A5', '#FDBA74', '#FDE68A', '#BEF264',
  '#86EFAC', '#5EEAD4', '#7DD3FC', '#A5B4FC',
  '#D8B4FE', '#F9A8D4',
];

/** Nome real da família de fontes carregada (deve casar com os pesos do _layout). */
export const FONT_FAMILIES: Record<FontKey, string> = {
  Poppins: 'Poppins_600SemiBold',
  Inter: 'Inter_600SemiBold',
  Nunito: 'Nunito_700Bold',
  Montserrat: 'Montserrat_600SemiBold',
};

export const FONT_OPTIONS: FontKey[] = ['Poppins', 'Inter', 'Nunito', 'Montserrat'];
