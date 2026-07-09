import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { authApi } from "@/features/auth/api";
import { useCadastro } from "@/features/auth/cadastro-store";
import { useToast } from "@/store/toast";
import { ApiError } from "@/services/http";

// Máscara DD/MM/AAAA enquanto digita
function mascararData(texto: string): string {
  const d = texto.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

// DD/MM/AAAA → YYYY-MM-DD (null se inválida)
function paraIso(mascarada: string): string | null {
  const m = mascarada.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (
    data.getDate() !== Number(dia) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getFullYear() !== Number(ano)
  ) {
    return null;
  }
  return `${ano}-${mes}-${dia}`;
}

function idadeEmAnos(iso: string): number {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const nascimento = new Date(ano, mes - 1, dia);
  return (Date.now() - nascimento.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
}

// Etapa 2/5: data de nascimento (mais de 10 e menos de 100 anos).
// Aqui o backend cria o usuário pendente e devolve o cadastroToken.
export default function CadastroNascimento() {
  const router = useRouter();
  const { nome, sobrenome, setToken } = useCadastro();
  const mostrarToast = useToast((s) => s.mostrar);

  const [nascimento, setNascimento] = useState("");
  const [carregando, setCarregando] = useState(false);

  const preenchido = nascimento.length === 10;

  async function continuar() {
    if (!nome) {
      router.replace("/cadastro/dados");
      return;
    }
    const iso = paraIso(nascimento);
    if (!iso) {
      mostrarToast("Data de nascimento inválida.", "erro");
      return;
    }
    const idade = idadeEmAnos(iso);
    if (idade <= 10) {
      mostrarToast("É preciso ter mais de 10 anos.", "erro");
      return;
    }
    if (idade >= 100) {
      mostrarToast("Data de nascimento inválida.", "erro");
      return;
    }

    setCarregando(true);
    try {
      const { cadastroToken } = await authApi.cadastroDados({
        nome,
        sobrenome,
        nascimento: iso,
      });
      setToken(cadastroToken);
      router.push("/cadastro/telefone");
    } catch (e) {
      mostrarToast(
        e instanceof ApiError ? e.message : "Não foi possível continuar.",
        "erro"
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <StepScreen
      etapa={2}
      total={5}
      titulo="Sua data de nascimento"
      subtitulo="Usamos para proteger sua conta."
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Continuar"
          icon="arrow-forward"
          onPress={continuar}
          disabled={!preenchido}
          loading={carregando}
        />
      }
    >
      <Field
        icon="calendar-outline"
        placeholder="DD/MM/AAAA"
        value={nascimento}
        onChangeText={(t) => setNascimento(mascararData(t))}
        keyboardType="number-pad"
        maxLength={10}
        autoFocus
      />
    </StepScreen>
  );
}
