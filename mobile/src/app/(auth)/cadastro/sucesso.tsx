import { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button, FadeInView } from "@/components";
import { useCadastro } from "@/features/auth/cadastro-store";
import { useAuth } from "@/features/auth/store";
import { colors, spacing } from "@/theme";

export default function CadastroSucesso() {
  const insets = useSafeAreaInsets();
  const { credenciais, reset } = useCadastro();
  const aplicarCredenciais = useAuth((s) => s.aplicarCredenciais);
  const [entrando, setEntrando] = useState(false);

  const escala = useSharedValue(0);
  const anel = useSharedValue(0);

  useEffect(() => {
    escala.value = withDelay(150, withSpring(1, { damping: 10, stiffness: 120 }));
    anel.value = withDelay(
      250,
      withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [escala, anel]);

  const estiloSelo = useAnimatedStyle(() => ({
    transform: [{ scale: escala.value }],
  }));
  const estiloAnel = useAnimatedStyle(() => ({
    opacity: 1 - anel.value,
    transform: [{ scale: 1 + anel.value * 0.6 }],
  }));

  async function irParaOFortn() {
    if (!credenciais) return;
    setEntrando(true);
    // Aplica as credenciais → o guard leva para a Home autenticada
    await aplicarCredenciais(credenciais.accessToken, credenciais.refreshToken);
    reset();
  }

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.centro}>
        <View style={styles.selo}>
          <Animated.View style={[styles.anel, estiloAnel]} />
          <Animated.View style={[styles.circulo, estiloSelo]}>
            <Ionicons name="checkmark" size={56} color={colors.onPrimary} />
          </Animated.View>
        </View>

        <FadeInView delay={350}>
          <Text variant="displayLg" center>
            Conta criada com sucesso.
          </Text>
        </FadeInView>
        <FadeInView delay={500}>
          <Text variant="body" color={colors.secondary} center>
            Bem-vindo ao controle total da sua vida financeira.
          </Text>
        </FadeInView>
      </View>

      <FadeInView delay={650}>
        <Button
          label="Ir para o fortn"
          icon="arrow-forward"
          onPress={irParaOFortn}
          loading={entrando}
        />
      </FadeInView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  selo: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  anel: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: colors.primaryContainer,
  },
  circulo: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
});
