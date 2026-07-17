import type { LeadField, RouletteConfig, Segment } from '@/types';
import { SEGMENT_PALETTE } from './theme';

/** Gera um id curto e único o suficiente para uso local. */
export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

const defaultLabels = ['Prêmio 1', 'Prêmio 2', 'Prêmio 3', 'Prêmio 4', 'Prêmio 5', 'Prêmio 6'];

export const DEFAULT_SEGMENTS: Segment[] = defaultLabels.map((label, i) => ({
  id: createId(),
  label,
  color: SEGMENT_PALETTE[(i * 3) % SEGMENT_PALETTE.length],
}));

/** Campos padrão do formulário de lead (usados quando a lista está vazia). */
export const DEFAULT_LEAD_FIELDS: LeadField[] = [
  { id: 'name', label: 'Nome', type: 'text', required: true, maxLength: 60 },
  { id: 'email', label: 'E-mail', type: 'email', required: true },
  { id: 'telefone', label: 'Telefone', type: 'tel', required: false },
];

export const DEFAULT_CONFIG: RouletteConfig = {
  title: 'Minha Roleta',
  segments: DEFAULT_SEGMENTS,
  fontFamily: 'Poppins',
  spinDurationMs: 4500,
  wheelScale: 1,
  hapticsEnabled: true,
  theme: 'dark',
  cornerRadius: 14,
  winAnimation: 'confetti',
  verticalText: false,
  textScale: 1,
  pointerType: 'shape',
  pointerEmoji: '🧯',
  leadCaptureEnabled: false,
  leadFields: DEFAULT_LEAD_FIELDS,
};

export const STORAGE_KEY = '@roleta/config:v1';

export const LIMITS = {
  minSegments: 2,
  maxSegments: 16,
  minSpinMs: 2000,
  maxSpinMs: 8000,
  spinStepMs: 500,
  minWheelScale: 0.6,
  maxWheelScale: 1,
  wheelScaleStep: 0.1,
  minCornerRadius: 0,
  maxCornerRadius: 28,
  cornerRadiusStep: 4,
  minTextScale: 0.7,
  maxTextScale: 1.6,
  textScaleStep: 0.1,
  minWeight: 1,
  maxWeight: 10,
};
