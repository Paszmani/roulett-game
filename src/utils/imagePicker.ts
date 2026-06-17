import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export interface PickImageResult {
  status: 'ok' | 'canceled' | 'denied' | 'error';
  /** Data URI (data:image/jpeg;base64,...) pronto para usar em <Image>/SVG. */
  dataUri?: string;
}

export interface PickImageOptions {
  /** Força recorte quadrado (ideal para fatias e logo). Padrão: true. */
  square?: boolean;
  /** Lado máximo (px) da imagem processada. Mantém o armazenamento leve. Padrão: 600. */
  maxSize?: number;
  /**
   * Formato de saída. `png` preserva transparência (logos/figurinhas);
   * `jpeg` é menor mas pinta o fundo de transparência. Padrão: 'png'.
   */
  format?: 'png' | 'jpeg';
}

/**
 * Abre a galeria do dispositivo, deixa o usuário recortar e
 * redimensiona/comprime a imagem para se adaptar a qualquer resolução.
 * Retorna um data URI persistível (funciona em Android e Web).
 */
export async function pickImage(options: PickImageOptions = {}): Promise<PickImageResult> {
  const { square = true, maxSize = 600, format = 'png' } = options;
  try {
    // Permissão (no-op na web).
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return { status: 'denied' };

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      // Recorte no Android/iOS (ignorado na web — o ajuste de "cover/slice" compensa).
      allowsEditing: Platform.OS !== 'web',
      aspect: square ? [1, 1] : undefined,
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return { status: 'canceled' };

    const uri = result.assets[0].uri;

    // Redimensiona pelo maior lado preservando proporção e comprime para base64.
    const asset = result.assets[0];
    const resizeBy =
      (asset.width ?? 0) >= (asset.height ?? 0) ? { width: maxSize } : { height: maxSize };

    const isPng = format === 'png';
    const context = ImageManipulator.manipulate(uri);
    context.resize(resizeBy);
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      // `compress` só afeta JPEG; PNG é sem perdas (preserva transparência).
      compress: isPng ? 1 : 0.7,
      format: isPng ? SaveFormat.PNG : SaveFormat.JPEG,
      base64: true,
    });

    if (!saved.base64) return { status: 'error' };
    const mime = isPng ? 'image/png' : 'image/jpeg';
    return { status: 'ok', dataUri: `data:${mime};base64,${saved.base64}` };
  } catch (err) {
    console.warn('Falha ao selecionar imagem:', err);
    return { status: 'error' };
  }
}
