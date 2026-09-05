import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import type { LikeTotals, NearbyVibe, NowPlaying, Profile } from '../types';
import { PRESENCE_POLL_MS } from '../utils/constants';
import { clearSession, loadProfile, saveProfile } from '../services/storage';
import {
  startBackgroundLocation,
  stopBackgroundLocation,
  syncHeartbeat,
  watchPosition,
  type PositionSubscription,
} from '../services/locationEngine';
import { EMPTY_LIKE_TOTALS, fetchAllTimeLikes } from '../services/likes';
import { notifyIncomingLike, subscribeToLikes } from '../services/notifications';
import { deleteMyData } from '../services/presence';
import { watchHeading, type HeadingSubscription } from '../services/heading';
import {
  ensurePermissions,
  readPermissions,
  UNKNOWN_PERMISSIONS,
  type PermissionState,
} from '../services/permissions';

type SessionValue = {
  ready: boolean;
  profile: Profile | null;
  track: NowPlaying | null;
  nearby: NearbyVibe[];
  coords: { latitude: number; longitude: number } | null;
  /** Compass heading in degrees clockwise from true north, null if unavailable. */
  heading: number | null;
  permissions: PermissionState;
  likeTotals: LikeTotals;
  lastError: string | null;
  setProfile: (profile: Profile) => Promise<void>;
  refreshHeartbeat: () => Promise<void>;
  refreshLikeTotals: () => Promise<void>;
  requestPermissions: () => Promise<PermissionState>;
  /** Erase server-side data, drop local credentials, return to onboarding. */
  deleteAccount: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [nearby, setNearby] = useState<NearbyVibe[]>([]);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [permissions, setPermissions] = useState<PermissionState>(UNKNOWN_PERMISSIONS);
  const [likeTotals, setLikeTotals] = useState<LikeTotals>(EMPTY_LIKE_TOTALS);
  const [lastError, setLastError] = useState<string | null>(null);

  const hashedId = profile?.hashedId ?? null;
  const canLocate = permissions.locationForeground;

  const persistProfile = useCallback(async (next: Profile) => {
    await saveProfile(next);
    setProfileState(next);
  }, []);

  const requestPermissions = useCallback(async () => {
    const state = await ensurePermissions();
    setPermissions(state);
    return state;
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = await loadProfile();
    if (current) {
      // Best effort: local credentials are cleared either way, so a network
      // failure can never strand the user in a signed-in state.
      await deleteMyData(current.hashedId).catch(() => undefined);
    }
    await stopBackgroundLocation().catch(() => undefined);
    await clearSession();
    setProfileState(null);
    setTrack(null);
    setNearby([]);
    setLikeTotals(EMPTY_LIKE_TOTALS);
  }, []);

  const refreshHeartbeat = useCallback(async () => {
    try {
      const result = await syncHeartbeat();
      if (!result) {
        return;
      }
      setTrack(result.track);
      setNearby(result.nearby);
      setCoords(result.coords);
      setLastError(null);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Could not refresh nearby vibes.');
    }
  }, []);

  const refreshLikeTotals = useCallback(async () => {
    if (!hashedId) {
      return;
    }
    try {
      setLikeTotals(await fetchAllTimeLikes(hashedId));
    } catch {
      // Keep the last known tally rather than flashing zeros.
    }
  }, [hashedId]);

  // --- Boot -----------------------------------------------------------------
  // A returning user goes straight to the radar, so their permissions have to be
  // settled *before* anything asks the OS for a position. Skipping this is what
  // produced DeniedForegroundLocationPermission on the radar screen.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = await loadProfile();
      if (cancelled) {
        return;
      }
      setProfileState(stored);

      // First-run users are prompted by the onboarding screen instead, once
      // they know what the app is for — prompting cold gets you denied.
      const state = stored ? await ensurePermissions() : await readPermissions();
      if (cancelled) {
        return;
      }
      setPermissions(state);
      setReady(true);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Grants can change while we are backgrounded (Settings round-trip), and a
  // user coming back from Spotify expects the track to be current immediately
  // rather than up to a minute later.
  const heartbeatRef = useRef(refreshHeartbeat);
  heartbeatRef.current = refreshHeartbeat;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void readPermissions().then(setPermissions).catch(() => undefined);
        void heartbeatRef.current();
      }
    });
    return () => subscription.remove();
  }, []);

  // Live position for the map. Presence stays on the one-minute heartbeat.
  useEffect(() => {
    if (!canLocate) {
      return;
    }

    let cancelled = false;
    let subscription: PositionSubscription | null = null;

    void watchPosition((next) => {
      if (!cancelled) {
        setCoords(next);
      }
    }).then((result) => {
      if (cancelled) {
        result?.remove();
        return;
      }
      subscription = result;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [canLocate]);

  // --- Presence heartbeat ---------------------------------------------------
  // Keyed on hashedId, not the profile object: refreshHeartbeat must never be
  // able to restart its own interval.
  useEffect(() => {
    if (!hashedId || !canLocate) {
      return;
    }

    void refreshHeartbeat();
    void startBackgroundLocation();

    const timer = setInterval(() => {
      void refreshHeartbeat();
    }, PRESENCE_POLL_MS);

    return () => clearInterval(timer);
  }, [hashedId, canLocate, refreshHeartbeat]);

  // --- Compass --------------------------------------------------------------
  useEffect(() => {
    if (!canLocate) {
      setHeading(null);
      return;
    }

    let cancelled = false;
    let subscription: HeadingSubscription | null = null;

    void watchHeading((degrees) => {
      if (!cancelled) {
        setHeading(degrees);
      }
    }).then((result) => {
      if (cancelled) {
        result?.remove();
        return;
      }
      subscription = result;
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [canLocate]);

  // --- Likes ----------------------------------------------------------------
  const likeTotalsRef = useRef(refreshLikeTotals);
  likeTotalsRef.current = refreshLikeTotals;

  useEffect(() => {
    if (!hashedId) {
      setLikeTotals(EMPTY_LIKE_TOTALS);
      return;
    }

    void likeTotalsRef.current();

    const channel = subscribeToLikes(hashedId, (distanceFt) => {
      void notifyIncomingLike(distanceFt);
      // Optimistic bump so the badge reacts instantly, then reconcile.
      setLikeTotals((current) => ({
        ...current,
        likesReceived: current.likesReceived + 1,
        recentReceived: current.recentReceived + 1,
      }));
      void likeTotalsRef.current();
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [hashedId]);

  const value = useMemo(
    () => ({
      ready,
      profile,
      track,
      nearby,
      coords,
      heading,
      permissions,
      likeTotals,
      lastError,
      setProfile: persistProfile,
      refreshHeartbeat,
      refreshLikeTotals,
      requestPermissions,
      deleteAccount,
    }),
    [
      ready,
      profile,
      track,
      nearby,
      coords,
      heading,
      permissions,
      likeTotals,
      lastError,
      persistProfile,
      refreshHeartbeat,
      refreshLikeTotals,
      requestPermissions,
      deleteAccount,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside SessionProvider');
  }
  return ctx;
}
