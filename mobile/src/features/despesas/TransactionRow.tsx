import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import { iconeDaCategoria } from "@/utils/categorias";
import { formatarBRL, formatarDataCurta } from "@/utils/format";
import { colors, radius, spacing } from "@/theme";
import { useVisibility } from "@/store/visibility";

interface Props {
  categoria: string;
  descricao: string | null;
  valor: number;
  data: string;
  isDeleted?: boolean;
}

export function TransactionRow({ categoria, descricao, valor, data, isDeleted }: Props) {
  const { isVisible } = useVisibility();
  return (
    <View style={[styles.linha, isDeleted && { opacity: 0.5 }]}>
      <View style={[styles.icone, isDeleted && { backgroundColor: "rgba(0,0,0,0.08)" }]}>
        <Ionicons name={iconeDaCategoria(categoria)} size={20} color={isDeleted ? colors.secondary : colors.primary} />
      </View>
      <View style={styles.meio}>
        <Text variant="body" numberOfLines={1} style={isDeleted ? { textDecorationLine: "line-through" } : {}}>
          {descricao || categoria}
        </Text>
        <Text variant="caption" color={colors.secondary} numberOfLines={1}>
          {categoria.toUpperCase()}
        </Text>
      </View>
      <View style={styles.fim}>
        <Text variant="label" style={isDeleted ? { textDecorationLine: "line-through" } : {}}>{isVisible ? `- ${formatarBRL(valor)}` : "••••"}</Text>
        <Text variant="caption" color={colors.secondary}>
          {formatarDataCurta(data)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  icone: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: "rgba(117,90,38,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  meio: { flex: 1, gap: 2 },
  fim: { alignItems: "flex-end", gap: 2 },
});
