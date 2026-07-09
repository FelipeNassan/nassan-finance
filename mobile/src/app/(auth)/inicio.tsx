import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";
import { Text, Button } from "@/components";
import { BrandBackdrop } from "@/features/auth/BrandBackdrop";
import { LoginSheet } from "@/features/auth/LoginSheet";
import { colors, spacing } from "@/theme";

// Tela inicial: identidade fortn + slogan + "Começar". O botão não navega —
// abre o bottom sheet de login por cima do fundo. Uma vez aberto, não volta.
// ?login=1 abre o sheet direto (usado ao voltar da redefinição de senha).
export default function Inicio() {
  const insets = useSafeAreaInsets();
  const { login } = useLocalSearchParams<{ login?: string }>();
  const [loginAberto, setLoginAberto] = useState(login === "1");

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <BrandBackdrop />

      <View
        style={[
          styles.conteudo,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Text variant="headline" color={colors.onPrimary} style={styles.marca}>
          fortn
        </Text>

        <View style={styles.rodape}>
          <Text variant="displayXl" color={colors.onPrimary} style={styles.slogan}>
            Tenha total controle da sua vida financeira.
          </Text>

          <View style={styles.acao}>
            <Button
              label="Começar"
              variant="claro"
              icon="arrow-forward"
              onPress={() => setLoginAberto(true)}
            />
          </View>
        </View>
      </View>

      <LoginSheet aberto={loginAberto} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  conteudo: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "space-between",
  },
  marca: { fontSize: 22, letterSpacing: 0.5 },
  rodape: { gap: spacing.xl },
  slogan: { lineHeight: 46 },
  acao: { marginTop: spacing.sm },
});
