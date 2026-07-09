import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { authApi } from "@/features/auth/api";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Recuperação — passo 1/3: e-mail. O backend valida se a conta existe
// ("Usuário não encontrado" se não) e envia o código de 6 dígitos.
export default function Recuperar() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const mostrarToast = useToast((s) => s.mostrar);

  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  const valido = EMAIL_REGEX.test(email.trim());

  async function enviar() {
    setCarregando(true);
    try {
      await authApi.senhaEsquecida(email.trim());
      router.push({
        pathname: "/recuperar-codigo",
        params: { email: email.trim().toLowerCase(), returnTo },
      });
    } catch (e) {
      mostrarToast(
        e instanceof ApiError ? e.message : "Não foi possível enviar.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <StepScreen
      etapa={1}
      total={3}
      titulo="Recuperar senha"
      subtitulo="Enviaremos um código de recuperação para o seu e-mail."
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Enviar código"
          icon="mail-outline"
          onPress={enviar}
          disabled={!valido}
          loading={carregando}
        />
      }
    >
      <Field
        icon="mail-outline"
        placeholder="E-mail da sua conta"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        autoFocus
      />
    </StepScreen>
  );
}
