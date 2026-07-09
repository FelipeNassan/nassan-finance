import { forwardRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  type TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts, spacing } from "@/theme";

interface Props extends TextInputProps {
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  rightIcon?: React.ComponentProps<typeof Ionicons>["name"];
  onRightPress?: () => void;
  erro?: boolean;
}

// Campo de texto com sublinhado, ícone à esquerda e ação opcional à direita
// (ex.: olho de mostrar/ocultar senha). Base dos formulários de auth.
export const Field = forwardRef<TextInput, Props>(function Field(
  { icon, rightIcon, onRightPress, erro, style, ...rest },
  ref
) {
  return (
    <View style={[styles.container, erro && styles.erro]}>
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={colors.secondary}
          style={styles.iconeEsq}
        />
      )}
      <TextInput
        ref={ref}
        placeholderTextColor="rgba(27,28,27,0.35)"
        style={[styles.input, style]}
        {...rest}
      />
      {rightIcon && (
        <Pressable onPress={onRightPress} hitSlop={12} style={styles.iconeDir}>
          <Ionicons name={rightIcon} size={20} color={colors.secondary} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1.5,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  erro: { borderBottomColor: colors.error },
  iconeEsq: { marginLeft: spacing.xs },
  input: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
    color: colors.onSurface,
    paddingVertical: spacing.xs,
  },
  iconeDir: { padding: spacing.xs },
});
