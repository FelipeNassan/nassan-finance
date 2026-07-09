import { useEffect } from "react";
import { StyleSheet, View, type ViewStyle, type DimensionValue } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { useVisibility } from "@/store/visibility";
import { radius } from "@/theme";

interface Props {
  children: React.ReactNode;
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

/**
 * Envolve qualquer conteudo e, quando a visibilidade esta desligada,
 * sobrep uma overlay com shimmer animado (identico ao Skeleton) ocultando o valor.
 */
export function HiddenValue({ children, width = "100%", height, style }: Props) {
  const { isVisible } = useVisibility();
  const opacidade = useSharedValue(0.45);

  useEffect(() => {
    if (!isVisible) {
      opacidade.value = withRepeat(
        withSequence(
          withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      opacidade.value = withTiming(0, { duration: 200 });
    }
  }, [isVisible, opacidade]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacidade.value,
  }));

  return (
    <View style={[styles.wrapper, style]}>
      {children}
      {!isVisible && (
        <Animated.View
          style={[
            styles.overlay,
            { width: width as DimensionValue, height: height ?? "100%" },
            animStyle,
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    borderRadius: radius.sm,
    backgroundColor: "rgba(117,90,38,0.18)",
  },
});
