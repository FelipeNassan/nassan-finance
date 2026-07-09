import { useMemo, useState } from "react";
import { FlatList, View, StyleSheet, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Text,
  Card,
  Skeleton,
  EmptyState,
  Button,
  FadeInView,
} from "@/components";
import { TransactionRow } from "@/features/despesas/TransactionRow";
import { FiltroSheet } from "@/features/despesas/FiltroSheet";
import {
  aplicarFiltros,
  contarFiltrosAtivos,
  FILTROS_PADRAO,
  ROTULO_ORDENACAO,
  type Filtros,
} from "@/features/despesas/filtros";
import { useDespesas } from "@/features/despesas/hooks";
import { formatarBRL } from "@/utils/format";
import { colors, radius, spacing } from "@/theme";
import { useVisibility } from "@/store/visibility";

export default function Extrato() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useDespesas();

  const [filtros, setFiltros] = useState<Filtros>(FILTROS_PADRAO);
  const [sheetAberto, setSheetAberto] = useState(false);
  const { isVisible } = useVisibility();

  // Opções distintas para o sheet, derivadas do que realmente existe na lista
  const categorias = useMemo(
    () => [...new Set((data ?? []).map((d) => d.categoria))].sort(),
    [data]
  );
  const formasPagamento = useMemo(
    () => [...new Set((data ?? []).map((d) => d.formaPagamento))].sort(),
    [data]
  );

  const lista = useMemo(
    () => aplicarFiltros(data ?? [], filtros),
    [data, filtros]
  );

  const total = lista.reduce((s, d) => s + d.valor, 0);
  const ativos = contarFiltrosAtivos(filtros);
  const temDados = (data?.length ?? 0) > 0;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.iconeBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
        <Text variant="headline">Extrato</Text>
        <Pressable
          onPress={() => setSheetAberto(true)}
          hitSlop={8}
          style={styles.iconeBtn}
          disabled={!temDados}
        >
          <Ionicons
            name="options-outline"
            size={24}
            color={temDados ? colors.primary : colors.border}
          />
          {ativos > 0 && (
            <View style={styles.badge}>
              <Text variant="caption" color={colors.onPrimary}>
                {ativos}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.lista}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={44} style={{ marginBottom: spacing.md }} />
          ))}
        </View>
      ) : (
        <FlatList
          data={lista}
          keyExtractor={(d) => String(d.id)}
          contentContainerStyle={[
            styles.lista,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          ListHeaderComponent={
            temDados ? (
              <FadeInView>
                <Card style={styles.resumo}>
                  <View style={styles.flex1}>
                    <Text variant="caption" color={colors.secondary}>
                      {ativos > 0 ? "TOTAL FILTRADO" : "TOTAL REGISTRADO"}
                    </Text>
                    <Text variant="displayLg">{isVisible ? formatarBRL(total) : "••••"}</Text>
                    <Text variant="caption" color={colors.secondary}>
                      {ROTULO_ORDENACAO[filtros.ordenacao].toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contagem}>
                    <Text variant="caption" color={colors.secondary}>
                      {ativos > 0 ? "RESULTADOS" : "LANÇAMENTOS"}
                    </Text>
                    <Text variant="headline" color={colors.primary}>
                      {lista.length}
                    </Text>
                  </View>
                </Card>
              </FadeInView>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/despesa/[id]",
                  params: { id: item.id },
                })
              }
              style={({ pressed }) => [pressed && styles.itemPressed]}
            >
              <Card style={styles.item} padded={false}>
                <View style={styles.itemPad}>
                  <TransactionRow
                    categoria={item.categoria}
                    descricao={item.descricao}
                    valor={item.valor}
                    data={item.data}
                    isDeleted={item.isDeleted}
                  />
                </View>
              </Card>
            </Pressable>
          )}
          ListEmptyComponent={
            temDados ? (
              // Há despesas, mas nenhuma bate com os filtros
              <EmptyState
                icon="filter-outline"
                titulo="Nenhum resultado"
                descricao="Nenhum lançamento com esses filtros."
                acao={
                  <Button
                    label="Limpar filtros"
                    icon="close"
                    variant="ghost"
                    onPress={() => setFiltros(FILTROS_PADRAO)}
                  />
                }
              />
            ) : (
              <EmptyState
                icon="receipt-outline"
                titulo="Nenhuma despesa"
                descricao="Seus lançamentos aparecerão aqui."
                acao={
                  <Button
                    label="Registrar primeiro"
                    icon="add"
                    onPress={() => router.push("/nova")}
                  />
                }
              />
            )
          }
        />
      )}

      <FiltroSheet
        visivel={sheetAberto}
        filtros={filtros}
        categorias={categorias}
        formasPagamento={formasPagamento}
        onChange={setFiltros}
        onFechar={() => setSheetAberto(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconeBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  lista: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  resumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
  },
  flex1: { flex: 1, gap: 2 },
  contagem: { alignItems: "flex-end" },
  item: { marginBottom: spacing.sm },
  itemPad: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  itemPressed: { opacity: 0.6 },
});
