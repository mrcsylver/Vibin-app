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

/**
 * `distanceFt` is null when the nudge was noticed by the one-minute reconcile
 * rather than the live broadcast, which carries counts but no distance.
 */
export async function notifyIncomingLike(distanceFt: number | null): Promise<void> {
  const { notifications } = await readPermissions();
  if (!notifications) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: APP_NAME,
      body:
        distanceFt === null
          ? 'Someone nearby liked your track!'
          : `Someone ${distanceFt} ft away liked your track!`,
      sound: true,
    },
    trigger: null,
  }).catch(() => undefined);
}

/**
 * Subscribe to likes aimed at this device. The receiver shows a local notification;
 * no push provider or stored PII is required.
 *
 * This listens for a Realtime *broadcast* rather than a row change. Every table
 * in this schema has RLS on with no policy and no SELECT grant to `anon`, and
 * Realtime's `postgres_changes` path re-runs exactly that check as the
 * subscribing role — so a row subscription on `likes` is filtered out server
 * side and never arrives, with no error on either end. `insert_like()` emits the
 * broadcast instead, which is routed by topic and needs no read access, so the
 * tables stay locked.
 *
 * The topic carries the recipient's SHA-256 id, which is the same value the rest
 * of the app already treats as their identity.
 */
export function subscribeToLikes(hashedId: string, onLike: (distanceFt: number) => void): RealtimeChannel {
  return supabase
    .channel(`likes:${hashedId}`)
    .on('broadcast', { event: 'like' }, (message) => {
      const payload = message.payload as { distance_ft?: number } | undefined;
      const distanceFt = Number(payload?.distance_ft);
      onLike(Number.isFinite(distanceFt) ? distanceFt : 0);
    })
    .subscribe();
}
