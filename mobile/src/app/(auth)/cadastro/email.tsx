import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { authApi } from "@/features/auth/api";
import { useCadastro } from "@/features/auth/cadastro-store";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Etapa 4/5: e-mail. Enviamos um código de 6 dígitos por e-mail — a
// confirmação é digitá-lo na tela seguinte (sem link).
export default function CadastroEmail() {
  const router = useRouter();
  const { token, setEmail: salvarEmail } = useCadastro();
  const mostrarToast = useToast((s) => s.mostrar);

  const [email, setEmail] = useState("");
  const [carregando, setCarregando] = useState(false);

  const valido = EMAIL_REGEX.test(email.trim());

  async function enviar() {
    if (!token) {
      router.replace("/cadastro/dados");
      return;
    }
    setCarregando(true);
    try {
      await authApi.cadastroEmail(token, email.trim());
      salvarEmail(email.trim().toLowerCase());
      router.push("/cadastro/email-codigo");
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
      etapa={4}
      total={5}
      titulo="Seu e-mail"
      subtitulo="Enviaremos um código de confirmação para ele."
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
        placeholder="E-mail"
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
