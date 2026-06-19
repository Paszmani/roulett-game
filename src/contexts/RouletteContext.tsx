import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { RouletteConfig, Segment, ThemeMode } from '@/types';
import { palettes, type Palette } from '@/constants/theme';
import { createId, LIMITS } from '@/constants/defaults';
import { SEGMENT_PALETTE } from '@/constants/theme';
import { readableTextColor } from '@/utils/colors';
import { useRouletteStorage } from '@/hooks/useRouletteStorage';

/** Monta a paleta efetiva: cores do tema + ajustes do usuário + raios globais. */
function buildPalette(config: RouletteConfig): Palette {
  const base = palettes[config.theme];
  const primary = config.buttonColor ?? base.primary;
  const cr = config.cornerRadius ?? 14;
  return {
    ...base,
    text: config.textColor ?? base.text,
    primary,
    // Texto do botão sempre legível sobre a cor escolhida.
    primaryText: config.buttonColor ? readableTextColor(primary) : base.primaryText,
    radius: {
      small: Math.round(cr * 0.6),
      control: cr,
      card: Math.round(cr * 1.6),
    },
  };
}

interface RouletteContextValue {
  config: RouletteConfig;
  palette: Palette;
  hydrated: boolean;
  setConfig: ReturnType<typeof useRouletteStorage>['setConfig'];
  // Helpers de edição
  patch: (partial: Partial<RouletteConfig>) => void;
  addSegment: () => void;
  removeSegment: (id: string) => void;
  updateSegment: (id: string, partial: Partial<Segment>) => void;
  toggleTheme: () => void;
}

const RouletteContext = createContext<RouletteContextValue | null>(null);

export function RouletteProvider({ children }: { children: ReactNode }) {
  const { config, setConfig, hydrated } = useRouletteStorage();

  const value = useMemo<RouletteContextValue>(() => {
    const patch = (partial: Partial<RouletteConfig>) =>
      setConfig((prev) => ({ ...prev, ...partial }));

    const addSegment = () =>
      setConfig((prev) => {
        if (prev.segments.length >= LIMITS.maxSegments) return prev;
        const color = SEGMENT_PALETTE[prev.segments.length % SEGMENT_PALETTE.length];
        const newSegment: Segment = {
          id: createId(),
          label: `Opção ${prev.segments.length + 1}`,
          color,
        };
        return { ...prev, segments: [...prev.segments, newSegment] };
      });

    const removeSegment = (id: string) =>
      setConfig((prev) => {
        if (prev.segments.length <= LIMITS.minSegments) return prev;
        return { ...prev, segments: prev.segments.filter((s) => s.id !== id) };
      });

    const updateSegment = (id: string, partial: Partial<Segment>) =>
      setConfig((prev) => ({
        ...prev,
        segments: prev.segments.map((s) => (s.id === id ? { ...s, ...partial } : s)),
      }));

    const toggleTheme = () =>
      setConfig((prev) => ({
        ...prev,
        theme: (prev.theme === 'dark' ? 'light' : 'dark') as ThemeMode,
      }));

    return {
      config,
      palette: buildPalette(config),
      hydrated,
      setConfig,
      patch,
      addSegment,
      removeSegment,
      updateSegment,
      toggleTheme,
    };
  }, [config, hydrated, setConfig]);

  return <RouletteContext.Provider value={value}>{children}</RouletteContext.Provider>;
}

export function useRoulette(): RouletteContextValue {
  const ctx = useContext(RouletteContext);
  if (!ctx) throw new Error('useRoulette deve ser usado dentro de <RouletteProvider>.');
  return ctx;
}
