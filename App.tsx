import 'react-native-gesture-handler';
import 'react-native-url-polyfill/auto';
import './services/backgroundLocationTask';

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { SessionProvider, useSession } from './context/SessionContext';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { RadarScreen } from './screens/RadarScreen';
import { COLORS } from './utils/constants';

function Gate() {
  const { ready, profile } = useSession();
  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={COLORS.cta} />
      </View>
    );
  }
  return profile ? <RadarScreen /> : <OnboardingScreen />;
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <SessionProvider>
            <Gate />
            <StatusBar style="dark" />
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
