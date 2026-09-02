import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { APP_SCHEME, SPOTIFY_REDIRECT_PATH } from '../utils/constants';
import { extractAlbumColor } from '../utils/colors';
import { getPublicEnv } from './config';
import { loadTokens, saveTokens } from './storage';
import { interpretPlayback, nothingPlaying, type SpotifyPlayingJson } from '../utils/nowPlaying';
import type { NowPlaying, SpotifyTokens } from '../types';

WebBrowser.maybeCompleteAuthSession();

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.spotify.com/authorize',
  tokenEndpoint: 'https://accounts.spotify.com/api/token',
};

const SPOTIFY_SCOPES = ['user-read-currently-playing', 'user-read-playback-state'];

export function makeSpotifyRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: SPOTIFY_REDIRECT_PATH,
  });
}

export function useSpotifyAuthRequest() {
  const { spotifyClientId } = getPublicEnv();
  const redirectUri = makeSpotifyRedirectUri();

  return AuthSession.useAuthRequest(
    {
      clientId: spotifyClientId,
      scopes: SPOTIFY_SCOPES,
      usePKCE: true,
      redirectUri,
    },
    discovery,
  );
}

export async function exchangeSpotifyCode(
  request: AuthSession.AuthRequest,
  response: AuthSession.AuthSessionResult,
): Promise<SpotifyTokens> {
  const { spotifyClientId } = getPublicEnv();

  if (response.type !== 'success' || !request.codeVerifier) {
    throw new Error('Spotify sign-in was cancelled or incomplete.');
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId: spotifyClientId,
      code: response.params.code,
      extraParams: { code_verifier: request.codeVerifier },
      redirectUri: request.redirectUri,
    },
    discovery,
  );

  if (!tokenResponse.accessToken) {
    throw new Error('Spotify did not return an access token.');
  }

  const tokens: SpotifyTokens = {
    accessToken: tokenResponse.accessToken,
    refreshToken: tokenResponse.refreshToken ?? '',
    expiresAt: Date.now() + (tokenResponse.expiresIn ?? 3600) * 1000,
  };
  await saveTokens(tokens);
  return tokens;
}

async function refreshAccessToken(tokens: SpotifyTokens): Promise<SpotifyTokens> {
  const { spotifyClientId } = getPublicEnv();
  if (!tokens.refreshToken) {
    return tokens;
  }

  const refreshed = await AuthSession.refreshAsync(
    {
      clientId: spotifyClientId,
      refreshToken: tokens.refreshToken,
    },
    discovery,
  );

  const next: SpotifyTokens = {
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
    expiresAt: Date.now() + (refreshed.expiresIn ?? 3600) * 1000,
  };
  await saveTokens(next);
  return next;
}

/** Returns a valid access token, refreshing a minute before expiry. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await loadTokens();
  if (!tokens) {
    return null;
  }
  if (Date.now() < tokens.expiresAt - 60_000) {
    return tokens.accessToken;
  }
  try {
    const next = await refreshAccessToken(tokens);
    return next.accessToken;
  } catch {
    return tokens.accessToken;
  }
}

export async function hashSpotifyUserId(rawId: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `vibin:${rawId}`);
}

export async function fetchSpotifyMe(accessToken: string): Promise<{ id: string; displayName: string }> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error('Could not load your Spotify profile.');
  }
  const json = (await res.json()) as { id: string; display_name?: string };
  return { id: json.id, displayName: json.display_name ?? 'listener' };
}

/**
 * What the listener is playing on Spotify, if anything.
 *
 * Never throws and never collapses every case into a bare "nothing playing":
 * plenty of listeners are on Apple Music, a record player, or a private
 * session, and they still belong on the radar with their status line. The
 * distinct states let the UI say something true instead of always nagging
 * about Spotify. Parsing lives in `utils/nowPlaying.ts`.
 */
export async function fetchNowPlaying(): Promise<NowPlaying> {
  let accessToken: string | null = null;
  try {
    accessToken = await getValidAccessToken();
  } catch {
    return nothingPlaying('unavailable');
  }
  if (!accessToken) {
    return nothingPlaying('unlinked');
  }

  let status: number;
  let json: SpotifyPlayingJson | null = null;
  try {
    const res = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    status = res.status;
    if (res.ok && res.status !== 204) {
      json = (await res.json().catch(() => null)) as SpotifyPlayingJson | null;
    }
  } catch {
    // Offline, or the request was cut short. Presence still gets published.
    return nothingPlaying('unavailable');
  }

  const playback = interpretPlayback(status, json);
  if (!playback.albumArtUrl) {
    return playback;
  }

  try {
    return { ...playback, albumColor: await extractAlbumColor(playback.albumArtUrl) };
  } catch {
    return playback;
  }
}
