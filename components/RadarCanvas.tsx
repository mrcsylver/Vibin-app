import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NearbyVibe, Profile } from '../types';
import { polarToCanvas } from '../utils/geo';
import { RING_FEET, TILE_COLORS } from '../utils/constants';
import { AvatarBadge } from './AvatarBadge';
import { HeadingCone } from './HeadingCone';
import { MagicRings } from './MagicRings';
import { RetroMap } from './RetroMap';

type Props = {
  size: number;
  me: Profile;
  myColor: string | null;
  nearby: NearbyVibe[];
  coords: { latitude: number; longitude: number } | null;
  heading: number | null;
  onSelect: (vibe: NearbyVibe) => void;
};

/** Where each ring's label sits, as a fraction of the canvas height. */
const LABEL_TOP: Record<(typeof RING_FEET)[number], number> = {
  100: 0.335,
  200: 0.175,
  300: 0.02,
};

export function RadarCanvas({ size, me, myColor, nearby, coords, heading, onSelect }: Props) {
  const radarRadius = size / 2 - 36;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <RetroMap size={size} coords={coords} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <HeadingCone size={size} heading={heading} />
      </View>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <MagicRings size={size} />
      </View>

      <View pointerEvents="none" style={styles.labels}>
        {RING_FEET.map((feet) => (
          <Text key={feet} style={[styles.ringLabel, { top: size * LABEL_TOP[feet] }]}>
            {feet} ft
          </Text>
        ))}
      </View>

      {nearby.map((vibe, index) => {
        const { x, y } = polarToCanvas(vibe.distance_m, vibe.bearing_deg ?? 0, radarRadius);
        return (
          <Pressable
            key={vibe.spotify_id}
            onPress={() => onSelect(vibe)}
            style={[
              styles.pin,
              {
                left: size / 2 + x - 36,
                top: size / 2 + y - 36,
              },
            ]}
          >
            <AvatarBadge
              uri={vibe.avatar_url}
              size={48}
              auraColor={vibe.album_color}
              bobDelayMs={(index % 5) * 180}
            />
          </Pressable>
        );
      })}

      <View style={[styles.pin, { left: size / 2 - 40, top: size / 2 - 40 }]} pointerEvents="none">
        <AvatarBadge uri={me.avatarUrl} size={56} auraColor={myColor} bobDelayMs={80} />
        <Text style={styles.you}>you</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'center',
  },
  labels: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  ringLabel: {
    position: 'absolute',
    fontSize: 9,
    letterSpacing: 1,
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
    backgroundColor: 'rgba(27, 20, 48, 0.72)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
  },
  you: {
    marginTop: -2,
    fontSize: 9,
    fontWeight: '800',
    color: TILE_COLORS.ringGold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: 'rgba(27, 20, 48, 0.78)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },
});
