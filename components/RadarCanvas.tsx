import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { NearbyVibe, Profile } from '../types';
import { polarToCanvas } from '../utils/geo';
import { COLORS } from '../utils/constants';
import { AvatarBadge } from './AvatarBadge';
import { MagicRings } from './MagicRings';

type Props = {
  size: number;
  me: Profile;
  myColor: string | null;
  nearby: NearbyVibe[];
  onSelect: (vibe: NearbyVibe) => void;
};

export function RadarCanvas({ size, me, myColor, nearby, onSelect }: Props) {
  const radarRadius = size / 2 - 36;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <MagicRings size={size} />
      <View pointerEvents="none" style={styles.labels}>
        <Text style={[styles.ringLabel, { top: size * 0.34 }]}>100 ft</Text>
        <Text style={[styles.ringLabel, { top: size * 0.18 }]}>200 ft</Text>
        <Text style={[styles.ringLabel, { top: 10 }]}>300 ft</Text>
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
    fontSize: 10,
    letterSpacing: 1,
    color: COLORS.muted,
    fontWeight: '700',
  },
  pin: {
    position: 'absolute',
    alignItems: 'center',
  },
  you: {
    marginTop: -4,
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.ctaDeep,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
