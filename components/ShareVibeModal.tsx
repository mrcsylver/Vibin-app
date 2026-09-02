import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, TILE_COLORS } from '../utils/constants';
import { shareVibeCard } from '../services/shareVibe';
import { CARD_HEIGHT, CARD_WIDTH, VibeCard } from './VibeCard';
import type { NowPlaying, Profile } from '../types';

type Props = {
  visible: boolean;
  profile: Profile;
  track: NowPlaying | null;
  coords: { latitude: number; longitude: number } | null;
  onClose: () => void;
};

/** Give remote album art this long to paint before capturing anyway. */
const ART_TIMEOUT_MS = 2500;

export function ShareVibeModal({ visible, profile, track, coords, onClose }: Props) {
  const cardRef = useRef<View>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        <Text style={styles.heading}>Your vibe</Text>

        {/* collapsable={false} keeps the node in the native tree on Android so
            it can be captured. */}
        <View ref={cardRef} collapsable={false} style={styles.cardHolder}>
          <VibeCard
            profile={profile}
            track={track}
            coords={coords}
            onArtSettled={() => setReady(true)}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actions}>
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
    gap: 16,
  },
  heading: {
    color: TILE_COLORS.ringGold,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  cardHolder: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  error: {
    color: '#FF8A80',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  actions: {
    alignItems: 'center',
    gap: 6,
    width: CARD_WIDTH,
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
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryText: {
    color: 'rgba(246, 228, 184, 0.7)',
    fontWeight: '700',
  },
});
