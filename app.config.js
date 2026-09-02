/**
 * Dynamic layer on top of app.json.
 *
 * Expo reads app.json first and hands it here as `config`, so app.json stays the
 * single place to edit static settings. This file only fills in the two things
 * that depend on how the build is being produced.
 */

/**
 * `aps-environment` has to match the provisioning profile or codesigning fails.
 * Apple's Development profiles carry `development`; Ad Hoc (EAS `preview`) and
 * App Store (EAS `production`, the TestFlight path) both carry `production`.
 */
function apsEnvironmentFor(profile) {
  if (!profile || profile === 'development') {
    return 'development';
  }
  return 'production';
}

function withNotificationMode(plugins, mode) {
  let found = false;

  const next = (plugins ?? []).map((entry) => {
    if (entry === 'expo-notifications') {
      found = true;
      return ['expo-notifications', { mode }];
    }
    if (Array.isArray(entry) && entry[0] === 'expo-notifications') {
      found = true;
      return ['expo-notifications', { ...(entry[1] ?? {}), mode }];
    }
    return entry;
  });

  return found ? next : [...next, ['expo-notifications', { mode }]];
}

module.exports = ({ config }) => {
  const mode = apsEnvironmentFor(process.env.EAS_BUILD_PROFILE);

  return {
    ...config,
    plugins: withNotificationMode(config.plugins, mode),
    extra: {
      ...config.extra,
      // Mirrored so the app can still read its configuration from the manifest
      // if Metro's env inlining is ever bypassed. Values are already public —
      // the Supabase anon key is protected by RLS, and Spotify uses PKCE.
      EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
      EXPO_PUBLIC_SPOTIFY_CLIENT_ID: process.env.EXPO_PUBLIC_SPOTIFY_CLIENT_ID ?? '',
    },
  };
};
