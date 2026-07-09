import { useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { Text, FadeInView } from "@/components";
import { colors, radius, spacing } from "@/theme";

interface Props {
  etapa: number;
  total?: number; // cadastro: 4 etapas; recuperação: 2
  titulo: string;
  subtitulo?: string;
  onVoltar?: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}

// Moldura das telas de fluxo (cadastro, recuperação): voltar, barra de
// progresso animada, título/subtítulo e rodapé fixo para o botão de ação.
export function StepScreen({
  etapa,
  total = 4,
  titulo,
  subtitulo,
  onVoltar,
  children,
  rodape,
}: Props) {
  const insets = useSafeAreaInsets();
  const progresso = useSharedValue(0);

  useEffect(() => {
    progresso.value = withTiming(etapa / total, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [etapa, total, progresso]);

  const estiloBarra = useAnimatedStyle(() => ({
    width: `${progresso.value * 100}%`,
  }));

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.header}>
          <Pressable onPress={onVoltar} hitSlop={8} style={styles.voltar}>
            {onVoltar && (
              <Ionicons name="chevron-back" size={24} color={colors.primary} />
            )}
          </Pressable>
          <View style={styles.trilho}>
            <Animated.View style={[styles.preenchimento, estiloBarra]} />
          </View>
          <View style={styles.voltar}>
            <Text variant="caption" color={colors.secondary}>
              {etapa}/{total}
            </Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.conteudo}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <FadeInView>
            <Text variant="displayLg">{titulo}</Text>
            {subtitulo && (
              <Text variant="body" color={colors.secondary} style={styles.sub}>
                {subtitulo}
              </Text>
            )}
          </FadeInView>
          <View style={styles.corpo}>{children}</View>
        </ScrollView>

        {rodape && (
          <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.lg }]}>
            {rodape}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    height: 48,
  },
  voltar: { width: 40, alignItems: "center", justifyContent: "center" },
  trilho: {
    flex: 1,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(117,90,38,0.1)",
    overflow: "hidden",
  },
  preenchimento: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  conteudo: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  sub: { marginTop: spacing.sm },
  corpo: { marginTop: spacing.xl, gap: spacing.lg },
  rodape: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
