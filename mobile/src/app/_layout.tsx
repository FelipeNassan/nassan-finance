import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  LibreCaslonText_400Regular,
  LibreCaslonText_700Bold,
} from "@expo-google-fonts/libre-caslon-text";
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_700Bold,
} from "@expo-google-fonts/hanken-grotesk";
import { Toast } from "@/components";
import { useAuth } from "@/features/auth/store";
import { colors } from "@/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

// Redireciona conforme o status de autenticação: deslogado → telas (auth);
// autenticado dentro de (auth) → Home.
function GuardaAuth() {
  const status = useAuth((s) => s.status);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (status === "carregando") return;
    const emAuth = segments[0] === "(auth)";
    const isRecuperar = segments[1] && segments[1].startsWith("recuperar");
    
    if (status === "deslogado" && !emAuth) {
      router.replace("/inicio");
    } else if (status === "autenticado" && emAuth && !isRecuperar) {
      router.replace("/");
    }
  }, [status, segments, router]);

  return null;
}

export default function RootLayout() {
  const [fontesProntas] = useFonts({
    Caslon: LibreCaslonText_400Regular,
    CaslonBold: LibreCaslonText_700Bold,
    Hanken: HankenGrotesk_400Regular,
    HankenMedium: HankenGrotesk_500Medium,
    HankenBold: HankenGrotesk_700Bold,
  });

  const status = useAuth((s) => s.status);
  const hidratar = useAuth((s) => s.hidratar);

  useEffect(() => {
    hidratar();
  }, [hidratar]);

  // Só some o splash quando fontes E sessão estiverem prontas (sem flash)
  useEffect(() => {
    if (fontesProntas && status !== "carregando") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontesProntas, status]);

  if (!fontesProntas) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <GuardaAuth />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="index" />
            <Stack.Screen name="extrato" />
            <Stack.Screen
              name="nova"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="perfil"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="despesa/[id]"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
            <Stack.Screen
              name="editar/[id]"
              options={{ presentation: "modal", animation: "slide_from_bottom" }}
            />
          </Stack>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
