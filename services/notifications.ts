import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted || settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('likes', {
      name: 'Track likes',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  return asked.granted;
}

export async function notifyIncomingLike(distanceFt: number): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'LocalVibe',
      body: `Someone ${distanceFt} ft away liked your track!`,
      sound: true,
    },
    trigger: null,
  });
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
