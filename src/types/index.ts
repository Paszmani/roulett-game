/**
 * Tipos centrais da aplicação.
 */

export type ThemeMode = 'light' | 'dark';

export type FontKey = 'Poppins' | 'Inter' | 'Nunito' | 'Montserrat';

/** Tipo de ponteiro (seta) que aponta o prêmio. */
export type PointerType = 'shape' | 'emoji' | 'image';

/** Um setor (fatia) da roleta. */
export interface Segment {
  id: string;
  label: string;
  /** Cor de preenchimento da fatia (hex). */
  color: string;
  /** Imagem opcional (data URI) exibida dentro da fatia. */
  image?: string;
}

/** Configuração completa e persistível da roleta. */
export interface RouletteConfig {
  title: string;
  segments: Segment[];
  fontFamily: FontKey;
  /** Duração da animação de giro, em milissegundos. */
  spinDurationMs: number;
  /** Escala do tamanho da roleta (fração do espaço disponível, ex.: 0.6–1.0). */
  wheelScale: number;
  hapticsEnabled: boolean;
  theme: ThemeMode;
  /** Orientação dos rótulos: vertical (radial) quando true. */
  verticalText: boolean;
  /** Aparência do ponteiro. */
  pointerType: PointerType;
  /** Emoji do ponteiro (quando pointerType === 'emoji'). */
  pointerEmoji?: string;
  /** Imagem do ponteiro, data URI (quando pointerType === 'image'). */
  pointerImage?: string;
  /** Logo opcional (data URI) exibida fixa no centro da roleta. */
  logo?: string;
  /** Cor de fundo personalizada (sobrepõe a cor do tema). */
  backgroundColor?: string;
  /** Imagem de fundo (data URI). Tem prioridade sobre a cor de fundo. */
  backgroundImage?: string;
}

/** Resultado de um giro. */
export interface SpinResult {
  /** Rotação final absoluta (graus) usada pela animação. */
  targetRotation: number;
  /** Índice do setor vencedor dentro de `segments`. */
  winnerIndex: number;
}
