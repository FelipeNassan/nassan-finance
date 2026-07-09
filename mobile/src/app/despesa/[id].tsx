import { useState } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card, Button, EmptyState, PromptModal } from "@/components";
import { useDespesas, useApagarDespesa } from "@/features/despesas/hooks";
import { useToast } from "@/store/toast";
import { iconeDaCategoria } from "@/utils/categorias";
import { formatarBRL, formatarDataLonga } from "@/utils/format";
import { colors, radius, spacing } from "@/theme";

export default function DetalheDespesaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useDespesas();
  const apagar = useApagarDespesa();
  const mostrarToast = useToast((s) => s.mostrar);
  const [motivoAberto, setMotivoAberto] = useState(false);
  const [descricaoAberta, setDescricaoAberta] = useState(false);

  const despesa = data?.find((d) => String(d.id) === id);

  // Volta com segurança: se não houver histórico (deep link), vai para o extrato
  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace("/extrato");
  }

  async function onConfirmarExclusao(motivo: string) {
    try {
      await apagar.mutateAsync({ id: Number(id), motivo });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setMotivoAberto(false);
      mostrarToast("Lançamento apagado", "sucesso");
      voltar();
    } catch {
      setMotivoAberto(false);
      mostrarToast("Falha ao apagar", "erro");
    }
  }

  return (
    <View style={[styles.container, { paddingTop: spacing.md }]}>
      {/* Header do modal */}
      <View style={styles.puxador} />
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <Pressable onPress={voltar} hitSlop={8} style={styles.fechar}>
          <Ionicons name="close" size={24} color={colors.onSurface} />
        </Pressable>
        <Text variant="label">Detalhes</Text>
        <View style={styles.fechar} />
      </View>

      {!despesa ? (
        isLoading ? (
          <View style={styles.carregando}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <EmptyState
            icon="help-circle-outline"
            titulo="Lançamento não encontrado"
            descricao="Ele pode ter sido apagado."
          />
        )
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.conteudo,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Destaque: ícone + valor */}
          <View style={styles.destaque}>
            <View style={styles.iconeGrande}>
              <Ionicons
                name={iconeDaCategoria(despesa.categoria)}
                size={30}
                color={colors.primary}
              />
            </View>
            <Text variant="displayLg">- {formatarBRL(despesa.valor)}</Text>
            <Text variant="body" color={colors.secondary}>
              {despesa.descricao || despesa.categoria}
            </Text>
          </View>

          {/* Informações */}
          <Card style={styles.infos} padded={false}>
            <InfoRow
              icon="calendar-outline"
              rotulo="Data"
              valor={formatarDataLonga(despesa.data)}
            />
            <Divisor />
            <InfoRow
              icon={iconeDaCategoria(despesa.categoria)}
              rotulo="Categoria"
              valor={despesa.categoria}
            />
            <Divisor />
            <InfoRow
              icon="card-outline"
              rotulo="Forma de pagamento"
              valor={despesa.formaPagamento}
            />
            {despesa.banco && (
              <>
                <Divisor />
                <InfoRow
                  icon="business-outline"
                  rotulo="Banco"
                  valor={despesa.banco}
                />
              </>
            )}
            {despesa.descricao && (
              <>
                <Divisor />
                <Pressable onPress={() => setDescricaoAberta(true)}>
                  <InfoRow
                    icon="document-text-outline"
                    rotulo="Observação"
                    valor={despesa.descricao}
                    numberOfLines={1}
                  />
                </Pressable>
              </>
            )}
          </Card>

          {/* Ações */}
          <View style={styles.acoes}>
            <Button
              label="Editar"
              icon="create-outline"
              onPress={() =>
                router.push({
                  pathname: "/editar/[id]",
                  params: { id: despesa.id },
                })
              }
            />
            <Pressable
              onPress={() => setMotivoAberto(true)}
              disabled={apagar.isPending}
              style={styles.apagar}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text variant="label" color={colors.error}>
                Apagar lançamento
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Popup da descrição */}
      <Modal
        visible={descricaoAberta}
        transparent
        animationType="fade"
        onRequestClose={() => setDescricaoAberta(false)}
      >
        <Pressable 
          style={styles.modalBackdrop} 
          onPress={() => setDescricaoAberta(false)} 
        />
        <View style={styles.modalCenter} pointerEvents="box-none">
          <Card style={styles.modalCard}>
            <Text variant="headline" style={{ marginBottom: spacing.sm }}>
              Observação
            </Text>
            <ScrollView style={{ maxHeight: 250 }} showsVerticalScrollIndicator={false}>
              <Text variant="body" color={colors.secondary}>
                {despesa?.descricao}
              </Text>
            </ScrollView>
            <Button 
              label="Fechar" 
              onPress={() => setDescricaoAberta(false)} 
              variant="ghost" 
              style={{ marginTop: spacing.md }}
            />
          </Card>
        </View>
      </Modal>

      <PromptModal
        visivel={motivoAberto}
        titulo="Apagar lançamento"
        mensagem="Por que está apagando? O motivo fica registrado."
        placeholder="Ex.: lançamento duplicado, valor errado..."
        confirmarLabel="Apagar"
        destrutivo
        carregando={apagar.isPending}
        onConfirmar={onConfirmarExclusao}
        onCancelar={() => setMotivoAberto(false)}
      />
    </View>
  );
}

function InfoRow({
  icon,
  rotulo,
  valor,
  numberOfLines,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  rotulo: string;
  valor: string;
  numberOfLines?: number;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcone}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.infoTexto}>
        <Text variant="caption" color={colors.secondary}>
          {rotulo.toUpperCase()}
        </Text>
        <Text variant="body" style={{ textTransform: "capitalize" }} numberOfLines={numberOfLines}>
          {valor}
        </Text>
      </View>
    </View>
  );
}

function Divisor() {
  return <View style={styles.divisor} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  carregando: { flex: 1, alignItems: "center", justifyContent: "center" },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  fechar: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  conteudo: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  destaque: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.md },
  iconeGrande: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(117,90,38,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  infos: { paddingHorizontal: spacing.lg },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  infoIcone: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: "rgba(117,90,38,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoTexto: { flex: 1, gap: 2 },
  divisor: { height: 1, backgroundColor: colors.border },
  acoes: { gap: spacing.md },
  apagar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(186,26,26,0.2)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalCard: {
    width: "100%",
    padding: spacing.lg,
  },
});
