import { View, StyleSheet, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme";

interface Props {
  children: React.ReactNode;
  /** Aplica padding-top do safe area (telas sem header próprio) */
  topInset?: boolean;
  style?: ViewStyle;
}

// Container base de tela: fundo do app + safe area horizontal e inferior sempre;
// superior opcional para telas que têm header customizado.
export function Screen({ children, topInset = true, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: topInset ? insets.top : 0,
          paddingLeft: insets.left,
          paddingRight: insets.right,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
