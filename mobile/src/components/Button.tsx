import {
  Pressable,
  StyleSheet,
  ActivityIndicator,
  View,
  type ViewStyle,
  type StyleProp,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { colors, radius, spacing } from "@/theme";

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "ghost" | "claro" | "outline";
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  style?: StyleProp<ViewStyle>;
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  icon,
  style,
}: Props) {
  const escala = useSharedValue(1);
  const inativo = disabled || loading;

  // Cor do conteúdo: branco no primário, dourado nos demais
  const corConteudo = variant === "primary" ? colors.onPrimary : colors.primary;
  const estiloFundo =
    variant === "primary"
      ? styles.primary
      : variant === "claro"
        ? styles.claro
        : variant === "outline"
          ? styles.outline
          : styles.ghost;

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Animated.View style={[anim, style]}>
      <Pressable
        onPress={onPress}
        disabled={inativo}
        onPressIn={() => {
          escala.value = withTiming(0.97, { duration: 120 });
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }}
        onPressOut={() => {
          escala.value = withTiming(1, { duration: 160 });
        }}
        style={[styles.base, estiloFundo, inativo && styles.inativo]}
      >
        <View style={styles.conteudo}>
          {loading ? (
            <ActivityIndicator color={corConteudo} />
          ) : (
            <>
              {icon && <Ionicons name={icon} size={20} color={corConteudo} />}
              <Text variant="label" color={corConteudo}>
                {label}
              </Text>
            </>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.md,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: {
    backgroundColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 4,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  claro: {
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
  },
  inativo: { opacity: 0.5 },
  conteudo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
