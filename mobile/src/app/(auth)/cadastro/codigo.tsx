import { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Text, Button } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { OtpInput } from "@/features/auth/OtpInput";
import { authApi } from "@/features/auth/api";
import { useCadastro } from "@/features/auth/cadastro-store";
import { ApiError } from "@/services/http";
import { colors, radius, spacing } from "@/theme";

const REENVIO_SEGUNDOS = 60;

export default function CadastroCodigo() {
  const router = useRouter();
  const { token, ddd, numero, devCodigo, setDevCodigo } = useCadastro();

  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(REENVIO_SEGUNDOS);
  const [reenviando, setReenviando] = useState(false);

  // Contador regressivo para liberar o reenvio
  useEffect(() => {
    if (segundos <= 0) return;
    const timer = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [segundos]);

  async function verificar(valor: string) {
    if (!token) {
      router.replace("/cadastro/dados");
      return;
    }
    setErro(null);
    setCarregando(true);
    try {
      await authApi.cadastroTelefoneVerificar(token, valor);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push("/cadastro/email");
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível verificar.");
      setCodigo("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setCarregando(false);
    }
  }

  // Verifica automaticamente ao completar os 6 dígitos
  function aoMudar(valor: string) {
    setCodigo(valor);
    setErro(null);
    if (valor.length === 6 && !carregando) verificar(valor);
  }

  async function reenviar() {
    if (!token || segundos > 0) return;
    setReenviando(true);
    setErro(null);
    try {
      const resp = await authApi.cadastroTelefone(token, ddd, numero);
      setDevCodigo(resp.devCodigo ?? null);
      setCodigo("");
      setSegundos(REENVIO_SEGUNDOS);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível reenviar.");
    } finally {
      setReenviando(false);
    }
  }

  return (
    <StepScreen
      etapa={3}
      total={5}
      titulo="Digite o código"
      subtitulo={`Enviamos um SMS para (${ddd}) ${numero}.`}
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Verificar"
          icon="checkmark"
          onPress={() => verificar(codigo)}
          disabled={codigo.length !== 6}
          loading={carregando}
        />
      }
    >
      <OtpInput valor={codigo} onChange={aoMudar} erro={!!erro} />

      {/* Só em dev: sem provedor de SMS, o código aparece aqui para teste */}
      {devCodigo && (
        <View style={styles.dev}>
          <Ionicons name="flask-outline" size={16} color={colors.secondary} />
          <Text variant="caption" color={colors.secondary}>
            Código de teste: {devCodigo}
          </Text>
        </View>
      )}

      {erro && (
        <View style={styles.erro}>
          <Ionicons name="alert-circle" size={18} color={colors.error} />
          <Text variant="label" color={colors.error} style={styles.flex}>
            {erro}
          </Text>
        </View>
      )}

      <View style={styles.acoes}>
        <Pressable onPress={reenviar} disabled={segundos > 0 || reenviando} hitSlop={8}>
          <Text
            variant="label"
            color={segundos > 0 ? colors.secondary : colors.primary}
          >
            {segundos > 0
              ? `Reenviar código em ${segundos}s`
              : reenviando
                ? "Reenviando..."
                : "Reenviar código"}
          </Text>
        </Pressable>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text variant="label" color={colors.primary}>
            Alterar número
          </Text>
        </Pressable>
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  dev: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    alignSelf: "center",
  },
  erro: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(186,26,26,0.08)",
    padding: spacing.md,
    borderRadius: radius.md,
  },
  acoes: { gap: spacing.md, alignItems: "center", marginTop: spacing.md },
});
