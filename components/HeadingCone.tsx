import { memo, useId } from 'react';
import { StyleSheet, View } from 'react-native';
import { Defs, LinearGradient, Path, Stop, Svg } from 'react-native-svg';
import { TILE_COLORS } from '../utils/constants';

const HALF_ANGLE_DEG = 26;

type Props = {
  size: number;
  /** Compass heading in degrees clockwise from true north, or null if unknown. */
  heading: number | null;
};

function wedgePath(center: number, radius: number): string {
  const a = (HALF_ANGLE_DEG * Math.PI) / 180;
  const leftX = center + Math.sin(-a) * radius;
  const leftY = center - Math.cos(-a) * radius;
  const rightX = center + Math.sin(a) * radius;
  const rightY = center - Math.cos(a) * radius;
  // Sweep 1 = clockwise, i.e. up and over the top of the disc.
  return `M${center} ${center}L${leftX} ${leftY}A${radius} ${radius} 0 0 1 ${rightX} ${rightY}Z`;
}

/**
 * Static cone sprite. The parent rotates the wrapper view, so turning on the
 * spot never re-renders any SVG node.
 */
const Cone = memo(function Cone({ size }: { size: number }) {
  const beamId = `beam${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const center = size / 2;
  const radius = size * 0.34;

  return (
    <Svg width={size} height={size}>
      <Defs>
        <LinearGradient id={beamId} x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0%" stopColor={TILE_COLORS.ringGold} stopOpacity="0.55" />
          <Stop offset="100%" stopColor={TILE_COLORS.ringGold} stopOpacity="0.02" />
        </LinearGradient>
      </Defs>
      <Path d={wedgePath(center, radius)} fill={`url(#${beamId})`} />
      {/* Chunky arrowhead so the facing direction reads at a glance. */}
      <Path
        d={`M${center} ${center - 30}l7 12h-4v8h-6v-8h-4z`}
        fill={TILE_COLORS.ringGold}
        stroke={TILE_COLORS.ringInk}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  );
});

export function HeadingCone({ size, heading }: Props) {
  if (heading === null) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { transform: [{ rotate: `${heading}deg` }] }]}
    >
      <Cone size={size} />
    </View>
  );
}
