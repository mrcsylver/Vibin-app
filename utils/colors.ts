import { getColors } from 'react-native-image-colors';
import { COLORS } from './constants';

function pickFromResult(result: Awaited<ReturnType<typeof getColors>>): string {
  if (result.platform === 'android' || result.platform === 'web') {
    return result.vibrant || result.dominant || COLORS.fallbackAura;
  }
  if (result.platform === 'ios') {
    return result.primary || result.background || COLORS.fallbackAura;
  }
  return COLORS.fallbackAura;
}

/** Pull a glow color from album art. Falls back to a soft lilac if sampling fails. */
export async function extractAlbumColor(imageUrl: string | null): Promise<string> {
  if (!imageUrl) {
    return COLORS.fallbackAura;
  }

  try {
    const result = await getColors(imageUrl, {
      fallback: COLORS.fallbackAura,
      cache: true,
      key: imageUrl,
    });
    return pickFromResult(result);
  } catch {
    return COLORS.fallbackAura;
  }
}
