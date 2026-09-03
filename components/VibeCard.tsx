import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { APP_NAME, COLORS, FONTS, TILE_COLORS } from '../utils/constants';
import { RetroMap } from './RetroMap';
import type { NowPlaying, Profile } from '../types';

/** The design was drawn at this width; every size below is a ratio of it. */
const DESIGN_WIDTH = 390;
export const CARD_ASPECT = 9 / 16;

export type VibeCardProps = {
  /** Rendered width. Height follows the 9:16 story ratio. */
  width: number;
  profile: Profile;
  track: NowPlaying | null;
  coords: { latitude: number; longitude: number } | null;
  /** Listeners currently inside the 300 ft bubble, excluding the user. */
  nearbyCount: number;
  /** How many of them are on this exact track. */
  sameTrackCount: number;
  /** Fired once the album art has painted, so the capture is never blank. */
  onArtSettled?: () => void;
};

/**
 * The shareable "now playing" card.
 *
 * Laid out with flex rather than absolute offsets, so a two-line track title or
 * a long username pushes the rows below it instead of colliding with them. The
 * album frame overlaps the map disc with a negative margin, which keeps that
 * one deliberate overlap without giving up automatic layout.
 */
export function VibeCard({
  width,
  profile,
  track,
  coords,
  nearbyCount,
  sameTrackCount,
  onArtSettled,
}: VibeCardProps) {
  const s = (value: number) => Math.round(value * (width / DESIGN_WIDTH));
  const height = Math.round(width / CARD_ASPECT);

  const hasTrack = Boolean(track?.title);
  const artUrl = track?.albumArtUrl ?? null;
  const glow = track?.albumColor ?? COLORS.fallbackAura;

  const mapSize = s(288);
  const albumInner = s(150);
  const albumBorder = s(8);
  const albumEdge = s(3);
  const albumOuter = albumInner + albumBorder * 2 + albumEdge * 2;

  const status = profile.status.trim();

  return (
    <View style={[styles.card, { width, height, borderWidth: s(3) }]}>
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: s(18), paddingTop: s(16) }]}>
        <View style={styles.wordmark}>
          <View style={[styles.mark, { width: s(18), height: s(18) }]}>
            <Text style={[styles.markText, { fontSize: s(9) }]}>V</Text>
          </View>
          <Text style={[styles.brand, { fontSize: s(13), letterSpacing: s(2) }]}>
            {APP_NAME.toUpperCase()}
          </Text>
        </View>
        <View style={styles.live}>
          <View style={[styles.liveDot, { width: s(6), height: s(6) }]} />
          <Text style={[styles.liveText, { fontSize: s(6) }]}>LIVE</Text>
        </View>
      </View>

      {/* Map disc with the album frame overlapping its lower edge */}
      <View style={[styles.stage, { marginTop: s(10) }]}>
        <RetroMap size={mapSize} coords={coords} tilesAcross={11} />
        <View
          style={[
            styles.albumFrame,
            {
              marginTop: -albumOuter / 2,
              padding: albumBorder,
              borderColor: glow,
              borderWidth: albumEdge,
              shadowColor: glow,
              shadowRadius: s(16),
            },
          ]}
        >
          {artUrl ? (
            <Image
              source={{ uri: artUrl }}
              style={{ width: albumInner, height: albumInner }}
              contentFit="cover"
              onLoadEnd={onArtSettled}
            />
          ) : (
            <View
              style={[
                styles.artFallback,
                { width: albumInner, height: albumInner },
              ]}
            >
              <Image
                source={{ uri: profile.avatarUrl }}
                style={{ width: albumInner * 0.62, height: albumInner * 0.62 }}
              />
            </View>
          )}
        </View>
      </View>

      {/* Track */}
      <View style={[styles.trackBlock, { paddingHorizontal: s(20), marginTop: s(12) }]}>
        <Text
          style={[styles.title, { fontSize: s(38), lineHeight: s(40) }]}
          numberOfLines={2}
        >
          {hasTrack ? track?.title : status || 'Somewhere on campus'}
        </Text>

        <View style={[styles.artistRow, { marginTop: s(4), gap: s(9) }]}>
          <Text style={[styles.artist, { fontSize: s(24), lineHeight: s(26) }]} numberOfLines={1}>
            {hasTrack ? track?.artist ?? profile.username : 'Not on Spotify right now'}
          </Text>
          {hasTrack && track?.albumName ? (
            <Text style={[styles.album, { fontSize: s(6) }]} numberOfLines={1}>
              {track.albumName}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Social proof — the line that makes someone ask what the app is */}
      <View style={[styles.badgeRow, { marginTop: s(12) }]}>
        <View style={[styles.badge, { paddingHorizontal: s(9), paddingVertical: s(6), borderWidth: s(2) }]}>
          <View style={[styles.badgeDot, { width: s(6), height: s(6) }]} />
          <Text style={[styles.badgeText, { fontSize: s(6) }]}>
            {nearbyCount === 0
              ? 'FIRST ONE HERE'
              : sameTrackCount > 0
                ? `${sameTrackCount} NEARBY ON THIS TRACK`
                : `${nearbyCount} VIBING WITHIN 300 FT`}
          </Text>
        </View>
      </View>

      {/* User */}
      <View style={[styles.footer, { paddingHorizontal: s(20), paddingBottom: s(18) }]}>
        <View style={[styles.rule, { marginBottom: s(14) }]} />
        <View style={[styles.userRow, { gap: s(11) }]}>
          <Image
            source={{ uri: profile.avatarUrl }}
            style={{
              width: s(46),
              height: s(46),
              borderWidth: s(3),
              borderColor: glow,
              backgroundColor: COLORS.parchment,
            }}
          />
          <View style={styles.userText}>
            <Text style={[styles.handle, { fontSize: s(8), color: glow }]} numberOfLines={1}>
              @{profile.username || 'listener'}
            </Text>
            <Text style={[styles.status, { fontSize: s(19), lineHeight: s(21), marginTop: s(4) }]} numberOfLines={1}>
              {status || 'Somewhere within 300 ft'}
            </Text>
          </View>
        </View>

        {/* Spotify's developer terms require attribution wherever their album
            art and track metadata are shown — and this card gets posted. */}
        <View style={[styles.spotify, { marginTop: s(12), gap: s(6) }]}>
          <View style={[styles.spotifyDot, { width: s(7), height: s(7) }]} />
          <Text style={[styles.spotifyText, { fontSize: s(6) }]}>
            {hasTrack ? 'NOW PLAYING ON SPOTIFY' : 'VIBIN · 300 FT MUSIC RADAR'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: TILE_COLORS.bezel,
    borderColor: TILE_COLORS.ringGold,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mark: {
    backgroundColor: TILE_COLORS.ringGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: {
    fontFamily: FONTS.pixel,
    color: TILE_COLORS.bezel,
  },
  brand: {
    fontFamily: FONTS.pixel,
    color: TILE_COLORS.ringGold,
  },
  live: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveDot: {
    backgroundColor: '#E05A5A',
  },
  liveText: {
    fontFamily: FONTS.pixel,
    color: '#E05A5A',
  },
  stage: {
    alignItems: 'center',
  },
  albumFrame: {
    backgroundColor: TILE_COLORS.bezel,
    shadowOpacity: 0.85,
    shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  artFallback: {
    backgroundColor: '#322646',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBlock: {
    alignItems: 'center',
  },
  title: {
    fontFamily: FONTS.terminal,
    color: TILE_COLORS.ringParchment,
    textAlign: 'center',
  },
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  artist: {
    fontFamily: FONTS.terminal,
    color: TILE_COLORS.stone,
    flexShrink: 1,
  },
  album: {
    fontFamily: FONTS.pixel,
    color: 'rgba(154, 154, 168, 0.72)',
    flexShrink: 1,
  },
  badgeRow: {
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: 'rgba(255, 217, 122, 0.5)',
    backgroundColor: 'rgba(255, 217, 122, 0.1)',
  },
  badgeDot: {
    backgroundColor: TILE_COLORS.ringGold,
  },
  badgeText: {
    fontFamily: FONTS.pixel,
    color: TILE_COLORS.ringGold,
  },
  footer: {
    marginTop: 'auto',
  },
  rule: {
    height: 2,
    backgroundColor: 'rgba(154, 154, 168, 0.28)',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  handle: {
    fontFamily: FONTS.pixel,
  },
  status: {
    fontFamily: FONTS.terminal,
    color: TILE_COLORS.ringParchment,
  },
  spotify: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotifyDot: {
    backgroundColor: '#1DB954',
    borderRadius: 999,
  },
  spotifyText: {
    fontFamily: FONTS.pixel,
    color: 'rgba(154, 154, 168, 0.85)',
  },
});
