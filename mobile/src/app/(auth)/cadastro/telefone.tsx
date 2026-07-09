import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { authApi } from "@/features/auth/api";
import { useCadastro } from "@/features/auth/cadastro-store";
import { ApiError } from "@/services/http";
import { colors, radius, spacing } from "@/theme";

export default function CadastroTelefone() {
  const router = useRouter();
  const token = useCadastro((s) => s.token);
  const setTelefone = useCadastro((s) => s.setTelefone);
  const setDevCodigo = useCadastro((s) => s.setDevCodigo);

  const [ddd, setDdd] = useState("");
  const [numero, setNumero] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const preenchido = ddd.length === 2 && numero.length >= 8;

  async function enviar() {
    if (!token) {
      router.replace("/cadastro/dados");
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      const resp = await authApi.cadastroTelefone(token, ddd, numero);
      setTelefone(ddd, numero);
      setDevCodigo(resp.devCodigo ?? null);
      router.push("/cadastro/codigo");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível enviar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <StepScreen
      etapa={3}
      total={5}
      titulo="Seu celular"
      subtitulo="Enviaremos um código por SMS para confirmar que é você."
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Enviar código"
          icon="chatbubble-ellipses-outline"
          onPress={enviar}
          disabled={!preenchido}
          loading={carregando}
        />
      }
    >
      <View style={styles.linha}>
        <View style={styles.ddd}>
          <Field
            placeholder="DDD"
            value={ddd}
            onChangeText={(t) => setDdd(t.replace(/\D/g, "").slice(0, 2))}
            keyboardType="number-pad"
            maxLength={2}
            autoFocus
          />
        </View>
        <View style={styles.flex}>
          <Field
            icon="call-outline"
            placeholder="Número"
            value={numero}
            onChangeText={(t) => setNumero(t.replace(/\D/g, "").slice(0, 9))}
            keyboardType="number-pad"
            maxLength={9}
            autoComplete="tel"
          />
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
  linha: { flexDirection: "row", gap: spacing.md },
  ddd: { width: 88 },
  erro: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(186,26,26,0.08)",
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
