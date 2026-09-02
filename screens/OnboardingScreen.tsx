import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AvatarBadge } from '../components/AvatarBadge';
import { AvatarPicker } from '../components/AvatarPicker';
import { useSession } from '../context/SessionContext';
import { assertConfigured } from '../services/config';
import {
  exchangeSpotifyCode,
  fetchSpotifyMe,
  hashSpotifyUserId,
  makeSpotifyRedirectUri,
  useSpotifyAuthRequest,
} from '../services/spotify';
import type { DiceBearStyle } from '../types';
import { buildAvatarUrl, randomSeed } from '../utils/avatar';
import { APP_NAME, COLORS } from '../utils/constants';

export function OnboardingScreen() {
  const { setProfile, requestPermissions } = useSession();
  const [username, setUsername] = useState('');
  const [styleId, setStyleId] = useState<DiceBearStyle>('adventurer');
  const [seed, setSeed] = useState('campus-star');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(assertConfigured());

  const [request, , promptAsync] = useSpotifyAuthRequest();
  const avatarUrl = useMemo(() => buildAvatarUrl(styleId, seed || username || 'vibin'), [styleId, seed, username]);

  const onUsername = (text: string) => {
    setUsername(text);
    setSeed(text.trim() || 'campus-star');
  };

  const onConnect = async () => {
    const configError = assertConfigured();
    if (configError) {
      setError(configError);
      return;
    }
    if (!username.trim()) {
      setError('Pick a campus nickname first.');
      return;
    }
    if (!request) {
      setError('Spotify auth is still preparing. Try again in a second.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await promptAsync();
      const tokens = await exchangeSpotifyCode(request, result);
      const me = await fetchSpotifyMe(tokens.accessToken);
      const hashedId = await hashSpotifyUserId(me.id);

      // Location and notifications are requested BEFORE the profile is saved.
      // Saving the profile is what swaps in the radar screen, and the radar
      // immediately asks the OS for a position — doing it the other way round
      // is what raised DeniedForegroundLocationPermission on first launch.
      const granted = await requestPermissions();

      await setProfile({
        hashedId,
        username: username.trim().slice(0, 24),
        avatarStyle: styleId,
        avatarSeed: seed,
        avatarUrl,
        status: '',
      });

      // A denial is not a dead end: the radar shows its own "enable location"
      // gate with a shortcut into Settings.
      if (granted.locationForeground) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not connect Spotify.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient colors={[COLORS.sky, COLORS.meadow, COLORS.parchment]} style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <Text style={styles.kicker}>CAMPUS AMBIENT MUSIC RADAR</Text>
            <Text style={styles.title}>Welcome to {APP_NAME}</Text>
            <Text style={styles.sub}>See what people around you are listening to in real time.</Text>

            <View style={styles.preview}>
              <AvatarBadge uri={avatarUrl} size={96} bob />
            </View>

            <Text style={styles.label}>Campus nickname</Text>
            <TextInput
              value={username}
              onChangeText={onUsername}
              placeholder="e.g. meadowfox"
              placeholderTextColor="#B0A8BD"
              autoCapitalize="none"
              maxLength={24}
              style={styles.input}
            />

            <Text style={styles.label}>Avatar</Text>
            <AvatarPicker
              styleId={styleId}
              seed={seed || username || 'vibin'}
              onStyleChange={setStyleId}
              onShuffle={() => setSeed(randomSeed())}
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              onPress={onConnect}
              disabled={busy}
              style={[styles.cta, busy && { opacity: 0.7 }]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.ctaText}>Connect Spotify & Jump In</Text>
              )}
            </Pressable>
            <Text style={styles.hint}>
              Presence is ephemeral — your pin vanishes after 15 minutes of quiet. Nobody ever sees your
              coordinates, only how far away and which way you are.
            </Text>
            <Text selectable style={styles.redirect}>
              Spotify redirect URI (paste into the Spotify Dashboard):{'\n'}
              {makeSpotifyRedirectUri()}
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: 24,
    paddingBottom: 40,
  },
  kicker: {
    color: COLORS.cta,
    fontWeight: '800',
    letterSpacing: 1.4,
    fontSize: 11,
  },
  title: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.ink,
  },
  sub: {
    marginTop: 8,
    fontSize: 16,
    color: COLORS.muted,
    lineHeight: 22,
  },
  preview: {
    alignItems: 'center',
    marginVertical: 20,
  },
  label: {
    fontWeight: '700',
    color: COLORS.ink,
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.ink,
    marginBottom: 8,
  },
  error: {
    color: '#C62828',
    marginTop: 12,
    fontWeight: '600',
  },
  cta: {
    marginTop: 22,
    backgroundColor: COLORS.cta,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.ctaDeep,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  ctaText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  hint: {
    marginTop: 14,
    textAlign: 'center',
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  redirect: {
    marginTop: 12,
    textAlign: 'center',
    color: COLORS.ctaDeep,
    fontSize: 11,
    lineHeight: 16,
  },
});
