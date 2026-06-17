import type { SpinResult } from '@/types';

/**
 * Lógica de giro da roleta (independente de UI).
 *
 * O ponteiro fica fixo no topo (0°). A roleta gira no sentido horário por
 * `targetRotation` graus. Após o giro, o setor sob o ponteiro é o vencedor.
 */

const MIN_FULL_TURNS = 5;
const EXTRA_TURNS_RANGE = 4;

/** Descobre qual setor está sob o ponteiro dada uma rotação absoluta. */
export function winnerFromRotation(rotation: number, count: number): number {
  const seg = 360 / count;
  // Posição inicial do setor que terminou no topo.
  const normalized = ((360 - (rotation % 360)) % 360 + 360) % 360;
  return Math.floor(normalized / seg) % count;
}

/**
 * Calcula um giro aleatório e justo: várias voltas completas + um ângulo
 * aleatório. O vencedor é derivado da rotação final (sem viés).
 */
export function computeSpin(currentRotation: number, count: number): SpinResult {
  const fullTurns = MIN_FULL_TURNS + Math.floor(Math.random() * (EXTRA_TURNS_RANGE + 1));
  const randomAngle = Math.random() * 360;
  const targetRotation = currentRotation + fullTurns * 360 + randomAngle;
  return {
    targetRotation,
    winnerIndex: winnerFromRotation(targetRotation, count),
  };
}
