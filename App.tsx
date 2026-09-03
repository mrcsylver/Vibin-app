import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import './services/backgroundLocationTask';

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SessionProvider, useSession } from './context/SessionContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { RadarScreen } from './screens/RadarScreen';
import { COLORS } from './utils/constants';

function Gate() {
  const { ready, profile } = useSession();
  const [fontsLoaded, fontError] = useFonts({
    PressStart2P: require('./assets/fonts/PressStart2P-Regular.ttf'),
    VT323: require('./assets/fonts/VT323-Regular.ttf'),
  });

  // A font that fails to load must never brick the app — fall through to the
  // system face instead of holding the boot screen forever.
  if (!ready || (!fontsLoaded && !fontError)) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.cta} />
      </View>
    );
  }
  // The radar is dark and onboarding is pastel, so the bar has to follow.
  return (
    <>
      {profile ? <RadarScreen /> : <OnboardingScreen />}
      <StatusBar style={profile ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <SessionProvider>
            <Gate />
          </SessionProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.meadow,
  },
});
