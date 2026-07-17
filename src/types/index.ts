/**
 * Tipos centrais da aplicação.
 */

export type ThemeMode = 'light' | 'dark';

export type FontKey = 'Poppins' | 'Inter' | 'Nunito' | 'Montserrat';

/** Tipo de ponteiro (seta) que aponta o prêmio. */
export type PointerType = 'shape' | 'emoji' | 'image';

/** Animação exibida ao vencer. */
export type WinAnimationType = 'confetti' | 'fireworks' | 'stars' | 'coins' | 'hearts' | 'fire';

/** Tipo de um campo do formulário de lead (mesmo modelo do Kiosk Maze). */
export type LeadFieldType = 'text' | 'email' | 'tel' | 'select' | 'checkbox';

/** Um campo do formulário de lead, configurável nas Configurações. */
export interface LeadField {
  id: string;
  label: string;
  type: LeadFieldType;
  required: boolean;
  maxLength?: number;
  /** Opções quando type === 'select'. */
  options?: string[];
}

/** Um setor (fatia) da roleta. */
export interface Segment {
  id: string;
  label: string;
  /** Cor de preenchimento da fatia (hex). */
  color: string;
  /** Imagem opcional (data URI) exibida dentro da fatia. */
  image?: string;
  /**
   * Peso do setor (chance relativa E tamanho do arco). Ausente = 1.
   * Peso 2 tem o dobro da chance (e do arco) de um peso 1.
   */
  weight?: number;
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
  /** Cor global do texto (sobrepõe a do tema). */
  textColor?: string;
  /** Cor global dos botões (sobrepõe a primária do tema). */
  buttonColor?: string;
  /** Arredondamento global dos cantos (px base). */
  cornerRadius: number;
  /** Animação ao vencer (padrão: confete). */
  winAnimation: WinAnimationType;
  /** Orientação dos rótulos: vertical (radial) quando true. */
  verticalText: boolean;
  /** Escala global do texto (título, rótulos e resultado). Ausente = 1. */
  textScale?: number;
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
  /** Captura de lead após o giro (opcional para não quebrar configs salvas). */
  leadCaptureEnabled?: boolean;
  /** Campos do formulário de lead (ausente/vazio = campos padrão). */
  leadFields?: LeadField[];
}

/** Resultado de um giro. */
export interface SpinResult {
  /** Rotação final absoluta (graus) usada pela animação. */
  targetRotation: number;
  /** Índice do setor vencedor dentro de `segments`. */
  winnerIndex: number;
}
