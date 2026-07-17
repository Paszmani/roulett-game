import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RouletteConfig } from '@/types';
import { DEFAULT_CONFIG, STORAGE_KEY } from '@/constants/defaults';

/** Espera após a última mudança antes de gravar (agrupa rajadas de edição). */
const PERSIST_DEBOUNCE_MS = 400;

/**
 * Carrega/persiste a configuração da roleta no armazenamento local
 * (AsyncStorage no Android / localStorage no Web).
 *
 * A gravação é DEBOUNCED: a config pode carregar imagens em data-URI (vários
 * MB), e serializar tudo a cada tecla/passo de slider nas Configurações trava
 * a UI. O estado em memória atualiza na hora; o disco recebe a última versão
 * ~400 ms depois da última mudança.
 */
export function useRouletteStorage() {
  const [config, setConfigState] = useState<RouletteConfig>(DEFAULT_CONFIG);
  const [hydrated, setHydrated] = useState(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingConfig = useRef<RouletteConfig | null>(null);

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

  const flushPersist = useCallback(() => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
    }
    const pending = pendingConfig.current;
    pendingConfig.current = null;
    if (pending) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pending)).catch((err) =>
        console.warn('Falha ao salvar config da roleta:', err),
      );
    }
  }, []);

  // Grava o que estiver pendente ao desmontar (ex.: sair das Configurações).
  useEffect(() => flushPersist, [flushPersist]);

  // Atualiza o estado na hora; agenda a gravação debounced.
  const setConfig = useCallback(
    (updater: RouletteConfig | ((prev: RouletteConfig) => RouletteConfig)) => {
      setConfigState((prev) => {
        const next = typeof updater === 'function' ? (updater as (p: RouletteConfig) => RouletteConfig)(prev) : updater;
        pendingConfig.current = next;
        if (persistTimer.current) clearTimeout(persistTimer.current);
        persistTimer.current = setTimeout(flushPersist, PERSIST_DEBOUNCE_MS);
        return next;
      });
    },
    [flushPersist],
  );

  return { config, setConfig, hydrated };
}
