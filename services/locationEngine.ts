import * as Location from 'expo-location';
import { loadProfile } from './storage';
import { fetchNowPlaying } from './spotify';
import { fetchNearby, pushPresence } from './presence';
import type { NearbyVibe, NowPlaying, Profile } from '../types';

export const LOCATION_TASK_NAME = 'vibin-background-location';

export type SyncResult = {
  coords: { latitude: number; longitude: number };
  track: NowPlaying;
  nearby: NearbyVibe[];
  profile: Profile;
};

/**
 * One heartbeat: poll Spotify, upsert presence, then query the 300 ft bubble.
 * Used by both the foreground timer and the background location task.
 */
export async function syncHeartbeat(coords?: { latitude: number; longitude: number }): Promise<SyncResult | null> {
  const profile = await loadProfile();
  if (!profile) {
    return null;
  }

  let position = coords;
  if (!position) {
    const current = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    position = {
      latitude: current.coords.latitude,
      longitude: current.coords.longitude,
    };
  }

  const track = await fetchNowPlaying();
  await pushPresence(profile, position, track);
  const nearby = await fetchNearby(profile.hashedId, position);

  return { coords: position, track, nearby, profile };
}

export async function requestLocationPermissions(): Promise<{ foreground: boolean; background: boolean }> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return { foreground: false, background: false };
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  return { foreground: true, background: bg.status === 'granted' };
}

export async function startBackgroundLocation(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
  if (started) {
    return;
  }

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 60_000,
    distanceInterval: 15,
    deferredUpdatesInterval: 60_000,
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Vibin is sharing your campus vibe',
      notificationBody: 'Presence expires 15 minutes after you go quiet.',
    },
  });
}

export async function stopBackgroundLocation(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => false);
  if (started) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
}
