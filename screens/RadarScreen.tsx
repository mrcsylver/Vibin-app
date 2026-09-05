import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
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
import { APP_NAME, COLORS, FONTS, STATUS_MAX_LEN, TILE_COLORS } from '../utils/constants';
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
    deleteAccount,
  } = useSession();

  const { width, height } = useWindowDimensions();
  const sheetRef = useRef<BottomSheet>(null);
  const [selected, setSelected] = useState<NearbyVibe | null>(null);
  const [statusDraft, setStatusDraft] = useState(profile?.status ?? '');
  const [liking, setLiking] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Keep the field showing what is actually saved, so a status can never look
  // like it vanished after being submitted.
  const savedStatus = profile?.status ?? '';
  useEffect(() => {
    setStatusDraft(savedStatus);
  }, [savedStatus]);

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

  const submitStatus = async (text: string) => {
    const clean = text.trim().slice(0, STATUS_MAX_LEN);
    setStatusDraft(clean);
    await setProfile({ ...profile, status: clean });
    void Haptics.selectionAsync();
    try {
      await pushStatus(profile.hashedId, clean);
    } catch {
      // The heartbeat will retry the full payload.
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
    <View style={styles.root}>
      {/* The overworld is the screen, not a panel on it. */}
      {locationReady ? (
        <RadarCanvas
          width={width}
          height={height}
          me={profile}
          myColor={track?.albumColor ?? null}
          nearby={nearby}
          coords={coords}
          heading={heading}
          onSelect={onSelect}
        />
      ) : null}

      {/* Scrims keep the HUD readable over any terrain. */}
      <LinearGradient
        colors={['rgba(20,15,36,0.94)', 'rgba(20,15,36,0.55)', 'rgba(20,15,36,0)']}
        style={[styles.scrimTop, { height: height * 0.3 }]}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['rgba(20,15,36,0)', 'rgba(20,15,36,0.72)', 'rgba(20,15,36,0.96)']}
        style={[styles.scrimBottom, { height: height * 0.34 }]}
        pointerEvents="none"
      />

      <SafeAreaView style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
          pointerEvents="box-none"
        >
          <View style={styles.header} pointerEvents="box-none">
            <View style={styles.headerText}>
              <Text style={styles.kicker}>{APP_NAME.toUpperCase()}</Text>
              <Text style={styles.title}>Campus radar</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {playback.line}
              </Text>
              {savedStatus ? (
                <Text style={styles.statusEcho} numberOfLines={1}>
                  “{savedStatus}”
                </Text>
              ) : null}
            </View>

            <Pressable onPress={openProfile} style={styles.likesPill} accessibilityRole="button">
              <Text style={styles.likesHeart}>♥</Text>
              <Text style={styles.likesCount}>{likeTotals.likesReceived}</Text>
              <Text style={styles.likesCaption}>all-time</Text>
            </Pressable>
          </View>

          {lastError && locationReady ? (
            <Text style={styles.error} numberOfLines={2}>
              {lastError}
            </Text>
          ) : null}

          {/* Spacer: touches fall through here to the map underneath. */}
          <View style={styles.flex} pointerEvents="box-none">
            {!locationReady ? (
              <View style={styles.gateWrap} pointerEvents="box-none">
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
              </View>
            ) : null}
          </View>

          {locationReady ? (
            <View style={styles.shareRow} pointerEvents="box-none">
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

          <StatusComposer
            value={statusDraft}
            onChange={setStatusDraft}
            onSubmit={(text) => void submitStatus(text)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>

      <NearbySheet ref={sheetRef} vibe={selected} onLike={() => void onLike()} liking={liking} />

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
        onDeleteAccount={deleteAccount}
        onClose={() => setProfileOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: TILE_COLORS.bezel,
  },
  flex: { flex: 1 },
  scrimTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
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
    fontFamily: FONTS.pixel,
    color: TILE_COLORS.ringGold,
    letterSpacing: 2,
    fontSize: 10,
  },
  title: {
    marginTop: 4,
    fontSize: 28,
    fontWeight: '800',
    color: TILE_COLORS.ringParchment,
  },
  meta: {
    marginTop: 4,
    color: 'rgba(246, 228, 184, 0.68)',
    fontWeight: '600',
  },
  statusEcho: {
    marginTop: 3,
    color: TILE_COLORS.ringGold,
    fontWeight: '700',
    fontSize: 13,
    fontStyle: 'italic',
  },
  likesPill: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: 'rgba(27, 20, 48, 0.7)',
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
  error: {
    marginTop: 8,
    marginHorizontal: 22,
    color: '#FF8A80',
    fontSize: 12,
  },
  gateWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  gate: {
    marginHorizontal: 24,
    padding: 22,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: 'rgba(27, 20, 48, 0.92)',
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
    color: 'rgba(246, 228, 184, 0.78)',
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
    backgroundColor: 'rgba(27, 20, 48, 0.78)',
  },
  shareCtaText: {
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
    letterSpacing: 0.4,
    fontSize: 15,
  },
});
