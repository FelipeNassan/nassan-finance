import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { useToast } from "@/store/toast";
import { colors, radius, spacing } from "@/theme";

const DURACAO_MS = 3000;

// Toast global no topo — 3s de vida com barrinha de tempo restante.
export function Toast() {
  const insets = useSafeAreaInsets();
  const { mensagem, tipo, esconder } = useToast();
  const y = useSharedValue(-120);
  const vida = useSharedValue(1);

  useEffect(() => {
    if (mensagem) {
      vida.value = 1;
      y.value = withSequence(
        withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) }),
        withDelay(
          DURACAO_MS,
          withTiming(-120, { duration: 250 }, (fim) => {
            if (fim) runOnJS(esconder)();
          })
        )
      );
      // Barrinha de vida: esvazia durante a exibição
      vida.value = withDelay(
        300,
        withTiming(0, { duration: DURACAO_MS, easing: Easing.linear })
      );
    }
  }, [mensagem, esconder, y, vida]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  const animVida = useAnimatedStyle(() => ({
    width: `${vida.value * 100}%`,
  }));

  if (!mensagem) return null;

  const sucesso = tipo === "sucesso";
  const cor = sucesso ? colors.success : colors.error;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrapper, { top: insets.top + spacing.sm }, anim]}
    >
      <View style={styles.toast}>
        <View style={styles.linha}>
          <Ionicons
            name={sucesso ? "checkmark-circle" : "alert-circle"}
            size={20}
            color={cor}
          />
          <Text variant="label" color={colors.onSurface} style={styles.texto}>
            {mensagem}
          </Text>
        </View>
        <View style={styles.trilho}>
          <Animated.View style={[styles.vida, { backgroundColor: cor }, animVida]} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    zIndex: 100,
    alignItems: "center",
  },
  toast: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 6,
    maxWidth: 400,
    minWidth: 220,
    overflow: "hidden",
  },
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  texto: { flexShrink: 1 },
  trilho: { height: 3, backgroundColor: "rgba(0,0,0,0.05)" },
  vida: { height: "100%" },
});
