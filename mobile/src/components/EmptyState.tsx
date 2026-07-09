import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { colors, spacing } from "@/theme";

interface Props {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
}

export function EmptyState({ icon, titulo, descricao, acao }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.circulo}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text variant="headline" center>
        {titulo}
      </Text>
      {descricao && (
        <Text variant="body" color={colors.secondary} center style={styles.desc}>
          {descricao}
        </Text>
      )}
      {acao && <View style={styles.acao}>{acao}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
  },
  circulo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(117,90,38,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  desc: { maxWidth: 260 },
  acao: { marginTop: spacing.md, alignSelf: "stretch" },
});
