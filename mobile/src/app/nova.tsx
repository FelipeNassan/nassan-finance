import { useRouter } from "expo-router";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { DespesaForm } from "@/features/despesas/DespesaForm";
import { useCriarDespesa } from "@/features/despesas/hooks";
import { useToast } from "@/store/toast";
import type { NovaDespesa } from "@/types";

export default function NovaDespesaScreen() {
  const router = useRouter();
  const criar = useCriarDespesa();
  const mostrarToast = useToast((s) => s.mostrar);

  async function salvar(dados: NovaDespesa) {
    await criar.mutateAsync(dados);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    mostrarToast("Lançamento salvo", "sucesso");
    router.back();
  }

  return (
    <DespesaForm
      titulo="Novo Lançamento"
      submitLabel="Salvar Lançamento"
      submitting={criar.isPending}
      onSubmit={salvar}
      onClose={() => router.back()}
    />
  );
}
