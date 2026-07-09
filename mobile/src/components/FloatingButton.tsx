import { Pressable, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing } from "@/theme";

interface Props {
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
}

// FAB dourado — âncora da ação principal (novo lançamento).
export function FloatingButton({ onPress, icon = "add" }: Props) {
  const insets = useSafeAreaInsets();
  const escala = useSharedValue(1);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));

  return (
    <Animated.View
      style={[styles.wrapper, { bottom: insets.bottom + spacing.lg }, anim]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          escala.value = withSpring(0.9, { damping: 12 });
          if (Platform.OS !== "web") {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
        }}
        onPressOut={() => {
          escala.value = withSpring(1, { damping: 10 });
        }}
        style={styles.botao}
      >
        <Ionicons name={icon} size={30} color={colors.onPrimary} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: spacing.lg,
  },
  botao: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
});
