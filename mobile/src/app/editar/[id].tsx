import { View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { DespesaForm } from "@/features/despesas/DespesaForm";
import { useDespesas, useAtualizarDespesa } from "@/features/despesas/hooks";
import { useToast } from "@/store/toast";
import type { NovaDespesa } from "@/types";
import { colors } from "@/theme";

export default function EditarDespesaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data } = useDespesas();
  const atualizar = useAtualizarDespesa();
  const mostrarToast = useToast((s) => s.mostrar);

  const despesa = data?.find((d) => String(d.id) === id);

  // Lista ainda carregando ou item inexistente: evita renderizar o form vazio
  if (!despesa) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  async function salvar(dados: NovaDespesa) {
    await atualizar.mutateAsync({ id: Number(id), dados });
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    mostrarToast("Lançamento atualizado", "sucesso");
    router.back();
  }

  return (
    <DespesaForm
      titulo="Editar Lançamento"
      submitLabel="Salvar alterações"
      submitting={atualizar.isPending}
      inicial={{
        valor: despesa.valor.toFixed(2).replace(".", ","),
        categoriaId: despesa.categoriaId,
        formaPagamentoId: despesa.formaPagamentoId,
        bancoId: despesa.bancoId,
        descricao: despesa.descricao ?? "",
        data: despesa.data,
      }}
      onSubmit={salvar}
      onClose={() => router.back()}
    />
  );
}
