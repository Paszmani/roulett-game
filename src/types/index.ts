/**
 * Tipos centrais da aplicação.
 */

export type ThemeMode = 'light' | 'dark';

export type FontKey = 'Poppins' | 'Inter' | 'Nunito' | 'Montserrat';

/** Tipo de ponteiro (seta) que aponta o prêmio. */
export type PointerType = 'shape' | 'emoji' | 'image';

/** Animação exibida ao vencer. */
export type WinAnimationType = 'confetti' | 'fireworks' | 'stars' | 'coins' | 'hearts' | 'fire';

/**
 * Efeito visual durante o GIRO (distinto da celebração de vitória). Abrange as
 * três fases: fundo, roleta e a parada. 'none' = comportamento padrão.
 * 'fire' ("Chamas"): fogo no fundo + anel de fogo na roleta enquanto gira e,
 * ao parar, extintores apagam as chamas antes de revelar o resultado.
 */
export type SpinEffect = 'none' | 'fire';

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

/**
 * Personalização opcional da tela de resultado de uma fatia. Cada campo cai no
 * padrão quando ausente; a seção só é aplicada quando `enabled` é true.
 */
export interface SegmentResultOverride {
  /** Liga a tela personalizada. Quando false, o resultado usa o padrão global. */
  enabled: boolean;
  /** Texto alternativo (aceita quebras de linha). Vazio = usa o `label` da fatia. */
  text?: string;
  /** Imagem própria da tela de resultado (data URI), exibida abaixo do texto. */
  image?: string;
  /** Animação específica desta fatia. Ausente = usa `config.winAnimation`. */
  animation?: WinAnimationType;
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
  /** Tela de resultado personalizada (opcional). Ausente = resultado padrão. */
  resultOverride?: SegmentResultOverride;
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
  /** Efeito visual do giro (opcional, personalização). Ausente/'none' = padrão. */
  spinEffect?: SpinEffect;
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
