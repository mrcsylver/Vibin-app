export type DiceBearStyle = 'bottts' | 'adventurer' | 'fun-emoji' | 'lorelei';

export type Profile = {
  hashedId: string;
  username: string;
  avatarStyle: DiceBearStyle;
  avatarSeed: string;
  avatarUrl: string;
  status: string;
};

export type SpotifyTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type NowPlaying = {
  title: string | null;
  artist: string | null;
  albumArtUrl: string | null;
  albumColor: string | null;
};

export type NearbyVibe = {
  spotify_id: string;
  username: string;
  avatar_url: string;
  status: string;
  track_title: string | null;
  track_artist: string | null;
  album_art_url: string | null;
  album_color: string | null;
  distance_m: number;
  bearing_deg: number;
};

export type RadarPin = NearbyVibe & {
  x: number;
  y: number;
  distanceFt: number;
};

export type LikeTotals = {
  /** Lifetime nudges received. Survives the 15-minute presence sweep. */
  likesReceived: number;
  /** Lifetime nudges sent. */
  likesSent: number;
  /** Nudges received inside the current live window. */
  recentReceived: number;
  /** When this listener was first counted, ISO-8601. */
  firstSeenAt: string | null;
};
