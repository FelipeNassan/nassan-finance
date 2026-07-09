import { Text as RNText, type TextProps, StyleSheet } from "react-native";
import { colors, type as typeScale } from "@/theme";

type Variante = keyof typeof typeScale;

interface Props extends TextProps {
  variant?: Variante;
  color?: string;
  center?: boolean;
}

export function Text({
  variant = "body",
  color = colors.onSurface,
  center,
  style,
  ...rest
}: Props) {
  return (
    <RNText
      style={[typeScale[variant], { color }, center && styles.center, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
});
