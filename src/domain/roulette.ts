import type { SpinResult } from '@/types';

/**
 * Lógica de giro da roleta (independente de UI).
 *
 * O ponteiro fica fixo no topo (0°). A roleta gira no sentido horário por
 * `targetRotation` graus. Após o giro, o setor sob o ponteiro é o vencedor.
 *
 * Setores podem ter PESOS: o arco de cada fatia é proporcional ao peso e a
 * chance de vitória idem (peso 2 = dobro da chance de peso 1). Com pesos
 * iguais o comportamento é o clássico: fatias iguais, sorteio uniforme.
 */

const MIN_FULL_TURNS = 5;
const EXTRA_TURNS_RANGE = 4;
/** Margem (fração do arco) para nunca parar em cima da divisa entre fatias. */
const EDGE_MARGIN = 0.08;

export interface SegmentArc {
  start: number;
  end: number;
  mid: number;
}

/** Arcos (graus, 0° = topo, horário) de cada setor, proporcionais aos pesos. */
export function segmentArcs(weights: number[]): SegmentArc[] {
  const total = weights.reduce((sum, w) => sum + w, 0);
  const arcs: SegmentArc[] = [];
  let cursor = 0;
  for (const w of weights) {
    const sweep = total > 0 ? (w / total) * 360 : 360 / weights.length;
    arcs.push({ start: cursor, end: cursor + sweep, mid: cursor + sweep / 2 });
    cursor += sweep;
  }
  return arcs;
}

/** Descobre qual setor está sob o ponteiro dada uma rotação absoluta. */
export function winnerFromRotation(rotation: number, weights: number[]): number {
  // Ângulo inicial do ponto que terminou no topo.
  const normalized = ((360 - (rotation % 360)) % 360 + 360) % 360;
  const arcs = segmentArcs(weights);
  for (let i = 0; i < arcs.length; i++) {
    if (normalized >= arcs[i].start && normalized < arcs[i].end) return i;
  }
  return arcs.length - 1; // normalized === 360 - ε por arredondamento
}

/** Sorteia um índice proporcionalmente aos pesos. */
function pickWeighted(weights: number[]): number {
  const total = weights.reduce((sum, w) => sum + w, 0);
  if (total <= 0) return Math.floor(Math.random() * weights.length);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r < 0) return i;
  }
  return weights.length - 1;
}

/**
 * Calcula um giro aleatório e justo: sorteia o vencedor pelos pesos, depois
 * escolhe um ponto de parada uniforme DENTRO do arco vencedor (com margem
 * para não parar na divisa) e monta a rotação com várias voltas completas.
 */
export function computeSpin(currentRotation: number, weights: number[]): SpinResult {
  const winnerIndex = pickWeighted(weights);
  const { start, end } = segmentArcs(weights)[winnerIndex];
  const sweep = end - start;
  const margin = sweep * EDGE_MARGIN;
  const landing = start + margin + Math.random() * (sweep - margin * 2);

  // Rotação final R tal que o ângulo inicial `landing` termine no topo:
  // ((360 - R) mod 360) === landing  =>  R mod 360 === (360 - landing) mod 360.
  const targetMod = (360 - landing) % 360;
  const currentMod = ((currentRotation % 360) + 360) % 360;
  const delta = (targetMod - currentMod + 360) % 360;
  const fullTurns = MIN_FULL_TURNS + Math.floor(Math.random() * (EXTRA_TURNS_RANGE + 1));

  return {
    targetRotation: currentRotation + fullTurns * 360 + delta,
    winnerIndex,
  };
}
