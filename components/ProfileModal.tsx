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
import { Image } from 'expo-image';
import { COLORS, TILE_COLORS } from '../utils/constants';
import { describePlayback } from '../utils/nowPlaying';
import { LegalLinks } from './LegalLinks';
import type { LikeTotals, NowPlaying, Profile } from '../types';
import type { PermissionState } from '../services/permissions';

type Props = {
  visible: boolean;
  profile: Profile;
  totals: LikeTotals;
  track: NowPlaying | null;
  permissions: PermissionState;
  onRefresh: () => Promise<void>;
  onRequestPermissions: () => Promise<unknown>;
  onOpenSettings: () => Promise<void>;
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

function PermissionRow({
  label,
  detail,
  granted,
  actionLabel,
  onAction,
}: {
  label: string;
  detail: string;
  granted: boolean;
  actionLabel: string | null;
  onAction: () => void;
}) {
  return (
    <View style={styles.permissionRow}>
      <View style={styles.permissionText}>
        <Text style={styles.permissionLabel}>{label}</Text>
        <Text style={styles.permissionDetail}>{detail}</Text>
      </View>
      {granted ? (
        <Text style={styles.permissionOk}>On</Text>
      ) : actionLabel ? (
        <Pressable onPress={onAction} style={styles.permissionCta} hitSlop={6}>
          <Text style={styles.permissionCtaText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * The profile sheet: who you are, your lifetime nudge tally, what the app is
 * allowed to do, and the legal links.
 */
export function ProfileModal({
  visible,
  profile,
  totals,
  track,
  permissions,
  onRefresh,
  onRequestPermissions,
  onOpenSettings,
  onClose,
}: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const playback = describePlayback(track);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const locationDetail = !permissions.servicesEnabled
    ? 'Location Services are off on this device'
    : permissions.locationForeground
      ? permissions.locationBackground
        ? 'Always — your pin stays fresh in the background'
        : 'While using the app'
        : permissions.locationBlocked
          ? 'Denied. Turn it back on in Settings'
          : 'Needed to place you on the radar';

  const locationAction = !permissions.servicesEnabled || permissions.locationBlocked
    ? 'Settings'
    : 'Allow';

  const notificationDetail = permissions.notifications
    ? 'You get a nudge when someone likes your track'
    : permissions.notificationsBlocked
      ? 'Denied. Turn it back on in Settings'
      : 'Optional — used only for incoming nudges';

  const notificationAction = permissions.notificationsBlocked ? 'Settings' : 'Allow';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.identity}>
              <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
              <View style={styles.identityText}>
                <Text style={styles.kicker}>PROFILE</Text>
                <Text style={styles.name} numberOfLines={1}>
                  {profile.username || 'listener'}
                </Text>
                <Text style={styles.playback} numberOfLines={2}>
                  {playback.line}
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>What are you up to?</Text>
            <View style={styles.statusBox}>
              <Text style={profile.status.trim() ? styles.statusText : styles.statusEmpty}>
                {profile.status.trim() || 'No status yet — set one from the radar screen.'}
              </Text>
            </View>

            <Text style={styles.sectionTitle}>All-time likes</Text>
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

            <Text style={styles.sectionTitle}>Permissions</Text>
            <PermissionRow
              label="Location"
              detail={locationDetail}
              granted={permissions.locationForeground && permissions.servicesEnabled}
              actionLabel={locationAction}
              onAction={() => {
                if (locationAction === 'Settings') {
                  void onOpenSettings();
                } else {
                  void onRequestPermissions();
                }
              }}
            />
            <PermissionRow
              label="Notifications"
              detail={notificationDetail}
              granted={permissions.notifications}
              actionLabel={notificationAction}
              onAction={() => {
                if (notificationAction === 'Settings') {
                  void onOpenSettings();
                } else {
                  void onRequestPermissions();
                }
              }}
            />

            <View style={styles.legal}>
              <LegalLinks tone="dark" />
            </View>

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
    maxHeight: '90%',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 34,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: COLORS.parchment,
  },
  identityText: {
    flex: 1,
  },
  kicker: {
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 2.5,
  },
  name: {
    marginTop: 2,
    color: TILE_COLORS.ringParchment,
    fontSize: 22,
    fontWeight: '800',
  },
  playback: {
    marginTop: 3,
    color: 'rgba(246, 228, 184, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 10,
    color: 'rgba(246, 228, 184, 0.55)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  statusBox: {
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(246, 228, 184, 0.22)',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  statusText: {
    color: TILE_COLORS.ringParchment,
    fontSize: 15,
    fontWeight: '700',
  },
  statusEmpty: {
    color: 'rgba(246, 228, 184, 0.5)',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  hero: {
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
    marginTop: 16,
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
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 228, 184, 0.15)',
  },
  permissionText: {
    flex: 1,
  },
  permissionLabel: {
    color: TILE_COLORS.ringParchment,
    fontWeight: '800',
    fontSize: 15,
  },
  permissionDetail: {
    marginTop: 2,
    color: 'rgba(246, 228, 184, 0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  permissionOk: {
    color: '#8BD48B',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 1,
  },
  permissionCta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.cta,
  },
  permissionCtaText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  legal: {
    marginTop: 26,
  },
  primary: {
    marginTop: 16,
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
