import { useEffect } from "react";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import type { ViewStyle } from "react-native";

interface Props {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle;
}

// Entrada com fade + leve deslize para cima. Use delay crescente para cascata.
export function FadeInView({ children, delay = 0, style }: Props) {
  const progresso = useSharedValue(0);

  useEffect(() => {
    progresso.value = withDelay(
      delay,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, [delay, progresso]);

  const anim = useAnimatedStyle(() => ({
    opacity: progresso.value,
    transform: [{ translateY: (1 - progresso.value) * 12 }],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
