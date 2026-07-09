import { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Text, Button } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { OtpInput } from "@/features/auth/OtpInput";
import { authApi } from "@/features/auth/api";
import { useCadastro } from "@/features/auth/cadastro-store";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";
import { colors, spacing } from "@/theme";

const REENVIO_SEGUNDOS = 60;

// Etapa 4/5 (confirmação): código de 6 dígitos que chegou no e-mail.
export default function CadastroEmailCodigo() {
  const router = useRouter();
  const { token, email } = useCadastro();
  const mostrarToast = useToast((s) => s.mostrar);

  const [codigo, setCodigo] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [segundos, setSegundos] = useState(REENVIO_SEGUNDOS);
  const [reenviando, setReenviando] = useState(false);

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
    setCarregando(true);
    try {
      await authApi.cadastroEmailVerificar(token, valor);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push("/cadastro/senha");
    } catch (e) {
      mostrarToast(
        e instanceof ApiError ? e.message : "Não foi possível verificar.",
        "erro"
      );
      setCodigo("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setCarregando(false);
    }
  }

  function aoMudar(valor: string) {
    setCodigo(valor);
    if (valor.length === 6 && !carregando) verificar(valor);
  }

  async function reenviar() {
    if (!token || segundos > 0) return;
    setReenviando(true);
    try {
      await authApi.cadastroEmail(token, email);
      setCodigo("");
      setSegundos(REENVIO_SEGUNDOS);
      mostrarToast("Novo código enviado.", "sucesso");
    } catch (e) {
      mostrarToast(
        e instanceof ApiError ? e.message : "Não foi possível reenviar.",
        "erro"
      );
    } finally {
      setReenviando(false);
    }
  }

  return (
    <StepScreen
      etapa={4}
      total={5}
      titulo="Confirme seu e-mail"
      subtitulo={`Digite o código que enviamos para ${email}.`}
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
      <OtpInput valor={codigo} onChange={aoMudar} />

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
            Usar outro e-mail
          </Text>
        </Pressable>
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  acoes: { gap: spacing.md, alignItems: "center", marginTop: spacing.md },
});
