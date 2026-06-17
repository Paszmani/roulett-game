/**
 * Funções de geometria para desenhar e medir os setores da roleta em SVG.
 * Convenção de ângulos: 0° aponta para o TOPO (12h) e cresce no sentido horário.
 */

export interface Point {
  x: number;
  y: number;
}

/** Converte um ângulo (graus, 0° = topo, horário) em coordenada cartesiana. */
export function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number): Point {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

/** Gera o path SVG de uma fatia (setor circular) entre dois ângulos, no sentido horário. */
export function arcPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`,
    'Z',
  ].join(' ');
}

/** Ângulo central de um setor `index` numa roleta com `count` setores. */
export function segmentMidAngle(index: number, count: number): number {
  const seg = 360 / count;
  return index * seg + seg / 2;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Retângulo que envolve uma fatia (centro + arco). Usado para posicionar a
 * imagem de fundo da fatia de forma que ela preencha o setor por completo,
 * independentemente da quantidade de setores.
 */
export function wedgeBBox(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): Rect {
  const points: Point[] = [{ x: cx, y: cy }];
  const steps = 12;
  for (let i = 0; i <= steps; i++) {
    const a = startAngle + ((endAngle - startAngle) * i) / steps;
    points.push(polarToCartesian(cx, cy, r, a));
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
