import type { RouletteConfig, Segment } from '@/types';
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

export const DEFAULT_CONFIG: RouletteConfig = {
  title: 'Minha Roleta',
  segments: DEFAULT_SEGMENTS,
  fontFamily: 'Poppins',
  spinDurationMs: 4500,
  hapticsEnabled: true,
  theme: 'dark',
  verticalText: false,
  pointerType: 'shape',
  pointerEmoji: '🧯',
};

export const STORAGE_KEY = '@roleta/config:v1';

export const LIMITS = {
  minSegments: 2,
  maxSegments: 16,
  minSpinMs: 2000,
  maxSpinMs: 8000,
  spinStepMs: 500,
};
