import Constants from 'expo-constants';

type PublicEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  spotifyClientId: string;
};

function read(key: string): string {
  const extra = Constants.expoConfig?.extra as Record<string, string> | undefined;
  return (process.env[key] ?? extra?.[key] ?? '').trim();
}

export function getPublicEnv(): PublicEnv {
  return {
    supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
    supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
    spotifyClientId: read('EXPO_PUBLIC_SPOTIFY_CLIENT_ID'),
  };
}

export function assertConfigured(): string | null {
  const env = getPublicEnv();
  if (!env.supabaseUrl.includes('supabase.co') || env.supabaseUrl.includes('YOUR_PROJECT')) {
    return 'Add your Supabase URL to .env (EXPO_PUBLIC_SUPABASE_URL).';
  }
  if (!env.supabaseAnonKey || env.supabaseAnonKey.includes('YOUR_SUPABASE')) {
    return 'Add your Supabase anon key to .env (EXPO_PUBLIC_SUPABASE_ANON_KEY).';
  }
  if (!env.spotifyClientId || env.spotifyClientId.includes('YOUR_SPOTIFY')) {
    return 'Add your Spotify Client ID to .env (EXPO_PUBLIC_SPOTIFY_CLIENT_ID).';
  }
  return null;
}
