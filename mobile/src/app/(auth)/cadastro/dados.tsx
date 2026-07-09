import { useState } from "react";
import { useRouter } from "expo-router";
import { Button, Field } from "@/components";
import { StepScreen } from "@/features/auth/StepScreen";
import { useCadastro } from "@/features/auth/cadastro-store";

// Etapa 1/5: só nome e sobrenome — o backend é chamado na etapa do nascimento.
export default function CadastroDados() {
  const router = useRouter();
  const setNomeSobrenome = useCadastro((s) => s.setNomeSobrenome);

  const [nome, setNome] = useState("");
  const [sobrenome, setSobrenome] = useState("");

  const preenchido = nome.trim().length > 1 && sobrenome.trim().length > 1;

  function continuar() {
    setNomeSobrenome(nome.trim(), sobrenome.trim());
    router.push("/cadastro/nascimento");
  }

  return (
    <StepScreen
      etapa={1}
      total={5}
      titulo="Quem é você?"
      subtitulo="Como devemos te chamar no fortn."
      onVoltar={() => router.back()}
      rodape={
        <Button
          label="Continuar"
          icon="arrow-forward"
          onPress={continuar}
          disabled={!preenchido}
        />
      }
    >
      <Field
        icon="person-outline"
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        autoComplete="given-name"
        autoFocus
      />
      <Field
        icon="person-outline"
        placeholder="Sobrenome"
        value={sobrenome}
        onChangeText={setSobrenome}
        autoComplete="family-name"
      />
    </StepScreen>
  );
}
