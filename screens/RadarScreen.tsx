import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomSheet from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { RadarCanvas } from '../components/RadarCanvas';
import { NearbySheet } from '../components/NearbySheet';
import { StatusComposer } from '../components/StatusComposer';
import { ProfileModal } from '../components/ProfileModal';
import { ShareVibeModal } from '../components/ShareVibeModal';
import { useSession } from '../context/SessionContext';
import { APP_NAME, COLORS, FONTS, TILE_COLORS } from '../utils/constants';
import { metersToFeet } from '../utils/geo';
import { describePlayback } from '../utils/nowPlaying';
import { pushStatus, sendLike } from '../services/presence';
import { openAppSettings } from '../services/permissions';
import type { NearbyVibe } from '../types';

export function RadarScreen() {
  const {
    profile,
    track,
    nearby,
    coords,
    heading,
    permissions,
    likeTotals,
    lastError,
    setProfile,
    refreshLikeTotals,
    requestPermissions,
  } = useSession();

  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<NearbyVibe | null>(null);
  const [statusDraft, setStatusDraft] = useState(profile?.status ?? '');
  const [liking, setLiking] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const size = Math.min(Dimensions.get('window').width - 8, 420);

  if (!profile) {
    return null;
  }

  const locationReady = permissions.locationForeground && permissions.servicesEnabled;
  const playback = describePlayback(track);

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
      void refreshLikeTotals();
      sheetRef.current?.close();
    } catch {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLiking(false);
    }
  };

  const onFixPermissions = async () => {
    if (permissions.locationBlocked || !permissions.servicesEnabled) {
      await openAppSettings();
      return;
    }
    await requestPermissions();
  };

  const openProfile = () => {
    setProfileOpen(true);
    void refreshLikeTotals();
  };

  return (
    <LinearGradient colors={['#1B1430', '#2B1F47', '#3A2A5C']} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{APP_NAME.toUpperCase()}</Text>
              <Text style={styles.title}>Campus radar</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {playback.line}
              </Text>
            </View>

            <Pressable onPress={openProfile} style={styles.likesPill} accessibilityRole="button">
              <Text style={styles.likesHeart}>♥</Text>
              <Text style={styles.likesCount}>{likeTotals.likesReceived}</Text>
              <Text style={styles.likesCaption}>all-time</Text>
            </Pressable>
          </View>

          {playback.nudge ? <Text style={styles.nudge}>{playback.nudge}</Text> : null}
          {lastError && locationReady ? <Text style={styles.error}>{lastError}</Text> : null}

          <View style={styles.radar}>
            {locationReady ? (
              <>
                {nearby.length === 0 ? (
                  <View style={styles.emptyHint} pointerEvents="none">
                    <Text style={styles.emptyText}>Scanning 300 ft…</Text>
                  </View>
                ) : null}
                <RadarCanvas
                  size={size}
                  me={profile}
                  myColor={track?.albumColor ?? null}
                  nearby={nearby}
                  coords={coords}
                  heading={heading}
                  onSelect={onSelect}
                />
              </>
            ) : (
              <View style={styles.gate}>
                <Text style={styles.gateTitle}>
                  {permissions.servicesEnabled ? 'Location access needed' : 'Location Services are off'}
                </Text>
                <Text style={styles.gateBody}>
                  {APP_NAME} plots everyone within 300 ft of you. Without location access nobody can
                  see you on the map, and you cannot see them.
                </Text>
                <Pressable onPress={() => void onFixPermissions()} style={styles.gateCta}>
                  <Text style={styles.gateCtaText}>
                    {permissions.locationBlocked || !permissions.servicesEnabled
                      ? 'Open Settings'
                      : 'Allow location'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>

          {locationReady ? (
            <View style={styles.shareRow}>
              {nearby.length === 0 ? (
                <Text style={styles.aloneText}>
                  Nobody within 300 ft yet. Post your vibe card so people know where to find you.
                </Text>
              ) : null}
              <Pressable onPress={() => setShareOpen(true)} style={styles.shareCta}>
                <Text style={styles.shareCtaText}>Share my vibe</Text>
              </Pressable>
            </View>
          ) : null}

          <StatusComposer value={statusDraft} onChange={setStatusDraft} onSubmit={() => void onSubmitStatus()} />
          {!track && !lastError && locationReady ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={TILE_COLORS.ringGold} />
            </View>
          ) : null}
        </KeyboardAvoidingView>

        <NearbySheet ref={sheetRef} vibe={selected} onLike={() => void onLike()} liking={liking} />
      </SafeAreaView>

      <ShareVibeModal
        visible={shareOpen}
        profile={profile}
        track={track}
        nearby={nearby}
        coords={coords}
        onClose={() => setShareOpen(false)}
      />

      <ProfileModal
        visible={profileOpen}
        profile={profile}
        totals={likeTotals}
        track={track}
        permissions={permissions}
        onRefresh={refreshLikeTotals}
        onRequestPermissions={requestPermissions}
        onOpenSettings={openAppSettings}
        onClose={() => setProfileOpen(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 8,
  },
  headerText: {
    flex: 1,
  },
  kicker: {
    // Same pixel face as the wordmark on the share card, so the two read as
    // one brand. Falls back to the system font if the face failed to load.
    fontFamily: FONTS.pixel,
    color: TILE_COLORS.ringGold,
    letterSpacing: 2,
    fontSize: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: TILE_COLORS.ringParchment,
  },
  meta: {
    marginTop: 4,
    color: 'rgba(246, 228, 184, 0.65)',
    fontWeight: '600',
  },
  likesPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: 'rgba(255, 217, 122, 0.1)',
    minWidth: 74,
  },
  likesHeart: {
    color: COLORS.blush,
    fontSize: 13,
    lineHeight: 15,
  },
  likesCount: {
    color: TILE_COLORS.ringGold,
    fontSize: 20,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  likesCaption: {
    color: 'rgba(246, 228, 184, 0.6)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  nudge: {
    marginTop: 8,
    marginHorizontal: 22,
    color: 'rgba(246, 228, 184, 0.72)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  error: {
    marginTop: 8,
    marginHorizontal: 22,
    color: '#FF8A80',
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
    color: TILE_COLORS.ringParchment,
    fontWeight: '600',
    backgroundColor: 'rgba(27, 20, 48, 0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gate: {
    marginHorizontal: 24,
    padding: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: 'rgba(27, 20, 48, 0.75)',
  },
  gateTitle: {
    color: TILE_COLORS.ringGold,
    fontSize: 20,
    fontWeight: '800',
  },
  gateBody: {
    marginTop: 10,
    color: 'rgba(246, 228, 184, 0.8)',
    lineHeight: 20,
    fontWeight: '600',
  },
  gateCta: {
    marginTop: 18,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.cta,
  },
  gateCtaText: {
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shareRow: {
    paddingHorizontal: 22,
    paddingBottom: 10,
    gap: 8,
  },
  aloneText: {
    color: 'rgba(246, 228, 184, 0.72)',
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 17,
    textAlign: 'center',
  },
  shareCta: {
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: 'rgba(255, 217, 122, 0.12)',
  },
  shareCtaText: {
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 15,
  },
  loadingRow: {
    alignItems: 'center',
    paddingBottom: 8,
  },
});
