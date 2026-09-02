import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { RadarCanvas } from '../components/RadarCanvas';
import { NearbySheet } from '../components/NearbySheet';
import { StatusComposer } from '../components/StatusComposer';
import { useSession } from '../context/SessionContext';
import { PRESENCE_POLL_MS, COLORS } from '../utils/constants';
import { metersToFeet } from '../utils/geo';
import { pushStatus, sendLike } from '../services/presence';
import { notifyIncomingLike, subscribeToLikes } from '../services/notifications';
import { startBackgroundLocation } from '../services/locationEngine';
import type { NearbyVibe } from '../types';

export function RadarScreen() {
  const { profile, track, nearby, lastError, setProfile, refreshHeartbeat } = useSession();
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<NearbyVibe | null>(null);
  const [statusDraft, setStatusDraft] = useState(profile?.status ?? '');
  const [liking, setLiking] = useState(false);
  const size = Math.min(Dimensions.get('window').width - 8, 420);

  useEffect(() => {
    void refreshHeartbeat();
    void startBackgroundLocation().catch(() => undefined);
    const timer = setInterval(() => {
      void refreshHeartbeat();
    }, PRESENCE_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshHeartbeat]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    const channel = subscribeToLikes(profile.hashedId, (distanceFt) => {
      void notifyIncomingLike(distanceFt);
    });
    return () => {
      void channel.unsubscribe();
    };
  }, [profile]);

  if (!profile) {
    return null;
  }

  const onSelect = (vibe: NearbyVibe) => {
    setSelected(vibe);
    sheetRef.current?.snapToIndex(0);
    void Haptics.selectionAsync();
  };

  const onSubmitStatus = async () => {
    const next = { ...profile, status: statusDraft.trim() };
    await setProfile(next);
    try {
      await pushStatus(profile.hashedId, next.status);
    } catch {
      // Heartbeat will retry the full payload.
    }
  };

  const onLike = async () => {
    if (!selected) {
      return;
    }
    setLiking(true);
    try {
      await sendLike(profile.hashedId, selected.spotify_id, Math.round(metersToFeet(selected.distance_m)));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      sheetRef.current?.close();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLiking(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.sky, COLORS.meadow, COLORS.parchment]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <View style={styles.header}>
            <Text style={styles.kicker}>LOCALVIBE</Text>
            <Text style={styles.title}>Campus radar</Text>
            <Text style={styles.meta}>
              {track?.title ? `You’re on ${track.title}` : 'Play something on Spotify to glow'}
            </Text>
            {lastError ? <Text style={styles.error}>{lastError}</Text> : null}
          </View>

          <View style={styles.radar}>
            {nearby.length === 0 ? (
              <View style={styles.emptyHint} pointerEvents="none">
                <Text style={styles.emptyText}>Listening for vibes within 300 ft…</Text>
              </View>
            ) : null}
            <RadarCanvas
              size={size}
              me={profile}
              myColor={track?.albumColor ?? null}
              nearby={nearby}
              onSelect={onSelect}
            />
          </View>

          <StatusComposer value={statusDraft} onChange={setStatusDraft} onSubmit={() => void onSubmitStatus()} />
          {!track && !lastError ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.cta} />
            </View>
          ) : null}
        </KeyboardAvoidingView>
        <NearbySheet ref={sheetRef} vibe={selected} onLike={() => void onLike()} liking={liking} />
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  kicker: {
    color: COLORS.cta,
    fontWeight: '800',
    letterSpacing: 2,
    fontSize: 11,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.ink,
  },
  meta: {
    marginTop: 4,
    color: COLORS.muted,
    fontWeight: '600',
  },
  error: {
    marginTop: 6,
    color: '#C62828',
    fontSize: 12,
  },
  radar: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyHint: {
    position: 'absolute',
    alignSelf: 'center',
    top: 18,
    zIndex: 2,
  },
  emptyText: {
    color: COLORS.muted,
    fontWeight: '600',
  },
  loadingRow: {
    alignItems: 'center',
    paddingBottom: 8,
  },
});
