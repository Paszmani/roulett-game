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
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

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

// --- CSV (união de colunas; formato comum aos três jogos) --------------------
//
// Desenho pensado para o Excel pt-BR: separador `;` (o padrão da localidade —
// com vírgula tudo cai numa coluna só), BOM UTF-8 (acentuação correta),
// data/hora locais em colunas separadas (dd/mm/aaaa + hh:mm:ss, prontas para
// filtro/ordenação) e cabeçalhos em português. Linhas em ordem cronológica.
// O MESMO formato é gerado pelo Electron (electron/main.cjs) para data/leads.

const META_COLUMNS = ['data', 'hora', 'terminal', 'jogo', 'pontuacao'] as const;
const CSV_SEP = ';';

/** BOM (U+FEFF) para o Excel abrir UTF-8 com acentuação correta. */
export const CSV_BOM = String.fromCharCode(0xfeff);

/** Escapa uma célula conforme RFC 4180 (aspas/separador/quebra de linha). */
function csvCell(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** ISO 8601 -> [dd/mm/aaaa, hh:mm:ss] no fuso local (vazio se inválido). */
function localDateTime(iso: string): [string, string] {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return [iso, ''];
  return [
    `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`,
    `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`,
  ];
}

export function leadsToCsv(leads: Lead[]): string {
  const sorted = [...leads].sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const fieldIds: string[] = [];
  for (const lead of sorted) {
    for (const id of Object.keys(lead.fields)) {
      if (!fieldIds.includes(id)) fieldIds.push(id);
    }
  }

  const header = [...META_COLUMNS, ...fieldIds];
  const rows = sorted.map((lead) => {
    const [data, hora] = localDateTime(lead.timestamp);
    return [
      data,
      hora,
      lead.terminalId,
      lead.themeId,
      String(lead.score),
      ...fieldIds.map((id) => lead.fields[id] ?? ''),
    ];
  });

  return [header, ...rows].map((row) => row.map(csvCell).join(CSV_SEP)).join('\r\n');
}

function csvFileName(): string {
  const d = new Date();
  return `leads-roleta-${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.csv`;
}

export type ExportResult = 'kiosk' | 'downloaded' | 'shared' | 'empty' | 'unsupported';

/**
 * Exporta os leads conforme a plataforma (mesmo produto do Kiosk Maze):
 * - Electron: abre a pasta `data/leads` (o CSV consolidado já mora lá);
 * - Android/iOS: grava o CSV no cache e abre a folha de compartilhamento
 *   nativa (e-mail, Drive, WhatsApp...);
 * - Web/PWA: baixa o CSV.
 */
export async function exportLeads(): Promise<ExportResult> {
  const kiosk = getKiosk();
  if (kiosk) {
    await kiosk.revealLeads();
    return 'kiosk';
  }

  const leads = await getStoredLeads();
  if (leads.length === 0) return 'empty';
  const csv = CSV_BOM + leadsToCsv(leads);

  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return 'unsupported';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return 'downloaded';
  }

  // Nativo: como no maze-game, o caminho é COMPARTILHAR o CSV direto do
  // aparelho (e-mail/Drive/WhatsApp) — não há "abrir pasta" no Android.
  if (!(await Sharing.isAvailableAsync())) return 'unsupported';
  const file = new File(Paths.cache, csvFileName());
  if (file.exists) file.delete();
  file.create();
  file.write(csv);
  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Compartilhar leads (CSV)',
    UTI: 'public.comma-separated-values-text',
  });
  return 'shared';
}
