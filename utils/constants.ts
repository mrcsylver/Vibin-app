export const APP_NAME = 'Vibin';
export const APP_SCHEME = 'vibin';
export const SPOTIFY_REDIRECT_PATH = 'spotify-auth';

/** 300 ft campus bubble (Spotify presence radius). */
export const RADIUS_FT = 300;
export const RADIUS_M = 91.44;
export const RING_FEET = [100, 200, 300] as const;
export const PRESENCE_POLL_MS = 60_000;
export const STATUS_MAX_LEN = 80;

export const COLORS = {
  meadow: '#E8F5E9',
  sky: '#E0F7FA',
  parchment: '#FFF8E7',
  ink: '#3E3A4A',
  muted: '#8A8496',
  white: '#FFFFFF',
  glass: 'rgba(255, 255, 255, 0.72)',
  ring100: 'rgba(186, 104, 200, 0.55)',
  ring200: 'rgba(100, 181, 246, 0.5)',
  ring300: 'rgba(129, 199, 132, 0.5)',
  cta: '#7E57C2',
  ctaDeep: '#5E35B1',
  blush: '#F8BBD0',
  fallbackAura: '#C5A3E8',
} as const;

/**
 * 16-bit overworld palette. Kept deliberately small and flat — every tile is a
 * hard-edged fill from this list, no gradients, so the map reads as pixel art.
 */
export const TILE_COLORS = {
  deepWater: '#1B4A9C',
  water: '#3A78D6',
  waterFoam: '#8FC7F2',
  sand: '#E8CE8B',
  sandDark: '#CFB169',
  grassLight: '#7BC86C',
  grass: '#57AC4B',
  grassDark: '#3C8A3D',
  forest: '#2F7D4E',
  treeLeaf: '#1F6B3B',
  treeLeafHi: '#43A45F',
  treeTrunk: '#6B4A2F',
  stone: '#9A9AA8',
  stoneDark: '#6E6E80',
  stoneHi: '#C6C6D4',
  path: '#C8A96E',
  pathDark: '#A88A54',
  flowerPink: '#F25C7A',
  flowerGold: '#FFE066',
  /** Bezel + ring ink so overlays stay legible on top of terrain. */
  bezel: '#241C33',
  ringInk: '#1B1430',
  ringGold: '#FFD97A',
  ringParchment: '#F6E4B8',
} as const;

/**
 * Bundled pixel faces, loaded in App.tsx. The keys are ours, so `fontFamily`
 * resolves identically on iOS and Android. Both are SIL Open Font License.
 */
export const FONTS = {
  /** Blocky 8-bit face. Legible only in short, all-caps runs. */
  pixel: 'PressStart2P',
  /** Editorial serif. Carries the track title on the share card. */
  serif: 'InstrumentSerif',
  /** Mono for labels, counters and timestamps. */
  mono: 'IBMPlexMono',
} as const;

/** Real-world feet covered by one map tile. 600 ft across / ~16 tiles. */
export const TILE_FEET = 38;

export const STATUS_PRESETS = [
  { id: 'studying', label: '📚 Studying' },
  { id: 'jamming', label: '🎧 Jamming' },
  { id: 'coffee', label: '☕ Coffee Break' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'chilling', label: '😴 Chilling' },
] as const;
