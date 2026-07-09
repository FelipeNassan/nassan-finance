import { useEffect } from "react";
import type { ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";

interface Props {
  children: React.ReactNode;
  /** Dispara a entrada quando vira true (permite gatilho externo, ex.: reveal do onboarding) */
  play?: boolean;
  delay?: number;
  style?: ViewStyle;
}

// Entrada premium: fade + slide up (24px) + leve scale (98%→100%).
// Roda na UI thread (Reanimated). Use `delay` crescente para efeito stagger.
export function Reveal({ children, play = true, delay = 0, style }: Props) {
  const p = useSharedValue(0);

  useEffect(() => {
    if (play) {
      p.value = withDelay(
        delay,
        withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) })
      );
    } else {
      p.value = 0;
    }
  }, [play, delay, p]);

  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [
      { translateY: (1 - p.value) * 24 },
      { scale: 0.98 + p.value * 0.02 },
    ],
  }));

  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}
