import { useMemo, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useRouter, useLocalSearchParams, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { authApi } from "@/features/auth/api";
import {
  avaliarSenha,
  senhaValida,
  ROTULOS_REQUISITOS,
} from "@/features/auth/senha";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";
import { colors, radius, spacing } from "@/theme";

// Recuperação — passo 3/3: nova senha. Depois de redefinir, volta para a
// tela de Entrar (sem login automático — decisão de produto).
export default function RecuperarNova() {
  const router = useRouter();
  const { resetToken, returnTo } = useLocalSearchParams<{ resetToken: string; returnTo?: string }>();
  const mostrarToast = useToast((s) => s.mostrar);

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [carregando, setCarregando] = useState(false);

  const requisitos = useMemo(() => avaliarSenha(senha), [senha]);
  const confere = senha.length > 0 && senha === confirmar;
  const pronto = senhaValida(senha) && confere;

  async function redefinir() {
    if (!resetToken) {
      router.replace("/recuperar");
      return;
    }
    setCarregando(true);
    try {
      await authApi.senhaRedefinir(resetToken, senha);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      mostrarToast("Senha redefinida. Entre com a nova senha.", "sucesso");
      if (returnTo) {
        router.replace(returnTo as Href);
      } else {
        // Volta para a tela inicial com o sheet de Entrar já aberto
        router.replace({ pathname: "/inicio", params: { login: "1" } });
      }
    } catch (e) {
      mostrarToast(
        e instanceof ApiError ? e.message : "Não foi possível redefinir.",
        "erro"
      );
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <StepScreen
      etapa={3}
      total={3}
      titulo="Nova senha"
      subtitulo="Crie a nova senha da sua conta."
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Redefinir"
          icon="lock-closed-outline"
          onPress={redefinir}
          disabled={!pronto}
          loading={carregando}
        />
      }
    >
      <Field
        icon="lock-closed-outline"
        placeholder="Nova senha"
        value={senha}
        onChangeText={setSenha}
        secureTextEntry={!mostrar}
        autoCapitalize="none"
        rightIcon={mostrar ? "eye-off-outline" : "eye-outline"}
        onRightPress={() => setMostrar((v) => !v)}
        autoFocus
      />
      <Field
        icon="lock-closed-outline"
        placeholder="Confirmar nova senha"
        value={confirmar}
        onChangeText={setConfirmar}
        secureTextEntry={!mostrar}
        autoCapitalize="none"
        erro={confirmar.length > 0 && !confere}
      />

      <View style={styles.checklist}>
        {ROTULOS_REQUISITOS.map(({ chave, texto }) => {
          const ok = requisitos[chave];
          return (
            <View key={chave} style={styles.item}>
              <Ionicons
                name={ok ? "checkmark-circle" : "ellipse-outline"}
                size={18}
                color={ok ? colors.success : colors.secondary}
              />
              <Text variant="label" color={ok ? colors.success : colors.secondary}>
                {texto}
              </Text>
            </View>
          );
        })}
        <View style={styles.item}>
          <Ionicons
            name={confere ? "checkmark-circle" : "ellipse-outline"}
            size={18}
            color={confere ? colors.success : colors.secondary}
          />
          <Text variant="label" color={confere ? colors.success : colors.secondary}>
            As senhas coincidem
          </Text>
        </View>
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  checklist: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
});
