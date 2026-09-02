import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, TILE_COLORS } from '../utils/constants';

type Props = {
  uri: string;
  size?: number;
  auraColor?: string | null;
  bob?: boolean;
  bobDelayMs?: number;
};

export function AvatarBadge({ uri, size = 56, auraColor, bob = true, bobDelayMs = 0 }: Props) {
  const offset = useSharedValue(0);

  useEffect(() => {
    if (!bob) {
      return;
    }
    const timeout = setTimeout(() => {
      offset.value = withRepeat(
        withTiming(-6, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        -1,
        true,
      );
    }, bobDelayMs);
    return () => clearTimeout(timeout);
  }, [bob, bobDelayMs, offset]);

  const bobStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  const aura = auraColor ?? COLORS.fallbackAura;

  return (
    <Animated.View style={[bobStyle, { width: size + 18, height: size + 18, alignItems: 'center', justifyContent: 'center' }]}>
      <View
        style={[
          styles.aura,
          {
            width: size + 16,
            height: size + 16,
            borderRadius: (size + 16) / 2,
            backgroundColor: aura,
            shadowColor: aura,
          },
        ]}
      />
      <View
        style={[
          styles.badge,
          {
            width: size,
            height: size,
            borderRadius: size / 2.2,
          },
        ]}
      >
        <Image source={{ uri }} style={{ width: size - 6, height: size - 6, borderRadius: (size - 6) / 2.2 }} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aura: {
    position: 'absolute',
    opacity: 0.45,
    shadowOpacity: 0.65,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  badge: {
    backgroundColor: COLORS.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6A5A80',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    // Hard dark outline: sprites have to stay legible on top of grass, stone
    // and water alike, and it suits the pixel-art look.
    borderWidth: 2,
    borderColor: TILE_COLORS.bezel,
  },
});
