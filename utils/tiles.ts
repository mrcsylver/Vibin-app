import { TILE_COLORS, TILE_FEET } from './constants';

/** Every tile is drawn on an 8x8 pixel grid so decorations snap like real sprites. */
export const TILE_PX = 8;

export type TileKind =
  | 'deepWater'
  | 'water'
  | 'sand'
  | 'meadow'
  | 'grass'
  | 'forest'
  | 'stone'
  | 'path';

export type TilePixel = {
  /** Pixel-grid coordinates inside the tile, 0..TILE_PX. */
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
};

export type Tile = {
  key: string;
  kind: TileKind;
  base: string;
  pixels: TilePixel[];
};

// -----------------------------------------------------------------------------
// Deterministic value noise. The same world coordinates always generate the same
// terrain, so the map is stable while the user walks around inside it.
// -----------------------------------------------------------------------------

function hash2(x: number, y: number, seed: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function valueNoise(x: number, y: number, seed: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = smoothstep(x - xi);
  const yf = smoothstep(y - yi);

  const a = hash2(xi, yi, seed);
  const b = hash2(xi + 1, yi, seed);
  const c = hash2(xi, yi + 1, seed);
  const d = hash2(xi + 1, yi + 1, seed);

  const top = a + (b - a) * xf;
  const bottom = c + (d - c) * xf;
  return top + (bottom - top) * yf;
}

function fbm(x: number, y: number, seed: number): number {
  const low = valueNoise(x / 6.5, y / 6.5, seed);
  const high = valueNoise(x / 2.3, y / 2.3, seed + 7);
  const mixed = low * 0.68 + high * 0.32;
  // Stretch around the midpoint so oceans and peaks actually appear.
  return Math.min(1, Math.max(0, (mixed - 0.5) * 1.9 + 0.5));
}

function clampInt(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value)));
}

// -----------------------------------------------------------------------------
// Terrain classification
// -----------------------------------------------------------------------------

function kindAt(tx: number, ty: number): TileKind {
  const elevation = fbm(tx, ty, 11);
  const moisture = fbm(tx + 91.7, ty - 43.3, 29);

  // Thresholds are tuned against the measured noise quantiles so roughly three
  // quarters of the world is walkable land — the player should almost never
  // open the radar and find themselves in open ocean.
  if (elevation < 0.03) return 'deepWater';
  if (elevation < 0.1) return 'water';
  if (elevation < 0.16) return 'sand';
  if (elevation > 0.9) return 'stone';

  // A meandering dirt road threaded through the walkable band.
  const road = valueNoise(tx / 9, ty / 9, 77);
  if (Math.abs(road - 0.5) < 0.03) return 'path';

  if (moisture > 0.66) return 'forest';
  if (moisture > 0.44) return 'grass';
  return 'meadow';
}

const BASE_COLOR: Record<TileKind, string> = {
  deepWater: TILE_COLORS.deepWater,
  water: TILE_COLORS.water,
  sand: TILE_COLORS.sand,
  meadow: TILE_COLORS.grassLight,
  grass: TILE_COLORS.grass,
  forest: TILE_COLORS.forest,
  stone: TILE_COLORS.stone,
  path: TILE_COLORS.path,
};

// -----------------------------------------------------------------------------
// Sprite decorations, chosen deterministically per tile.
// -----------------------------------------------------------------------------

function decorate(tx: number, ty: number, kind: TileKind): TilePixel[] {
  const r1 = hash2(tx, ty, 101);
  const r2 = hash2(tx, ty, 211);
  const r3 = hash2(tx, ty, 307);
  const px = (v: number) => clampInt(v, TILE_PX - 1);

  switch (kind) {
    case 'deepWater':
      return r1 < 0.25
        ? [{ x: px(r2 * 6), y: px(r3 * 6) + 1, w: 2, h: 1, fill: TILE_COLORS.water }]
        : [];

    case 'water': {
      const pixels: TilePixel[] = [
        { x: px(r2 * 5), y: px(r3 * 6), w: 3, h: 1, fill: TILE_COLORS.waterFoam },
      ];
      if (r1 < 0.45) {
        pixels.push({ x: px(r1 * 5) + 1, y: px(r2 * 5) + 2, w: 2, h: 1, fill: TILE_COLORS.deepWater });
      }
      return pixels;
    }

    case 'sand': {
      const pixels: TilePixel[] = [];
      if (r1 < 0.6) pixels.push({ x: px(r2 * 7), y: px(r3 * 7), w: 1, h: 1, fill: TILE_COLORS.sandDark });
      if (r2 < 0.4) pixels.push({ x: px(r3 * 7), y: px(r1 * 7), w: 1, h: 1, fill: TILE_COLORS.sandDark });
      return pixels;
    }

    case 'meadow':
    case 'grass': {
      const pixels: TilePixel[] = [];
      const tuft = kind === 'grass' ? TILE_COLORS.grassDark : TILE_COLORS.grass;
      pixels.push({ x: px(r1 * 6), y: px(r2 * 6) + 1, w: 2, h: 1, fill: tuft });
      if (r3 < 0.18) {
        // Tiny 3x3 flower sprite.
        const fx = px(r1 * 5) + 1;
        const fy = px(r2 * 5) + 1;
        const petal = r1 < 0.5 ? TILE_COLORS.flowerPink : TILE_COLORS.flowerGold;
        pixels.push({ x: fx, y: fy - 1, w: 1, h: 1, fill: petal });
        pixels.push({ x: fx - 1, y: fy, w: 3, h: 1, fill: petal });
        pixels.push({ x: fx, y: fy + 1, w: 1, h: 1, fill: petal });
        pixels.push({ x: fx, y: fy, w: 1, h: 1, fill: TILE_COLORS.flowerGold });
      }
      return pixels;
    }

    case 'forest': {
      // 6x6 canopy on a 2x2 trunk, jittered a pixel so the woods look hand-placed.
      const ox = r1 < 0.5 ? 0 : 1;
      const oy = r2 < 0.5 ? 0 : 1;
      return [
        { x: 3 + ox, y: 5 + oy, w: 2, h: 2, fill: TILE_COLORS.treeTrunk },
        { x: 1 + ox, y: 1 + oy, w: 6, h: 4, fill: TILE_COLORS.treeLeaf },
        { x: 2 + ox, y: 0 + oy, w: 4, h: 1, fill: TILE_COLORS.treeLeaf },
        { x: 2 + ox, y: 1 + oy, w: 2, h: 1, fill: TILE_COLORS.treeLeafHi },
        { x: 1 + ox, y: 2 + oy, w: 1, h: 1, fill: TILE_COLORS.treeLeafHi },
      ];
    }

    case 'stone': {
      const pixels: TilePixel[] = [
        { x: 1, y: 2, w: 6, h: 4, fill: TILE_COLORS.stoneDark },
        { x: 2, y: 3, w: 3, h: 1, fill: TILE_COLORS.stoneHi },
      ];
      if (r1 < 0.4) pixels.push({ x: 5, y: 1, w: 2, h: 1, fill: TILE_COLORS.stoneHi });
      return pixels;
    }

    case 'path': {
      const pixels: TilePixel[] = [];
      pixels.push({ x: px(r1 * 6), y: px(r2 * 6), w: 2, h: 1, fill: TILE_COLORS.pathDark });
      if (r3 < 0.5) pixels.push({ x: px(r3 * 6) + 1, y: px(r1 * 6) + 2, w: 1, h: 1, fill: TILE_COLORS.pathDark });
      return pixels;
    }
  }
}

export function buildTile(tx: number, ty: number): Tile {
  const kind = kindAt(tx, ty);
  return {
    key: `${tx}:${ty}`,
    kind,
    base: BASE_COLOR[kind],
    pixels: decorate(tx, ty, kind),
  };
}

// -----------------------------------------------------------------------------
// Geo → tile projection
// -----------------------------------------------------------------------------

const METERS_PER_TILE = TILE_FEET * 0.3048;
const METERS_PER_DEG_LAT = 110_574;

export type TileWindow = {
  /** Integer tile coordinate of the top-left tile to draw. */
  originTx: number;
  originTy: number;
  /** Sub-tile scroll offset in the range [0, 1). */
  fractionX: number;
  fractionY: number;
};

/**
 * Map a geographic position onto the infinite tile grid. Equirectangular is
 * plenty at a 300 ft radius, and it keeps the terrain locked to real ground so
 * walking north scrolls the map south.
 */
export function tileWindowFor(
  coords: { latitude: number; longitude: number } | null,
  tilesWide: number,
  tilesDown: number = tilesWide,
): TileWindow {
  if (!coords) {
    return { originTx: 0, originTy: 0, fractionX: 0, fractionY: 0 };
  }

  const metersPerDegLng = 111_320 * Math.cos((coords.latitude * Math.PI) / 180);
  const worldX = (coords.longitude * metersPerDegLng) / METERS_PER_TILE;
  const worldY = -(coords.latitude * METERS_PER_DEG_LAT) / METERS_PER_TILE;

  // Centre the viewport on the user, in each axis independently so a tall
  // phone screen stays centred rather than anchored to a square.
  const leftEdge = worldX - tilesWide / 2;
  const topEdge = worldY - tilesDown / 2;

  const originTx = Math.floor(leftEdge);
  const originTy = Math.floor(topEdge);

  // Snap the scroll offset to whole sprite pixels. GPS jitter then stops
  // rebuilding the map every heartbeat, and the pixel grid stays aligned.
  // Snapping can round a fraction up to exactly 1, which is really the next
  // tile over, so carry it into the origin and keep the fraction in [0, 1).
  const snap = (value: number) => Math.round(value * TILE_PX) / TILE_PX;
  const carry = (origin: number, fraction: number): [number, number] =>
    fraction >= 1 ? [origin + 1, fraction - 1] : [origin, fraction];

  const [tx, fractionX] = carry(originTx, snap(leftEdge - originTx));
  const [ty, fractionY] = carry(originTy, snap(topEdge - originTy));

  return { originTx: tx, originTy: ty, fractionX, fractionY };
}

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

export type MapLayer = { fill: string; d: string };

function rectPath(x: number, y: number, w: number, h: number): string {
  const x0 = Math.round(x * 100) / 100;
  const y0 = Math.round(y * 100) / 100;
  const x1 = Math.round((x + w) * 100) / 100;
  const y1 = Math.round((y + h) * 100) / 100;
  return `M${x0} ${y0}H${x1}V${y1}H${x0}Z`;
}

function collect(bucket: Map<string, string[]>, fill: string, path: string): void {
  const existing = bucket.get(fill);
  if (existing) {
    existing.push(path);
  } else {
    bucket.set(fill, [path]);
  }
}

function flatten(bucket: Map<string, string[]>): MapLayer[] {
  return Array.from(bucket, ([fill, parts]) => ({ fill, d: parts.join('') }));
}

/**
 * Flatten the visible tile grid into one `<Path>` per colour. A full-screen
 * window is a couple of thousand sprite rectangles; emitting them individually
 * would choke react-native-svg, while merging by fill keeps the whole map under
 * twenty nodes.
 */
export function buildMapLayers(
  window: TileWindow,
  tilesWide: number,
  tilesDown: number,
  tileSize: number,
): MapLayer[] {
  const unit = tileSize / TILE_PX;
  const base = new Map<string, string[]>();
  const decoration = new Map<string, string[]>();

  // Overdraw a hair so neighbouring fills never show a seam.
  const bleed = 0.75;

  for (let j = 0; j <= tilesDown; j += 1) {
    for (let i = 0; i <= tilesWide; i += 1) {
      const tile = buildTile(window.originTx + i, window.originTy + j);
      const left = (i - window.fractionX) * tileSize;
      const top = (j - window.fractionY) * tileSize;

      collect(base, tile.base, rectPath(left, top, tileSize + bleed, tileSize + bleed));

      for (const pixel of tile.pixels) {
        collect(
          decoration,
          pixel.fill,
          rectPath(left + pixel.x * unit, top + pixel.y * unit, pixel.w * unit + bleed / 2, pixel.h * unit + bleed / 2),
        );
      }
    }
  }

  // Base terrain first, sprites on top.
  return [...flatten(base), ...flatten(decoration)];
}
