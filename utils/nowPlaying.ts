import type { NowPlaying, NowPlayingState } from '../types';

export type SpotifyImage = { url?: string };

export type SpotifyPlayingJson = {
  is_playing?: boolean;
  currently_playing_type?: 'track' | 'episode' | 'ad' | 'unknown';
  item?: {
    name?: string;
    type?: string;
    artists?: { name: string }[];
    album?: { name?: string; images?: SpotifyImage[] };
    /** Episodes carry their own artwork and a parent show instead of an album. */
    images?: SpotifyImage[];
    show?: { name?: string; images?: SpotifyImage[] };
  } | null;
};

export function nothingPlaying(state: NowPlayingState): NowPlaying {
  return { state, title: null, artist: null, albumName: null, albumArtUrl: null, albumColor: null };
}

function firstImage(...groups: (SpotifyImage[] | undefined)[]): string | null {
  for (const group of groups) {
    const url = group?.[0]?.url;
    if (url) {
      return url;
    }
  }
  return null;
}

/**
 * Turn a `/me/player/currently-playing` response into a radar state.
 *
 * Kept pure and free of native imports so the whole table of Spotify responses
 * can be exercised directly. `albumColor` is always null here — the caller
 * samples it from the artwork afterwards.
 */
export function interpretPlayback(status: number, json: SpotifyPlayingJson | null): NowPlaying {
  // 204 is "nothing playing", and also what a private session returns.
  if (status === 204) {
    return nothingPlaying('idle');
  }
  // The token was revoked, or the account lost the required scope.
  if (status === 401 || status === 403) {
    return nothingPlaying('unlinked');
  }
  if (status < 200 || status >= 300) {
    return nothingPlaying('unavailable');
  }
  // A 200 with no body happens when playback has just stopped.
  if (!json) {
    return nothingPlaying('idle');
  }

  const item = json.item;
  if (!item || json.currently_playing_type === 'ad' || json.currently_playing_type === 'unknown') {
    return nothingPlaying('idle');
  }

  const isEpisode = item.type === 'episode' || json.currently_playing_type === 'episode';
  const title = item.name?.trim() || null;
  if (!title) {
    return nothingPlaying('idle');
  }

  const artists = (item.artists ?? []).map((artist) => artist?.name).filter(Boolean) as string[];
  const artist = isEpisode ? item.show?.name?.trim() || null : artists.join(', ') || null;

  return {
    state: json.is_playing === false ? 'paused' : isEpisode ? 'podcast' : 'playing',
    title,
    artist,
    albumName: isEpisode ? item.show?.name?.trim() || null : item.album?.name?.trim() || null,
    albumArtUrl: firstImage(item.album?.images, item.images, item.show?.images),
    albumColor: null,
  };
}

export type PlaybackCopy = {
  /** Headline for the radar header and the profile sheet. */
  line: string;
  /** Shown only when Spotify has nothing for us, so the user knows they are
   *  still visible and what to do instead. Null while a track is playing. */
  nudge: string | null;
};

const STILL_VISIBLE = 'You are still on the radar — set a status so people know what you are playing.';

/** One source of truth for what the UI says about playback. */
export function describePlayback(now: NowPlaying | null): PlaybackCopy {
  if (!now) {
    return { line: 'Checking Spotify…', nudge: null };
  }

  switch (now.state) {
    case 'playing':
    case 'podcast':
      return { line: `You're on ${now.title}`, nudge: null };
    case 'paused':
      return { line: `Paused — ${now.title}`, nudge: STILL_VISIBLE };
    case 'idle':
      return { line: 'Nothing playing on Spotify', nudge: STILL_VISIBLE };
    case 'unlinked':
      return { line: 'Spotify is not connected', nudge: STILL_VISIBLE };
    case 'unavailable':
      return { line: 'Cannot reach Spotify right now', nudge: STILL_VISIBLE };
  }
}

/** What another listener's pin should read when they have no track. */
export function describeOtherListener(
  trackTitle: string | null,
  status: string,
  username: string,
): { title: string; subtitle: string } {
  if (trackTitle) {
    return { title: trackTitle, subtitle: username };
  }
  if (status.trim()) {
    return { title: status.trim(), subtitle: username };
  }
  return { title: username, subtitle: 'Not sharing a track right now' };
}
