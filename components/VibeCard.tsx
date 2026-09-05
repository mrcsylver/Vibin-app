import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { APP_NAME, COLORS, FONTS, TILE_COLORS } from '../utils/constants';
import { RetroMap } from './RetroMap';
import type { NowPlaying, Profile } from '../types';

/** The design was drawn at this width; every size below is a ratio of it. */
const DESIGN_WIDTH = 540;
export const CARD_ASPECT = 9 / 16;

const PANEL = '#241C33';
const PANEL_SUNK = '#2A2140';
const RULE = '#3A3050';
const MUTED = '#9A9AA8';
const SPOTIFY_GREEN = '#2F7D4E';

export type VibeCardProps = {
  /** Rendered width. Height follows the 9:16 story ratio. */
  width: number;
  profile: Profile;
  track: NowPlaying | null;
  coords: { latitude: number; longitude: number } | null;
  /** Listeners currently inside the 300 ft bubble, excluding the user. */
  nearbyCount: number;
  /** Fired once the album art has painted, so the capture is never blank. */
  onArtSettled?: () => void;
};

function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The shareable "now playing" card.
 *
 * Laid out with flex rather than absolute offsets, so a two-line track title or
 * a long username pushes the rows below it instead of colliding with them. The
 * media-player panel is centred rather than left-hung as in the source design,
 * because the backdrop here is the generated overworld rather than a photo, and
 * an off-centre panel over it reads as a mistake.
 */
export function VibeCard({
  width,
  profile,
  track,
  coords,
  nearbyCount,
  onArtSettled,
}: VibeCardProps) {
  const s = (value: number) => Math.round(value * (width / DESIGN_WIDTH));
  const height = Math.round(width / CARD_ASPECT);

  const hasTrack = Boolean(track?.title);
  const artUrl = track?.albumArtUrl ?? null;
  const glow = track?.albumColor ?? COLORS.fallbackAura;
  const status = profile.status.trim();

  const progressMs = track?.progressMs ?? null;
  const durationMs = track?.durationMs ?? null;
  const showProgress = hasTrack && progressMs !== null && durationMs !== null && durationMs > 0;
  const progressPct = showProgress ? Math.min(1, Math.max(0, progressMs / durationMs)) : 0;

  const artSize = s(186);
  const panelPad = s(18);

  return (
    <View style={[styles.card, { width, height }]}>
      {/* Backdrop: the same overworld the radar draws. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <RetroMap width={width} height={height} coords={coords} shape="fill" tilesAcross={9} />
      </View>
      <View style={styles.scrim} pointerEvents="none" />

      <View style={[styles.inner, { padding: s(30) }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.wordmark}>
            <Text style={[styles.brand, { fontSize: s(30) }]}>{APP_NAME}</Text>
            <View style={[styles.bars, { gap: s(3), paddingTop: s(3) }]}>
              <View style={[styles.bar, { width: s(12), height: s(3) }]} />
              <View style={[styles.bar, { width: s(9), height: s(3) }]} />
              <View style={[styles.bar, { width: s(5), height: s(3) }]} />
            </View>
          </View>
          <View style={[styles.countPill, { paddingHorizontal: s(11), paddingVertical: s(8) }]}>
            <Text style={[styles.countText, { fontSize: s(11), letterSpacing: s(1.4) }]}>
              {nearbyCount === 0 ? 'FIRST ONE HERE' : `${nearbyCount} WITHIN 300 FT`}
            </Text>
          </View>
        </View>

        {/* Media player */}
        <View style={[styles.panel, { padding: panelPad, borderRadius: s(14) }]}>
          <View style={styles.panelHead}>
            <Text style={[styles.panelTitle, { fontSize: s(17) }]}>Media player</Text>
            <View style={[styles.panelDot, { width: s(20), height: s(20), borderRadius: s(10) }]} />
          </View>

          <View
            style={[
              styles.artFrame,
              {
                marginTop: s(16),
                width: artSize,
                height: artSize,
                borderRadius: s(6),
                borderWidth: s(3),
                borderColor: glow,
                shadowColor: glow,
                shadowRadius: s(17),
              },
            ]}
          >
            {artUrl ? (
              <Image
                source={{ uri: artUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                onLoadEnd={onArtSettled}
              />
            ) : (
              <View style={styles.artFallback}>
                <Image
                  source={{ uri: profile.avatarUrl }}
                  style={{ width: artSize * 0.6, height: artSize * 0.6 }}
                />
              </View>
            )}
          </View>

          <View style={[styles.trackRow, { marginTop: s(16), gap: s(10) }]}>
            <View
              style={[
                styles.trackDot,
                { width: s(22), height: s(22), borderRadius: s(11), backgroundColor: SPOTIFY_GREEN },
              ]}
            />
            <View style={styles.trackText}>
              <Text style={[styles.trackTitle, { fontSize: s(26), lineHeight: s(28) }]} numberOfLines={2}>
                {hasTrack ? track?.title : status || 'Somewhere on campus'}
              </Text>
              <Text style={[styles.trackArtist, { fontSize: s(11), marginTop: s(4) }]} numberOfLines={1}>
                {hasTrack ? track?.artist ?? profile.username : 'Not on Spotify right now'}
              </Text>
            </View>
          </View>

          {showProgress ? (
            <View style={[styles.progressRow, { marginTop: s(16), gap: s(9) }]}>
              <Text style={[styles.clock, { fontSize: s(10) }]}>{formatClock(progressMs)}</Text>
              <View style={[styles.track, { height: s(3), borderRadius: s(2) }]}>
                <View
                  style={[
                    styles.trackFill,
                    { width: `${progressPct * 100}%`, height: s(3), borderRadius: s(2) },
                  ]}
                />
              </View>
              <Text style={[styles.clock, { fontSize: s(10) }]}>{formatClock(durationMs)}</Text>
            </View>
          ) : null}

          <View style={[styles.transport, { marginTop: s(16) }]}>
            {[s(24), s(24)].map((size, index) => (
              <View
                key={`prev-${index}`}
                style={[styles.transportDot, { width: size, height: size, borderRadius: size / 2 }]}
              />
            ))}
            <View
              style={[
                styles.playButton,
                { width: s(44), height: s(44), borderRadius: s(22) },
              ]}
            >
              <View
                style={[
                  styles.playTriangle,
                  {
                    borderLeftWidth: s(13),
                    borderTopWidth: s(8),
                    borderBottomWidth: s(8),
                    marginLeft: s(4),
                  },
                ]}
              />
            </View>
            {[s(24), s(24)].map((size, index) => (
              <View
                key={`next-${index}`}
                style={[styles.transportDot, { width: size, height: size, borderRadius: size / 2 }]}
              />
            ))}
          </View>
        </View>

        {/* Who */}
        <View style={[styles.userCard, { padding: s(16), borderRadius: s(12), gap: s(13) }]}>
          <Image
            source={{ uri: profile.avatarUrl }}
            style={{ width: s(48), height: s(48), borderRadius: s(24), backgroundColor: '#322646' }}
          />
          <View style={styles.userText}>
            <Text style={[styles.handle, { fontSize: s(16) }]} numberOfLines={1}>
              @{profile.username || 'listener'}
            </Text>
            <Text style={[styles.status, { fontSize: s(12), marginTop: s(5) }]} numberOfLines={1}>
              {status || 'Somewhere within 300 ft'}
            </Text>
          </View>
        </View>

        {/* Spotify's developer terms require attribution wherever their album
            art and track metadata are shown — and this card gets posted. */}
        <View style={[styles.spotifyBar, { marginTop: s(14), padding: s(14), borderRadius: s(6), gap: s(10) }]}>
          <View style={[styles.spotifyDot, { width: s(10), height: s(10), borderRadius: s(5) }]} />
          <Text style={[styles.spotifyText, { fontSize: s(14) }]}>
            {hasTrack ? 'Now playing on Spotify' : `${APP_NAME} · 300 ft music radar`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1730',
    overflow: 'hidden',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(20, 16, 31, 0.66)',
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  brand: {
    fontWeight: '800',
    color: TILE_COLORS.ringParchment,
    letterSpacing: -1,
  },
  bars: {
    alignItems: 'flex-start',
  },
  bar: {
    backgroundColor: TILE_COLORS.ringGold,
  },
  countPill: {
    backgroundColor: PANEL,
    borderRadius: 5,
  },
  countText: {
    fontFamily: FONTS.mono,
    color: TILE_COLORS.ringGold,
  },
  panel: {
    marginTop: 'auto',
    backgroundColor: PANEL,
    alignSelf: 'stretch',
    shadowColor: '#0A0712',
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontWeight: '800',
    color: TILE_COLORS.ringParchment,
  },
  panelDot: {
    backgroundColor: RULE,
  },
  artFrame: {
    alignSelf: 'center',
    backgroundColor: PANEL_SUNK,
    overflow: 'hidden',
    shadowOpacity: 0.55,
    shadowOffset: { width: 0, height: 0 },
  },
  artFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackDot: {
    flex: 0,
  },
  trackText: {
    flex: 1,
    minWidth: 0,
  },
  trackTitle: {
    fontFamily: FONTS.serif,
    color: TILE_COLORS.ringParchment,
  },
  trackArtist: {
    fontFamily: FONTS.mono,
    color: MUTED,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clock: {
    fontFamily: FONTS.mono,
    color: MUTED,
  },
  track: {
    flex: 1,
    backgroundColor: RULE,
    overflow: 'hidden',
  },
  trackFill: {
    backgroundColor: TILE_COLORS.ringParchment,
  },
  transport: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transportDot: {
    backgroundColor: RULE,
  },
  playButton: {
    backgroundColor: TILE_COLORS.ringParchment,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderLeftColor: PANEL,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  userCard: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PANEL,
  },
  userText: {
    flex: 1,
    minWidth: 0,
  },
  handle: {
    fontWeight: '800',
    color: TILE_COLORS.ringParchment,
  },
  status: {
    fontFamily: FONTS.mono,
    color: MUTED,
  },
  spotifyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SPOTIFY_GREEN,
  },
  spotifyDot: {
    backgroundColor: TILE_COLORS.ringParchment,
  },
  spotifyText: {
    fontWeight: '600',
    color: TILE_COLORS.ringParchment,
  },
});
