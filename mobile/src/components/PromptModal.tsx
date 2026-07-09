import { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./Text";
import { Button } from "./Button";
import { colors, radius, spacing } from "@/theme";

interface Props {
  visivel: boolean;
  titulo: string;
  mensagem?: string;
  placeholder?: string;
  confirmarLabel: string;
  destrutivo?: boolean;
  carregando?: boolean;
  onConfirmar: (texto: string) => void;
  onCancelar: () => void;
}

// Bottom sheet com um campo de texto — coleta uma informação (ex.: motivo da
// exclusão) de forma cross-platform. Confirma só com texto preenchido.
export function PromptModal({
  visivel,
  titulo,
  mensagem,
  placeholder,
  confirmarLabel,
  destrutivo,
  carregando,
  onConfirmar,
  onCancelar,
}: Props) {
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState("");

  // Zera o campo cada vez que o modal reabre
  useEffect(() => {
    if (visivel) setTexto("");
  }, [visivel]);

  const podeConfirmar = texto.trim().length > 0;

  return (
    <Modal
      visible={visivel}
      transparent
      animationType="slide"
      onRequestClose={onCancelar}
    >
      <Pressable style={styles.backdrop} onPress={onCancelar} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
          <View style={styles.puxador} />
          <Text variant="headline">{titulo}</Text>
          {mensagem && (
            <Text variant="body" color={colors.secondary}>
              {mensagem}
            </Text>
          )}

          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder={placeholder}
            placeholderTextColor="rgba(27,28,27,0.3)"
            style={styles.input}
            multiline
            maxLength={255}
            autoFocus
          />

          <View style={styles.acoes}>
            <Button
              label="Cancelar"
              variant="ghost"
              onPress={onCancelar}
            />
            <View style={styles.flex}>
              <Button
                label={confirmarLabel}
                icon={destrutivo ? "trash-outline" : "checkmark"}
                onPress={() => onConfirmar(texto.trim())}
                disabled={!podeConfirmar}
                loading={carregando}
              />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.xs,
  },
  input: {
    fontFamily: "Hanken",
    fontSize: 16,
    color: colors.onSurface,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: "top",
  },
  acoes: { flexDirection: "row", gap: spacing.md, alignItems: "center" },
});
