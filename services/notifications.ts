import * as Notifications from 'expo-notifications';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { APP_NAME } from '../utils/constants';
import { supabase } from './supabase';
import { ensurePermissions, readPermissions } from './permissions';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const state = await ensurePermissions();
  return state.notifications;
}

export async function notifyIncomingLike(distanceFt: number): Promise<void> {
  const { notifications } = await readPermissions();
  if (!notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: APP_NAME,
      body: `Someone ${distanceFt} ft away liked your track!`,
      sound: true,
    },
    trigger: null,
  }).catch(() => undefined);
}

/**
 * Subscribe to likes aimed at this device. The receiver shows a local notification;
 * no push provider or stored PII is required.
 */
export function subscribeToLikes(hashedId: string, onLike: (distanceFt: number) => void): RealtimeChannel {
  return supabase
    .channel(`likes:${hashedId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'likes',
        filter: `to_spotify_id=eq.${hashedId}`,
      },
      (payload) => {
        const row = payload.new as { distance_ft?: number };
        onLike(typeof row.distance_ft === 'number' ? row.distance_ft : 0);
      },
    )
    .subscribe();
}
