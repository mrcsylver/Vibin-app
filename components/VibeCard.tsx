import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { APP_NAME, COLORS, TILE_COLORS } from '../utils/constants';
import { RetroMap } from './RetroMap';
import type { NowPlaying, Profile } from '../types';

/** Story aspect ratio, so it drops into Instagram or Snapchat uncropped. */
export const CARD_WIDTH = 324;
export const CARD_HEIGHT = 576;

/**
 * The overworld disc sits behind the artwork only. Sizing it so the disc ends
 * above the track title keeps every line of text on flat colour, where it is
 * always legible, instead of over terrain.
 */
const MAP_SIZE = Math.round(CARD_WIDTH * 1.3);
const MAP_LEFT = Math.round((CARD_WIDTH - MAP_SIZE) / 2);
const MAP_TOP = -Math.round(CARD_WIDTH * 0.3);

type Props = {
  profile: Profile;
  track: NowPlaying | null;
  coords: { latitude: number; longitude: number } | null;
  /** Fired once the album art has painted, so the capture is never blank. */
  onArtSettled?: () => void;
};

function Bars() {
  return (
    <View style={styles.bars}>
      <View style={[styles.bar, { height: 7 }]} />
      <View style={[styles.bar, { height: 15 }]} />
      <View style={[styles.bar, { height: 10 }]} />
      <View style={[styles.bar, { height: 5 }]} />
    </View>
  );
}

/**
 * The shareable "now playing" card.
 *
 * Deliberately self-contained and fixed-size: it is rendered on screen for the
 * user to approve and then handed straight to `captureRef`, so what they see is
 * exactly the pixels that get shared.
 */
export function VibeCard({ profile, track, coords, onArtSettled }: Props) {
  const hasTrack = Boolean(track?.title);
  const artUrl = track?.albumArtUrl ?? null;
  const aura = track?.albumColor ?? COLORS.fallbackAura;

  return (
    <View style={styles.card}>
      {/* The same overworld the radar draws, dimmed to a backdrop. */}
      <View style={styles.mapLayer} pointerEvents="none">
        <RetroMap size={MAP_SIZE} coords={coords} tilesAcross={12} />
      </View>
      <View style={styles.scrim} pointerEvents="none" />

      <View style={styles.header}>
        <Bars />
        <Text style={styles.wordmark}>{APP_NAME.toUpperCase()}</Text>
      </View>

      <View style={styles.artWrap}>
        <View style={[styles.artFrame, { shadowColor: aura, borderColor: aura }]}>
          {artUrl ? (
            <Image
              source={{ uri: artUrl }}
              style={styles.art}
              contentFit="cover"
              onLoadEnd={onArtSettled}
            />
          ) : (
            <View style={[styles.art, styles.artFallback]}>
              <Image source={{ uri: profile.avatarUrl }} style={styles.artAvatar} />
            </View>
          )}
        </View>
      </View>

      <View style={styles.meta}>
        {hasTrack ? (
          <>
            <Text style={styles.eyebrow}>NOW PLAYING</Text>
            <Text style={styles.title} numberOfLines={2}>
              {track?.title}
            </Text>
            {track?.artist ? (
              <Text style={styles.artist} numberOfLines={1}>
                {track.artist}
              </Text>
            ) : null}
          </>
        ) : (
          <>
            <Text style={styles.eyebrow}>ON THE RADAR</Text>
            <Text style={styles.title} numberOfLines={2}>
              {profile.status.trim() || 'Somewhere on campus'}
            </Text>
            <Text style={styles.artist}>Not sharing a track right now</Text>
          </>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.who}>
          <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
          <View style={styles.whoText}>
            <Text style={styles.username} numberOfLines={1}>
              {profile.username || 'listener'}
            </Text>
            {hasTrack && profile.status.trim() ? (
              <Text style={styles.status} numberOfLines={1}>
                {profile.status.trim()}
              </Text>
            ) : (
              <Text style={styles.status}>300 ft music radar</Text>
            )}
          </View>
        </View>
        {/* Spotify's developer terms require attribution wherever their album
            art and track metadata are displayed — and this card gets posted. */}
        <Text style={styles.tagline}>
          {hasTrack ? 'Now playing on Spotify' : 'See what everyone near you is playing'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: TILE_COLORS.bezel,
    borderWidth: 3,
    borderColor: TILE_COLORS.ringGold,
    borderRadius: 6,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  mapLayer: {
    position: 'absolute',
    top: MAP_TOP,
    left: MAP_LEFT,
    opacity: 0.85,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(27, 20, 48, 0.55)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 15,
  },
  bar: {
    width: 3,
    backgroundColor: TILE_COLORS.ringGold,
  },
  wordmark: {
    color: TILE_COLORS.ringGold,
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 3.5,
  },
  artWrap: {
    alignItems: 'center',
    marginTop: 4,
  },
  artFrame: {
    padding: 5,
    borderWidth: 3,
    backgroundColor: 'rgba(27, 20, 48, 0.85)',
    shadowOpacity: 0.75,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
  },
  art: {
    width: 186,
    height: 186,
    backgroundColor: TILE_COLORS.bezel,
  },
  artFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artAvatar: {
    width: 116,
    height: 116,
    borderRadius: 10,
  },
  meta: {
    paddingHorizontal: 22,
  },
  eyebrow: {
    color: TILE_COLORS.ringGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    marginBottom: 6,
  },
  title: {
    color: TILE_COLORS.ringParchment,
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  artist: {
    marginTop: 5,
    color: 'rgba(246, 228, 184, 0.72)',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(246, 228, 184, 0.22)',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: TILE_COLORS.ringGold,
    backgroundColor: COLORS.parchment,
  },
  whoText: {
    flex: 1,
  },
  username: {
    color: TILE_COLORS.ringParchment,
    fontSize: 15,
    fontWeight: '800',
  },
  status: {
    color: 'rgba(246, 228, 184, 0.6)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  tagline: {
    color: 'rgba(246, 228, 184, 0.45)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
