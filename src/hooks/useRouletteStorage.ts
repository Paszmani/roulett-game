import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RouletteConfig } from '@/types';
import { DEFAULT_CONFIG, STORAGE_KEY } from '@/constants/defaults';

/**
 * Carrega/persiste a configuração da roleta no armazenamento local
 * (AsyncStorage no Android / localStorage no Web).
 */
export function useRouletteStorage() {
  const [config, setConfigState] = useState<RouletteConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);

  // Carrega na inicialização.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (active && raw) {
          const parsed = JSON.parse(raw) as Partial<RouletteConfig>;
          setConfigState({ ...DEFAULT_CONFIG, ...parsed });
        }
      } catch (err) {
        console.warn('Falha ao carregar config da roleta:', err);
      } finally {
        if (active) setHydrated(true);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Persiste a cada mudança (após hidratar).
  const setConfig = useCallback(
    (updater: RouletteConfig | ((prev: RouletteConfig) => RouletteConfig)) => {
      setConfigState((prev) => {
        const next = typeof updater === 'function' ? (updater as (p: RouletteConfig) => RouletteConfig)(prev) : updater;
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch((err) =>
          console.warn('Falha ao salvar config da roleta:', err),
        );
        return next;
      });
    },
    [],
  );

  return { config, setConfig, hydrated };
}
