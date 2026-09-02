import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { COLORS, TILE_COLORS } from '../utils/constants';
import type { LikeTotals } from '../types';

type Props = {
  visible: boolean;
  username: string;
  totals: LikeTotals;
  onRefresh: () => Promise<void>;
  onClose: () => void;
};

function formatCount(value: number): string {
  return value.toLocaleString();
}

function formatSince(iso: string | null): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/** Lifetime nudge tally. Counts come from `like_totals`, so they outlive the
 *  15-minute sweep that clears live presence. */
export function AllTimeLikesModal({ visible, username, totals, onRefresh, onClose }: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.kicker}>ALL-TIME LIKES</Text>
            <Text style={styles.name}>{username || 'listener'}</Text>

            <View style={styles.hero}>
              <Text style={styles.heroValue}>{formatCount(totals.likesReceived)}</Text>
              <Text style={styles.heroLabel}>
                {totals.likesReceived === 1 ? 'nudge received' : 'nudges received'}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Stat label="Sent" value={formatCount(totals.likesSent)} />
              <Stat label="Live now" value={formatCount(totals.recentReceived)} />
            </View>

            <Text style={styles.since}>On the radar since {formatSince(totals.firstSeenAt)}</Text>

            <Pressable
              onPress={() => void refresh()}
              disabled={refreshing}
              style={[styles.secondary, refreshing && styles.dim]}
            >
              {refreshing ? (
                <ActivityIndicator color={TILE_COLORS.ringGold} />
              ) : (
                <Text style={styles.secondaryText}>Refresh</Text>
              )}
            </Pressable>

            <Pressable onPress={onClose} style={styles.primary}>
              <Text style={styles.primaryText}>Back to the map</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 15, 36, 0.62)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: TILE_COLORS.bezel,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 3,
    borderColor: TILE_COLORS.ringGold,
    maxHeight: '85%',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34,
  },
  kicker: {
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2.5,
  },
  name: {
    marginTop: 4,
    color: TILE_COLORS.ringParchment,
    fontSize: 22,
    fontWeight: '800',
  },
  hero: {
    marginTop: 22,
    alignItems: 'center',
    paddingVertical: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 217, 122, 0.35)',
    backgroundColor: 'rgba(255, 217, 122, 0.08)',
  },
  heroValue: {
    color: TILE_COLORS.ringGold,
    fontSize: 56,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  heroLabel: {
    marginTop: 2,
    color: TILE_COLORS.ringParchment,
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(246, 228, 184, 0.22)',
  },
  statValue: {
    color: TILE_COLORS.ringParchment,
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    marginTop: 2,
    color: 'rgba(246, 228, 184, 0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  since: {
    marginTop: 16,
    textAlign: 'center',
    color: 'rgba(246, 228, 184, 0.65)',
    fontSize: 12,
    fontWeight: '600',
  },
  secondary: {
    marginTop: 20,
    paddingVertical: 13,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
  },
  secondaryText: {
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dim: {
    opacity: 0.6,
  },
  primary: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    backgroundColor: COLORS.cta,
  },
  primaryText: {
    color: COLORS.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
