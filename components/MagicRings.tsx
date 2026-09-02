import { Circle, G, Path, Svg } from 'react-native-svg';
import { RING_FEET, TILE_COLORS } from '../utils/constants';

type Props = {
  size: number;
};

/**
 * Distance rings at 100 / 200 / 300 ft, drawn as a HUD over the overworld map.
 * Each ring is inked dark first so it stays readable on grass, stone and water
 * alike, then overdrawn with a dashed gold line.
 */
export function MagicRings({ size }: Props) {
  const c = size / 2;
  const maxR = size / 2 - 10;

  return (
    <Svg width={size} height={size}>
      {RING_FEET.map((feet) => {
        const r = (feet / 300) * maxR;
        const outer = feet === 300;
        return (
          <G key={feet}>
            <Circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={TILE_COLORS.ringInk}
              strokeWidth={outer ? 4 : 3}
              strokeOpacity={0.35}
            />
            <Circle
              cx={c}
              cy={c}
              r={r}
              fill="none"
              stroke={outer ? TILE_COLORS.ringGold : TILE_COLORS.ringParchment}
              strokeWidth={outer ? 2 : 1.5}
              strokeDasharray={outer ? '6 6' : '3 7'}
              strokeOpacity={0.9}
            />
          </G>
        );
      })}

      {/* Crosshair at the player's tile. */}
      <Path
        d={`M${c - 9} ${c}H${c - 3}M${c + 3} ${c}H${c + 9}M${c} ${c - 9}V${c - 3}M${c} ${c + 3}V${c + 9}`}
        stroke={TILE_COLORS.ringInk}
        strokeWidth={3}
        strokeOpacity={0.45}
        strokeLinecap="butt"
      />
      <Path
        d={`M${c - 9} ${c}H${c - 3}M${c + 3} ${c}H${c + 9}M${c} ${c - 9}V${c - 3}M${c} ${c + 3}V${c + 9}`}
        stroke={TILE_COLORS.ringGold}
        strokeWidth={1.5}
        strokeOpacity={0.95}
        strokeLinecap="butt"
      />
    </Svg>
  );
}
