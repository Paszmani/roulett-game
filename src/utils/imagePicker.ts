import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PickImageResult {
  status: 'ok' | 'canceled' | 'denied' | 'error';
  /** Data URI (data:image/...;base64,...) pronto para usar em <Image>/SVG. */
  dataUri?: string;
}

export interface PickImageOptions {
  /** Força recorte quadrado (ideal para fatias e logo). Padrão: true. */
  square?: boolean;
  /**
   * Lado máximo (px) da imagem de saída. A imagem só é REDUZIDA quando passa
   * disso — nunca ampliada (evita borrão). Padrão: 1080.
   */
  maxSize?: number;
  /**
   * Formato de saída:
   * - `auto` (padrão): PNG se a origem tiver transparência (logo/figurinha),
   *   senão JPEG de alta qualidade (fotos — menor e nítido).
   * - `png`: força PNG (sem perdas, preserva transparência).
   * - `jpeg`: força JPEG (ideal p/ fundo/fotos).
   */
  format?: 'auto' | 'png' | 'jpeg';
  /** Qualidade do JPEG (0–1). Padrão: 0.92 (quase sem perdas). */
  quality?: number;
}

function sourceHasAlpha(asset: ImagePicker.ImagePickerAsset): boolean {
  const mime = asset.mimeType ?? '';
  if (mime.includes('png') || mime.includes('webp') || mime.includes('gif')) return true;
  return /\.(png|webp|gif)(\?|$)/i.test(asset.uri ?? '');
}

/**
 * Abre a galeria do dispositivo e devolve um data URI persistível na MAIOR
 * qualidade viável (funciona em Android e Web). Estratégia:
 * - pega o original em qualidade máxima do seletor;
 * - só reduz se for maior que `maxSize` (nunca amplia);
 * - escolhe o formato que preserva a melhor qualidade para cada caso.
 */
export async function pickImage(options: PickImageOptions = {}): Promise<PickImageResult> {
  const { square = true, maxSize = 1080, format = 'auto', quality = 0.92 } = options;
  try {
    // Permissão (no-op na web).
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { status: 'denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Recorte no Android/iOS (ignorado na web — o ajuste de "cover/slice" compensa).
      allowsEditing: Platform.OS !== 'web',
      aspect: square ? [1, 1] : undefined,
      quality: 1, // pega o original na qualidade máxima do seletor
    });

    if (result.canceled || !result.assets?.length) return { status: 'canceled' };

    const asset = result.assets[0];
    const srcW = asset.width ?? 0;
    const srcH = asset.height ?? 0;
    const maxDim = Math.max(srcW, srcH);

    // Formato: preserva PNG quando a origem tem transparência; senão JPEG nítido.
    const usePng = format === 'png' || (format === 'auto' && sourceHasAlpha(asset));

    const context = ImageManipulator.manipulate(asset.uri);
    // Só REDUZ se a origem for maior que o alvo — nunca amplia (sem borrão).
    if (maxDim > maxSize && maxDim > 0) {
      context.resize(srcW >= srcH ? { width: maxSize } : { height: maxSize });
    }

    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      base64: true,
      format: usePng ? SaveFormat.PNG : SaveFormat.JPEG,
      // `compress` só afeta JPEG; PNG é sem perdas (preserva transparência).
      compress: usePng ? 1 : Math.min(1, Math.max(0, quality)),
    });

    if (!saved.base64) return { status: 'error' };
    const mime = usePng ? 'image/png' : 'image/jpeg';
    return { status: 'ok', dataUri: `data:${mime};base64,${saved.base64}` };
  } catch (err) {
    console.warn('Falha ao selecionar imagem:', err);
    return { status: 'error' };
  }
}
