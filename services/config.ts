import Constants from 'expo-constants';

type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  spotifyClientId: string;
};

/**
 * These MUST stay literal `process.env.EXPO_PUBLIC_*` member reads.
 *
 * babel-preset-expo inlines public env vars at build time, but only for static
 * access — a computed `process.env[key]` is skipped by the transform and
 * resolves to `undefined` in a release bundle. The development server injects a
 * populated `process.env` at runtime, so a computed lookup appears to work in
 * Expo Go and then silently fails in the App Store build.
 */
const INLINED_ENV = {
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_SPOTIFY_CLIENT_ID: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID,
} as const;

type EnvKey = keyof typeof INLINED_ENV;

function read(key: EnvKey): string {
  // `extra` is the second path: app.config.js mirrors the same values into the
  // manifest, so the build still works if inlining is ever bypassed.
  const extra = Constants.expoConfig?.extra as Record<string, string | undefined> | undefined;
  return (INLINED_ENV[key] ?? extra?.[key] ?? '').trim();
}

export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    spotifyClientId: read('EXPO_PUBLIC_SPOTIFY_CLIENT_ID'),
  };
}

/**
 * A Supabase project URL is always `https://<project-ref>.supabase.co`, where the
 * ref is 20 lowercase letters. Checking the shape catches the easy mistake of
 * pasting an API key into the URL slot — `includes('supabase.co')` does not,
 * and the app then fails every request against a host that does not exist.
 */
const SUPABASE_URL_PATTERN = /^https:\/\/[a-z0-9]{16,32}\.supabase\.(co|in)$/;

export function assertConfigured(): string | null {
  const env = getPublicEnv();
  if (!env.supabaseUrl || env.supabaseUrl.includes('YOUR_PROJECT')) {
    return 'Add your Supabase URL to .env (EXPO_PUBLIC_SUPABASE_URL).';
  }
  if (!SUPABASE_URL_PATTERN.test(env.supabaseUrl)) {
    return 'EXPO_PUBLIC_SUPABASE_URL must look like https://your-project-ref.supabase.co (not an API key).';
  }
  if (!env.supabaseAnonKey || env.supabaseAnonKey.includes('YOUR_SUPABASE')) {
    return 'Add your Supabase anon key to .env (EXPO_PUBLIC_SUPABASE_ANON_KEY).';
  }
  if (!env.spotifyClientId || env.spotifyClientId.includes('YOUR_SPOTIFY')) {
    return 'Add your Spotify Client ID to .env (EXPO_PUBLIC_SPOTIFY_CLIENT_ID).';
  }
  return null;
}
