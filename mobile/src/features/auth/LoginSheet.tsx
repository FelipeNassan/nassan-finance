import { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Keyboard,
  Platform,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Text, Button, Field } from "@/components";
import { authApi } from "./api";
import { useAuth } from "./store";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";
import { colors, spacing } from "@/theme";
import { useOnboarding } from "@/store/onboarding";

interface Props {
  aberto: boolean;
}

// Bottom sheet de login: altura definida pelo conteúdo (fica "baixinho"),
// sobe suave (sem overshoot) e acompanha o teclado. Depois de aberto não
// fecha — toque fora só recolhe o teclado.
export function LoginSheet({ aberto }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const aplicarCredenciais = useAuth((s) => s.aplicarCredenciais);
  const mostrarToast = useToast((s) => s.mostrar);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const [altura, setAltura] = useState(0);
  const progresso = useSharedValue(0); // 0 escondido, 1 visível
  const teclado = useSharedValue(0); // altura do teclado

  // Entrada suave, sem pulo (timing ease-out em vez de spring)
  useEffect(() => {
    if (aberto && altura > 0) {
      progresso.value = withTiming(1, {
        duration: 380,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [aberto, altura, progresso]);

  // Sobe junto com o teclado; desce quando ele some
  useEffect(() => {
    const evtShow = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const evtHide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const s1 = Keyboard.addListener(evtShow, (e) => {
      teclado.value = withTiming(e.endCoordinates.height - insets.bottom, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
    });
    const s2 = Keyboard.addListener(evtHide, () => {
      teclado.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    });
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [teclado, insets.bottom]);

  const estiloSheet = useAnimatedStyle(() => ({
    transform: [
      { translateY: (1 - progresso.value) * (altura || 600) - teclado.value },
    ],
  }));
  const estiloBackdrop = useAnimatedStyle(() => ({
    opacity: progresso.value * 0.35,
  }));

  if (!aberto) return null;

  async function entrar() {
    const e = email.trim();
    if (!e && !senha) {
      mostrarToast("Informe e-mail e senha.", "erro");
      return;
    }
    if (!e) {
      mostrarToast("Informe o e-mail.", "erro");
      return;
    }
    if (!senha) {
      mostrarToast("Informe a senha.", "erro");
      return;
    }

    Keyboard.dismiss();
    setCarregando(true);
    try {
      const cred = await authApi.login(e, senha);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      await aplicarCredenciais(cred.accessToken, cred.refreshToken);
      const user = useAuth.getState().usuario;
      if (user) {
        useOnboarding.getState().iniciar(user.primeiroNome);
      }
      // O guard do layout leva à Home
    } catch (err) {
      mostrarToast(
        err instanceof ApiError ? err.message : "Não foi possível entrar.",
        "erro"
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Toque fora: só recolhe o teclado — o sheet não fecha */}
      <Animated.View style={[styles.backdrop, estiloBackdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.lg },
          estiloSheet,
        ]}
        onLayout={(e) => setAltura(e.nativeEvent.layout.height)}
      >
        {/* Fundo extra que se estende para baixo */}
        <View style={styles.fundoExtra} />

        <View style={styles.puxador} />
        <Text variant="displayLg">Entrar</Text>

        <View style={styles.campos}>
          <Field
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />
          <Field
            icon="lock-closed-outline"
            placeholder="Senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={!mostrarSenha}
            autoCapitalize="none"
            rightIcon={mostrarSenha ? "eye-off-outline" : "eye-outline"}
            onRightPress={() => setMostrarSenha((v) => !v)}
            onSubmitEditing={entrar}
            returnKeyType="go"
          />
        </View>

        <Pressable
          onPress={() => router.push("/recuperar")}
          hitSlop={8}
          style={styles.esqueci}
        >
          <Text variant="label" color={colors.primary}>
            Esqueceu sua senha?
          </Text>
        </Pressable>

        <Button
          label="Entrar"
          onPress={entrar}
          loading={carregando}
          icon="arrow-forward"
        />

        <View style={styles.criar}>
          <Text variant="body" color={colors.secondary}>
            Não tem conta?{" "}
          </Text>
          <Pressable onPress={() => router.push("/cadastro/dados")} hitSlop={8}>
            <Text variant="label" color={colors.primary}>
              Criar conta
            </Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.lg,
  },
  puxador: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  campos: { gap: spacing.lg },
  esqueci: { alignSelf: "flex-end" },
  criar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  fundoExtra: {
    position: "absolute",
    top: 0,
    bottom: -1000,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    zIndex: -1,
  },
});
