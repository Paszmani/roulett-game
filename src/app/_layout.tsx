import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Nunito_400Regular, Nunito_700Bold } from '@expo-google-fonts/nunito';
import { Montserrat_400Regular, Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { RouletteProvider } from '@/contexts/RouletteContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // O 2o valor (error) NAO pode ser ignorado: se uma fonte falhar ao carregar no
  // APK release, `loaded` nunca vira true e o app trava na splash para sempre.
  // Com o fallback abaixo, o jogo entra mesmo com falha (cai na fonte do sistema).
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_600SemiBold,
    Nunito_400Regular,
    Nunito_700Bold,
    Montserrat_400Regular,
    Montserrat_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync().catch(() => {});
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    // SafeAreaProvider e obrigatorio para o <SafeAreaView> das telas receber os
    // insets reais. Sem ele, no Android edge-to-edge os insets ficavam 0 e a
    // barra de status/navegacao cobria o conteudo (topo e base do app).
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        {/* O giro e as animações de vitória SÃO o produto: sem isto, o modo
            "reduzir movimento" do sistema (Windows/Android/iOS) faz o Reanimated
            pular as animações e a roleta cai direto no resultado. */}
        <ReducedMotionConfig mode={ReduceMotion.Never} />
        <RouletteProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
          </Stack>
        </RouletteProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
