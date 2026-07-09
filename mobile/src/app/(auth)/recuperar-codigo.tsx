import { useEffect, useState } from "react";
import { View, StyleSheet, Pressable, Platform } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Text, Button } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { OtpInput } from "@/features/auth/OtpInput";
import { authApi } from "@/features/auth/api";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";
import { colors, spacing } from "@/theme";

const REENVIO_SEGUNDOS = 60;

// Recuperação — passo 2/3: código de 6 dígitos do e-mail. "Seguir" só
// funciona com o código correto. Reenviar (60s) invalida o código anterior.
export default function RecuperarCodigo() {
  const router = useRouter();
  const { email, returnTo } = useLocalSearchParams<{ email: string; returnTo?: string }>();
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

  async function seguir(valor: string) {
    if (!email) {
      router.replace("/recuperar");
      return;
    }
    setCarregando(true);
    try {
      const { resetToken } = await authApi.senhaCodigo(email, valor);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.push({ pathname: "/recuperar-nova", params: { resetToken, returnTo } });
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

  async function reenviar() {
    if (!email || segundos > 0) return;
    setReenviando(true);
    try {
      await authApi.senhaEsquecida(email);
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
      etapa={2}
      total={3}
      titulo="Digite o código"
      subtitulo={`Enviamos um código de recuperação para ${email ?? "seu e-mail"}.`}
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Seguir"
          icon="arrow-forward"
          onPress={() => seguir(codigo)}
          disabled={codigo.length !== 6}
          loading={carregando}
        />
      }
    >
      <OtpInput valor={codigo} onChange={setCodigo} />

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
      </View>
    </StepScreen>
  );
}

const styles = StyleSheet.create({
  acoes: { gap: spacing.md, alignItems: "center", marginTop: spacing.md },
});
