import { useRef } from "react";
import { View, TextInput, Pressable, StyleSheet } from "react-native";
import { Text } from "@/components";
import { colors, fonts, radius, spacing } from "@/theme";

const DIGITOS = 6;

interface Props {
  valor: string;
  onChange: (v: string) => void;
  erro?: boolean;
}

// Seis caixas visuais sobre um único TextInput invisível: foco automático,
// colar código funciona e o iOS sugere o SMS (textContentType oneTimeCode).
export function OtpInput({ valor, onChange, erro }: Props) {
  const inputRef = useRef<TextInput>(null);

  function tratar(texto: string) {
    onChange(texto.replace(/\D/g, "").slice(0, DIGITOS));
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()}>
      <View style={styles.caixas}>
        {Array.from({ length: DIGITOS }).map((_, i) => {
          const digito = valor[i] ?? "";
          const ativa = i === valor.length && valor.length < DIGITOS;
          return (
            <View
              key={i}
              style={[
                styles.caixa,
                ativa && styles.caixaAtiva,
                erro && styles.caixaErro,
              ]}
            >
              <Text variant="headline">{digito}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={inputRef}
        value={valor}
        onChangeText={tratar}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={DIGITOS}
        autoFocus
        style={styles.escondido}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  caixas: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  caixa: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 56,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  caixaAtiva: { borderColor: colors.primary },
  caixaErro: { borderColor: colors.error },
  escondido: {
    position: "absolute",
    opacity: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    fontFamily: fonts.sans,
  },
});
