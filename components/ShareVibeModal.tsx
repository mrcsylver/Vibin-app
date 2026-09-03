import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, FONTS, TILE_COLORS } from '../utils/constants';
import { shareVibeCard } from '../services/shareVibe';
import { CARD_ASPECT, VibeCard } from './VibeCard';
import type { NearbyVibe, NowPlaying, Profile } from '../types';

type Props = {
  visible: boolean;
  profile: Profile;
  track: NowPlaying | null;
  nearby: NearbyVibe[];
  coords: { latitude: number; longitude: number } | null;
  onClose: () => void;
};

/** Give remote album art this long to paint before capturing anyway. */
const ART_TIMEOUT_MS = 2500;
/** Vertical room the heading and buttons need around the card. */
const CHROME_HEIGHT = 190;

export function ShareVibeModal({ visible, profile, track, nearby, coords, onClose }: Props) {
  const cardRef = useRef<View>(null);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Size the card to the device rather than scaling it down for display:
  // captureRef reads the view as laid out, so a transform would be baked in.
  const cardWidth = Math.round(
    Math.min(340, screenWidth - 48, (screenHeight - CHROME_HEIGHT) * CARD_ASPECT),
  );

  const sameTrackCount = useMemo(() => {
    const title = track?.title;
    if (!title) {
      return 0;
    }
    return nearby.filter((vibe) => vibe.track_title === title).length;
  }, [nearby, track?.title]);

  const needsArt = Boolean(track?.albumArtUrl);

  useEffect(() => {
    if (!visible) {
      setReady(false);
      setError(null);
      return;
    }
    if (!needsArt) {
      setReady(true);
      return;
    }
    // Never let a slow image lock the button forever — capture without it.
    const timer = setTimeout(() => setReady(true), ART_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [visible, needsArt]);

  const onShare = async () => {
    setBusy(true);
    setError(null);
    try {
      const outcome = await shareVibeCard(cardRef);
      if (outcome === 'shared') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else if (outcome === 'unavailable') {
        setError('Sharing is not available on this device.');
      } else {
        setError('Could not build the image. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Text style={styles.heading}>YOUR VIBE</Text>

        {/* collapsable={false} keeps the node in the native tree on Android so
            it can be captured. */}
        <View ref={cardRef} collapsable={false}>
          <VibeCard
            width={cardWidth}
            profile={profile}
            track={track}
            coords={coords}
            nearbyCount={nearby.length}
            sameTrackCount={sameTrackCount}
            onArtSettled={() => setReady(true)}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={[styles.actions, { width: cardWidth }]}>
          <Pressable
            onPress={() => void onShare()}
            disabled={busy || !ready}
            style={[styles.primary, (busy || !ready) && styles.dim]}
          >
            {busy ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.primaryText}>{ready ? 'Share' : 'Preparing…'}</Text>
            )}
          </Pressable>
          <Pressable onPress={onClose} style={styles.secondary} hitSlop={8}>
            <Text style={styles.secondaryText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14, 10, 26, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 14,
  },
  heading: {
    fontFamily: FONTS.pixel,
    color: TILE_COLORS.ringGold,
    fontSize: 9,
    letterSpacing: 2,
  },
  error: {
    color: '#FF8A80',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 4,
  },
  primary: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.cta,
  },
  primaryText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  dim: {
    opacity: 0.6,
  },
  secondary: {
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  secondaryText: {
    color: 'rgba(246, 228, 184, 0.7)',
    fontWeight: '700',
  },
});
