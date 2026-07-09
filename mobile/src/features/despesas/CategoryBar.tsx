import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "@/components/Text";
import { iconeDaCategoria } from "@/utils/categorias";
import { formatarBRL } from "@/utils/format";
import { colors, radius, spacing } from "@/theme";
import { useVisibility } from "@/store/visibility";

interface Props {
  nome: string;
  valor: number;
  proporcao: number; // 0..1 relativo à maior categoria
  delay?: number;
}

export function CategoryBar({ nome, valor, proporcao, delay = 0 }: Props) {
  const largura = useSharedValue(0);
  const { isVisible } = useVisibility();

  useEffect(() => {
    largura.value = withDelay(
      delay,
      withTiming(proporcao, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [proporcao, delay, largura]);

  const anim = useAnimatedStyle(() => ({
    width: `${largura.value * 100}%`,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.topo}>
        <View style={styles.rotulo}>
          <Ionicons name={iconeDaCategoria(nome)} size={16} color={colors.primary} />
          <Text variant="body">{nome}</Text>
        </View>
        <Text variant="label">{isVisible ? formatarBRL(valor) : "••••"}</Text>
      </View>
      <View style={styles.trilho}>
        <Animated.View style={[styles.preenchimento, anim]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  topo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rotulo: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  trilho: {
    height: 8,
    borderRadius: radius.full,
    backgroundColor: "rgba(117,90,38,0.08)",
    overflow: "hidden",
  },
  preenchimento: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.primaryContainer,
  },
});
