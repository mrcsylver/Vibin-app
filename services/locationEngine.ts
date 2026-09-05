import * as Location from 'expo-location';
import { APP_NAME } from '../utils/constants';
import { loadProfile } from './storage';
import { fetchNowPlaying } from './spotify';
import { fetchNearby, pushPresence } from './presence';
import { ensurePermissions, readPermissions } from './permissions';
import type { NearbyVibe, NowPlaying, Profile } from '../types';

export const LOCATION_TASK_NAME = 'vibin-background-location';

/** Thrown instead of expo-location's raw `DeniedForegroundLocationPermission`. */
export class LocationPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocationPermissionError';
  }
}

export type SyncResult = {
  coords: { latitude: number; longitude: number };
  track: NowPlaying;
  nearby: NearbyVibe[];
  profile: Profile;
};

/**
 * Read a position without ever tripping the OS permission error.
 *
 * A cached fix is used when it is fresh enough, which also keeps the very first
 * radar paint fast — `getCurrentPositionAsync` can take several seconds on a
 * cold GPS.
 */
async function readPosition(): Promise<{ latitude: number; longitude: number }> {
  const permissions = await readPermissions();

  if (!permissions.locationForeground) {
    throw new LocationPermissionError(
      permissions.locationBlocked
        ? `${APP_NAME} needs location access. Turn it on in Settings to appear on the radar.`
        : `${APP_NAME} needs location access to plot the 300 ft radar.`,
    );
  }
  if (!permissions.servicesEnabled) {
    throw new LocationPermissionError('Location Services are off. Turn them on to see nearby vibes.');
  }

  const cached = await Location.getLastKnownPositionAsync({ maxAge: 30_000 }).catch(() => null);
  if (cached) {
    return { latitude: cached.coords.latitude, longitude: cached.coords.longitude };
  }

  const current = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
  return { latitude: current.coords.latitude, longitude: current.coords.longitude };
}

/**
 * One heartbeat: poll Spotify, upsert presence, then query the 300 ft bubble.
 * Used by both the foreground timer and the background location task.
 */
export async function syncHeartbeat(coords?: {
  latitude: number;
  longitude: number;
}): Promise<SyncResult | null> {
  const profile = await loadProfile();
  if (!profile) {
    return null;
  }

  const position = coords ?? (await readPosition());
  const track = await fetchNowPlaying();
  await pushPresence(profile, position, track);
  const nearby = await fetchNearby(profile.hashedId, position);

  return { coords: position, track, nearby, profile };
}

export type PositionSubscription = { remove: () => void };

/**
 * Stream position updates for the map.
 *
 * Presence still goes out on the one-minute heartbeat — this is only so the
 * ground scrolls under the user as they walk instead of jumping once a minute.
 */
export async function watchPosition(
  onPosition: (coords: { latitude: number; longitude: number }) => void,
): Promise<PositionSubscription | null> {
  const permissions = await readPermissions();
  if (!permissions.locationForeground || !permissions.servicesEnabled) {
    return null;
  }

  try {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 3,
        timeInterval: 4_000,
      },
      (position) => {
        onPosition({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
    );
    return { remove: () => subscription.remove() };
  } catch {
    return null;
  }
}

export async function requestLocationPermissions(): Promise<{
  foreground: boolean;
  background: boolean;
  blocked: boolean;
}> {
  const state = await ensurePermissions();
  return {
    foreground: state.locationForeground,
    background: state.locationBackground,
    blocked: state.locationBlocked,
  };
}

/**
 * Start the background location task. No-ops unless "Always" access was granted
 * and the build actually contains the native task module (Expo Go does not).
 */
export async function startBackgroundLocation(): Promise<boolean> {
  const permissions = await readPermissions();
  if (!permissions.locationForeground || !permissions.locationBackground) {
    return false;
  }

  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (started) {
      return true;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 60_000,
      distanceInterval: 15,
      deferredUpdatesInterval: 60_000,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: `${APP_NAME} is sharing your campus vibe`,
        notificationBody: 'Presence expires 15 minutes after you go quiet.',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopBackgroundLocation(): Promise<void> {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME).catch(
    () => false,
  );
  if (started) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME).catch(() => undefined);
  }
}
