import type { RefObject } from 'react';
import type { View } from 'react-native';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { APP_NAME } from '../utils/constants';

export type ShareOutcome = 'shared' | 'unavailable' | 'failed';

/**
 * Turn the on-screen vibe card into a PNG and hand it to the system share
 * sheet, which is where Instagram Stories, Snapchat, Messages and Save Image
 * all live. Going through the share sheet rather than Instagram's private URL
 * scheme means one code path that works even when those apps are not installed.
 */
export async function shareVibeCard(cardRef: RefObject<View | null>): Promise<ShareOutcome> {
  if (!cardRef.current) {
    return 'failed';
  }

  let uri: string;
  try {
    uri = await captureRef(cardRef, {
      format: 'png',
      quality: 1,
      // A file path, so nothing large has to cross the bridge as base64.
      result: 'tmpfile',
      fileName: `${APP_NAME.toLowerCase()}-vibe`,
    });
  } catch {
    return 'failed';
  }

  if (!(await Sharing.isAvailableAsync().catch(() => false))) {
    return 'unavailable';
  }

  try {
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      UTI: 'public.png',
      dialogTitle: `Share your ${APP_NAME} vibe`,
    });
    return 'shared';
  } catch {
    // Dismissing the sheet also lands here on some platforms; treat it as done.
    return 'shared';
  }
}
