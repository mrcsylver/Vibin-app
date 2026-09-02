import { useId, useMemo } from 'react';
import {
  Circle,
  ClipPath,
  Defs,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Text as SvgText,
} from 'react-native-svg';
import { TILE_COLORS } from '../utils/constants';
import { buildMapLayers, tileWindowFor } from '../utils/tiles';

type Props = {
  size: number;
  coords: { latitude: number; longitude: number } | null;
  /** How many sprite tiles fit across the disc. Higher = finer terrain. */
  tilesAcross?: number;
};

/**
 * Top-down 16-bit overworld drawn under the radar.
 *
 * The terrain is generated procedurally from the user's real coordinates, so it
 * needs no tile server, no API key and no network round-trip — and it scrolls
 * like a real map as you walk. Every tile is flattened into one `<Path>` per
 * colour before it reaches react-native-svg (see `buildMapLayers`).
 */
export function RetroMap({ size, coords, tilesAcross = 16 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const discId = `disc${uid}`;
  const vignetteId = `vignette${uid}`;

  const center = size / 2;
  const radius = size / 2 - 3;
  const tileSize = size / tilesAcross;

  const view = tileWindowFor(coords, tilesAcross);
  const layers = useMemo(
    () => buildMapLayers(view, tilesAcross, tileSize),
    // Rebuild only when the snapped tile window actually moves, not on every
    // metre of GPS jitter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.originTx, view.originTy, view.fractionX, view.fractionY, tilesAcross, tileSize],
  );

  return (
    <Svg width={size} height={size}>
      <Defs>
        <ClipPath id={discId}>
          <Circle cx={center} cy={center} r={radius} />
        </ClipPath>
        <RadialGradient id={vignetteId} cx="50%" cy="50%" r="50%">
          <Stop offset="55%" stopColor={TILE_COLORS.bezel} stopOpacity="0" />
          <Stop offset="100%" stopColor={TILE_COLORS.bezel} stopOpacity="0.45" />
        </RadialGradient>
      </Defs>

      <G clipPath={`url(#${discId})`}>
        {/* Backstop so no seam can ever show through the terrain. */}
        <Rect x={0} y={0} width={size} height={size} fill={TILE_COLORS.deepWater} />
        {layers.map((layer, index) => (
          <Path key={`${layer.fill}-${index}`} d={layer.d} fill={layer.fill} />
        ))}
        <Rect x={0} y={0} width={size} height={size} fill={`url(#${vignetteId})`} />
      </G>

      {/* Chunky bezel, like the border of an old handheld's screen. */}
      <Circle cx={center} cy={center} r={radius} fill="none" stroke={TILE_COLORS.bezel} strokeWidth={6} />
      <Circle
        cx={center}
        cy={center}
        r={radius - 4}
        fill="none"
        stroke={TILE_COLORS.ringParchment}
        strokeWidth={1.5}
        strokeOpacity={0.55}
      />

      {/* Compass rose: the radar is drawn north-up, so bearings read true. */}
      <G>
        <Rect
          x={center - 11}
          y={2}
          width={22}
          height={15}
          fill={TILE_COLORS.bezel}
          stroke={TILE_COLORS.ringGold}
          strokeWidth={1.5}
        />
        <SvgText
          x={center}
          y={13}
          fill={TILE_COLORS.ringGold}
          fontSize={10}
          fontWeight="bold"
          textAnchor="middle"
        >
          N
        </SvgText>
      </G>
    </Svg>
  );
}
