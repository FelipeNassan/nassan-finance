import { useEffect } from "react";
import { StyleSheet, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { radius } from "@/theme";

interface Props {
  width?: number | `${number}%`;
  height?: number;
  style?: ViewStyle;
}

// Placeholder com shimmer suave (opacidade pulsante) durante o carregamento.
export function Skeleton({ width = "100%", height = 20, style }: Props) {
  const opacidade = useSharedValue(0.4);

  useEffect(() => {
    opacidade.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacidade]);

  const anim = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return (
    <Animated.View
      style={[styles.base, { width, height }, anim, style]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "rgba(117,90,38,0.12)",
    borderRadius: radius.sm,
  },
});
