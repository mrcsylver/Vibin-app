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

export const STATUS_PRESETS = [
  { id: 'studying', label: '📚 Studying' },
  { id: 'jamming', label: '🎧 Jamming' },
  { id: 'coffee', label: '☕ Coffee Break' },
  { id: 'gaming', label: '🎮 Gaming' },
  { id: 'chilling', label: '😴 Chilling' },
] as const;
