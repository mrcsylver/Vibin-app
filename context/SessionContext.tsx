import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { NearbyVibe, NowPlaying, Profile } from '../types';
import { loadProfile, saveProfile } from '../services/storage';
import { syncHeartbeat } from '../services/locationEngine';

type SessionValue = {
  ready: boolean;
  profile: Profile | null;
  track: NowPlaying | null;
  nearby: NearbyVibe[];
  coords: { latitude: number; longitude: number } | null;
  lastError: string | null;
  setProfile: (profile: Profile) => Promise<void>;
  refreshHeartbeat: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [track, setTrack] = useState<NowPlaying | null>(null);
  const [nearby, setNearby] = useState<NearbyVibe[]>([]);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const persistProfile = useCallback(async (next: Profile) => {
    await saveProfile(next);
    setProfileState(next);
  }, []);

  const refreshHeartbeat = useCallback(async () => {
    try {
      const result = await syncHeartbeat();
      if (!result) {
        return;
      }
      setProfileState(result.profile);
      setTrack(result.track);
      setNearby(result.nearby);
      setCoords(result.coords);
      setLastError(null);
    } catch (err) {
      setLastError(err instanceof Error ? err.message : 'Could not refresh nearby vibes.');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadProfile();
      if (!cancelled) {
        setProfileState(stored);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      ready,
      profile,
      track,
      nearby,
      coords,
      lastError,
      setProfile: persistProfile,
      refreshHeartbeat,
    }),
    [ready, profile, track, nearby, coords, lastError, persistProfile, refreshHeartbeat],
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
