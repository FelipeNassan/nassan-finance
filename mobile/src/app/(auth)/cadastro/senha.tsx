import { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { authApi } from "@/features/auth/api";
import { useCadastro } from "@/features/auth/cadastro-store";
import {
  avaliarSenha,
  senhaValida,
  ROTULOS_REQUISITOS,
} from "@/features/auth/senha";
import { useOnboarding } from "@/store/onboarding";
import { ApiError } from "@/services/http";
import { colors, radius, spacing } from "@/theme";

export default function CadastroSenha() {
  const router = useRouter();
  const { token, setCredenciais } = useCadastro();

  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const requisitos = useMemo(() => avaliarSenha(senha), [senha]);
  const todosOk = senhaValida(senha);
  const confere = senha.length > 0 && senha === confirmar;
  const pronto = todosOk && confere;

  async function cadastrar() {
    if (!token) {
      router.replace("/cadastro/dados");
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      const credenciais = await authApi.cadastroSenha(token, senha);
      setCredenciais(credenciais);
      useOnboarding.getState().iniciar("você");
      router.push("/cadastro/sucesso");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível cadastrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <StepScreen
      etapa={5}
      total={5}
      titulo="Crie sua senha"
      subtitulo="Ela protege todos os seus dados financeiros."
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Cadastrar senha"
          icon="lock-closed-outline"
          onPress={cadastrar}
          disabled={!pronto}
          loading={carregando}
        />
      }
    >
      <Field
        icon="lock-closed-outline"
        placeholder="Senha"
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
        placeholder="Confirmar senha"
        value={confirmar}
        onChangeText={setConfirmar}
        secureTextEntry={!mostrar}
        autoCapitalize="none"
        erro={confirmar.length > 0 && !confere}
      />

      {/* Checklist ao vivo */}
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
              <Text
                variant="label"
                color={ok ? colors.success : colors.secondary}
              >
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
          <Text
            variant="label"
            color={confere ? colors.success : colors.secondary}
          >
            As senhas coincidem
          </Text>
        </View>
      </View>

      {erro && (
        <View style={styles.erro}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text variant="label" color={colors.error} style={styles.flex}>
            {erro}
          </Text>
        </View>
      )}
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  checklist: {
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  item: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  erro: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(186,26,26,0.08)",
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
