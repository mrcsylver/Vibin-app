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
  width: number;
  /** Defaults to a square. */
  height?: number;
  coords: { latitude: number; longitude: number } | null;
  /**
   * `disc` clips to a circle with a bezel and compass, for the share card.
   * `fill` paints the whole rectangle, for the full-screen radar backdrop.
   */
  shape?: 'disc' | 'fill';
  /** How many sprite tiles fit across the shorter edge. Higher = finer terrain. */
  tilesAcross?: number;
};

/**
 * Top-down 16-bit overworld.
 *
 * The terrain is generated procedurally from the user's real coordinates, so it
 * needs no tile server, no API key and no network round-trip — and it scrolls
 * like a real map as you walk. Every tile is flattened into one `<Path>` per
 * colour before it reaches react-native-svg (see `buildMapLayers`).
 */
export function RetroMap({ width, height, coords, shape = 'disc', tilesAcross = 16 }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const clipId = `clip${uid}`;
  const vignetteId = `vignette${uid}`;

  const h = height ?? width;
  const tileSize = Math.min(width, h) / tilesAcross;
  // Cover the long edge too, or a landscape viewport shows bare backdrop.
  const tilesDown = Math.ceil(h / tileSize);
  const tilesWide = Math.ceil(width / tileSize);

  const view = tileWindowFor(coords, tilesWide, tilesDown);
  const layers = useMemo(
    () => buildMapLayers(view, tilesWide, tilesDown, tileSize),
    // Rebuild only when the snapped tile window actually moves, not on every
    // metre of GPS jitter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [view.originTx, view.originTy, view.fractionX, view.fractionY, tilesWide, tilesDown, tileSize],
  );

  const isDisc = shape === 'disc';
  const cx = width / 2;
  const cy = h / 2;
  const radius = Math.min(width, h) / 2 - 3;

  return (
    <Svg width={width} height={h}>
      <Defs>
        <ClipPath id={clipId}>
          {isDisc ? (
            <Circle cx={cx} cy={cy} r={radius} />
          ) : (
            <Rect x={0} y={0} width={width} height={h} />
          )}
        </ClipPath>
        <RadialGradient id={vignetteId} cx="50%" cy="50%" r="50%">
          <Stop offset="55%" stopColor={TILE_COLORS.bezel} stopOpacity="0" />
          <Stop offset="100%" stopColor={TILE_COLORS.bezel} stopOpacity={isDisc ? '0.45' : '0.7'} />
        </RadialGradient>
      </Defs>

      <G clipPath={`url(#${clipId})`}>
        {/* Backstop so no seam can ever show through the terrain. */}
        <Rect x={0} y={0} width={width} height={h} fill={TILE_COLORS.deepWater} />
        {layers.map((layer, index) => (
          <Path key={`${layer.fill}-${index}`} d={layer.d} fill={layer.fill} />
        ))}
        <Rect x={0} y={0} width={width} height={h} fill={`url(#${vignetteId})`} />
      </G>

      {isDisc ? (
        <>
          {/* Chunky bezel, like the border of an old handheld's screen. */}
          <Circle cx={cx} cy={cy} r={radius} fill="none" stroke={TILE_COLORS.bezel} strokeWidth={6} />
          <Circle
            cx={cx}
            cy={cy}
            r={radius - 4}
            fill="none"
            stroke={TILE_COLORS.ringParchment}
            strokeWidth={1.5}
            strokeOpacity={0.55}
          />

          {/* Compass rose: the radar is drawn north-up, so bearings read true. */}
          <G>
            <Rect
              x={cx - 11}
              y={2}
              width={22}
              height={15}
              fill={TILE_COLORS.bezel}
              stroke={TILE_COLORS.ringGold}
              strokeWidth={1.5}
            />
            <SvgText
              x={cx}
              y={13}
              fill={TILE_COLORS.ringGold}
              fontSize={10}
              fontWeight="bold"
              textAnchor="middle"
            >
              N
            </SvgText>
          </G>
        </>
      ) : null}
    </Svg>
  );
}
