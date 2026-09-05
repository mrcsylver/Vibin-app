import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { NearbyVibe, Profile } from '../types';
import { polarToCanvas } from '../utils/geo';
import { RING_FEET, TILE_COLORS } from '../utils/constants';
import { AvatarBadge } from './AvatarBadge';
import { HeadingCone } from './HeadingCone';
import { MagicRings } from './MagicRings';
import { RetroMap } from './RetroMap';

type Props = {
  width: number;
  height: number;
  me: Profile;
  myColor: string | null;
  nearby: NearbyVibe[];
  coords: { latitude: number; longitude: number } | null;
  heading: number | null;
  onSelect: (vibe: NearbyVibe) => void;
};

/** How far the world can be dragged before it springs back. */
const MAX_PAN = 96;

export function RadarCanvas({
  width,
  height,
  me,
  myColor,
  nearby,
  coords,
  heading,
  onSelect,
}: Props) {
  const centerX = width / 2;
  const centerY = height / 2;
  // The 300 ft ring, sized to leave the header and composer breathing room.
  const radarRadius = Math.min(width / 2 - 26, height * 0.29);
  const ringSize = radarRadius * 2 + 20;

  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // Drag to look around, then let go and the map returns to you. The thresholds
  // keep taps on avatars from being swallowed by the pan.
  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onStart(() => {
      startX.value = panX.value;
      startY.value = panY.value;
    })
    .onUpdate((event) => {
      panX.value = Math.min(MAX_PAN, Math.max(-MAX_PAN, startX.value + event.translationX));
      panY.value = Math.min(MAX_PAN, Math.max(-MAX_PAN, startY.value + event.translationY));
    })
    .onEnd(() => {
      panX.value = withSpring(0, { damping: 17, stiffness: 110 });
      panY.value = withSpring(0, { damping: 17, stiffness: 110 });
    });

  const worldStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }, { translateY: panY.value }],
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <GestureDetector gesture={pan}>
        {/* The ground: terrain and everyone standing on it move together. */}
        <Animated.View style={[StyleSheet.absoluteFill, worldStyle]}>
          <RetroMap width={width} height={height} coords={coords} shape="fill" tilesAcross={13} />

          {nearby.map((vibe, index) => {
            const { x, y } = polarToCanvas(vibe.distance_m, vibe.bearing_deg ?? 0, radarRadius);
            return (
              <Pressable
                key={vibe.spotify_id}
                onPress={() => onSelect(vibe)}
                style={[styles.pin, { left: centerX + x - 36, top: centerY + y - 36 }]}
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
        </Animated.View>
      </GestureDetector>

      {/* HUD: you and your rings stay put while the world moves under you. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Explicit size: the rings and cone position themselves with
            absoluteFill, which collapses to nothing inside a zero-sized box. */}
        <View
          style={[
            styles.hud,
            {
              width: ringSize,
              height: ringSize,
              left: centerX - ringSize / 2,
              top: centerY - ringSize / 2,
            },
          ]}
        >
          <HeadingCone size={ringSize} heading={heading} />
          <View style={StyleSheet.absoluteFill}>
            <MagicRings size={ringSize} />
          </View>

          {RING_FEET.map((feet) => {
            const r = (feet / 300) * (ringSize / 2 - 10);
            return (
              <Text key={feet} style={[styles.ringLabel, { top: ringSize / 2 - r - 7, left: 0, right: 0 }]}>
                {feet} ft
              </Text>
            );
          })}
        </View>

        <View style={[styles.pin, { left: centerX - 40, top: centerY - 40 }]}>
          <AvatarBadge uri={me.avatarUrl} size={56} auraColor={myColor} bobDelayMs={80} />
          <Text style={styles.you}>you</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: {
    position: 'absolute',
  },
  ringLabel: {
    position: 'absolute',
    textAlign: 'center',
    fontSize: 9,
    letterSpacing: 1,
    color: TILE_COLORS.ringGold,
    fontWeight: '800',
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
