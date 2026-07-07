/**
 * Captura de leads — mesma arquitetura do Kiosk Maze (pac-man).
 *
 * Um lead é um mapa `id -> valor` (respostas do formulário) mais metadados
 * fixos (terminal, jogo, score, timestamp). No Electron, o preload expõe
 * `window.kiosk` e o lead vai para o disco (JSON por lead + CSV consolidado,
 * serializados do outro lado da ponte). No navegador/PWA cai no AsyncStorage
 * (localStorage na web), com exportação de CSV via download.
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Lead {
  /** Respostas do formulário: id do campo -> valor. */
  fields: Record<string, string>;
  score: number;
  terminalId: string;
  themeId: string;
  /** ISO 8601. */
  timestamp: string;
}

export interface KioskBridge {
  isKiosk: boolean;
  getConfig(): Promise<{ terminalId: string; gameId: string }>;
  saveLead(lead: Lead): Promise<void>;
  /** Abre a pasta de leads no Explorador (para o operador copiar/exportar). */
  revealLeads(): Promise<void>;
}

declare global {
  interface Window {
    kiosk?: KioskBridge;
  }
}

/** Ponte do Electron, se presente. `undefined` no navegador e no app nativo. */
export function getKiosk(): KioskBridge | undefined {
  return typeof window !== 'undefined' ? window.kiosk : undefined;
}

const STORAGE_KEY = '@roleta/leads:v1';

export async function saveLead(lead: Lead): Promise<void> {
  const kiosk = getKiosk();
  if (kiosk) {
    await kiosk.saveLead(lead);
    return;
  }
  const all = await getStoredLeads();
  all.push(lead);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

/** Leads do armazenamento local (fora do Electron; no kiosk a fonte é o disco). */
export async function getStoredLeads(): Promise<Lead[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as Lead[]) : [];
  } catch {
    return [];
  }
}

export async function clearStoredLeads(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/** Identifica a máquina de origem do lead. `?terminal=<id>`, default 'totem-01'. */
export function terminalId(): string {
  if (typeof window === 'undefined' || !window.location) return 'app';
  const p = new URLSearchParams(window.location.search).get('terminal');
  return p && p.length > 0 ? p : 'totem-01';
}

// --- CSV (união de colunas, mesmo formato do kiosk) -------------------------

const META_COLUMNS = ['timestamp', 'terminalId', 'themeId', 'score'] as const;

/** Escapa uma célula conforme RFC 4180 (aspas/vírgula/quebra de linha). */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function leadsToCsv(leads: Lead[]): string {
  const fieldIds: string[] = [];
  for (const lead of leads) {
    for (const id of Object.keys(lead.fields)) {
      if (!fieldIds.includes(id)) fieldIds.push(id);
    }
  }

  const header = [...META_COLUMNS, ...fieldIds];
  const rows = leads.map((lead) => [
    lead.timestamp,
    lead.terminalId,
    lead.themeId,
    String(lead.score),
    ...fieldIds.map((id) => lead.fields[id] ?? ''),
  ]);

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export type ExportResult = 'kiosk' | 'downloaded' | 'empty' | 'unsupported';

/**
 * Exporta os leads: no Electron abre a pasta `data/leads` (o CSV consolidado
 * já mora lá); na web baixa um CSV com o que está no armazenamento local.
 */
export async function exportLeads(): Promise<ExportResult> {
  const kiosk = getKiosk();
  if (kiosk) {
    await kiosk.revealLeads();
    return 'kiosk';
  }
  const leads = await getStoredLeads();
  if (leads.length === 0) return 'empty';
  if (Platform.OS !== 'web' || typeof document === 'undefined') return 'unsupported';
  // BOM (U+FEFF) para o Excel pt-BR abrir com acentuação correta.
  const bom = String.fromCharCode(0xfeff);
  const blob = new Blob([bom + leadsToCsv(leads)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'leads.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return 'downloaded';
}
