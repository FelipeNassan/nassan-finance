import { View, StyleSheet, Pressable, ScrollView, Platform, Image } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Card, Skeleton, FadeInView, Button } from "@/components";
import { useResumo } from "@/features/despesas/hooks";
import { useAuth } from "@/features/auth/store";
import { formatarBRL } from "@/utils/format";
import { colors, spacing, radius } from "@/theme";
import { useVisibility } from "@/store/visibility";

export default function Perfil() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading } = useResumo();
  const { isVisible } = useVisibility();
  const usuario = useAuth((s) => s.usuario);
  const sair = useAuth((s) => s.sair);

  const primeiroNome = usuario?.primeiroNome ?? "Você";
  // No modo dev (AUTH_DISABLED) a sessão é o dev-user: não há login pra sair
  const modoDev = usuario?.id === "dev-user";

  return (
    <View style={[styles.flex, { paddingTop: spacing.md }]}>
      {/* Header do modal */}
      <View style={styles.puxador} />
      <View style={[styles.header, { marginTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <Text variant="label">Perfil</Text>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.conteudo,
          { paddingTop: spacing.sm, paddingBottom: Platform.OS === 'android' ? insets.top : spacing.xl, flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
      <FadeInView>
        <View style={styles.avatarBloco}>
          <View style={styles.avatar}>
            {usuario?.avatar ? (
              <Image source={{ uri: usuario.avatar }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Ionicons name="person" size={48} color={colors.primary} />
            )}
          </View>
          <Text variant="displayLg">{primeiroNome}</Text>
          <Button
            label="Editar Perfil"
            variant="ghost"
            icon="pencil"
            style={{ marginTop: spacing.xs, minHeight: 40 }}
            onPress={() => router.push("/editar-perfil")}
          />
        </View>
      </FadeInView>

      {/* Estatísticas */}
      <FadeInView delay={100}>
        <View style={styles.stats}>
          <Card style={styles.statCard}>
            <Text variant="caption" color={colors.secondary} center>
              LANÇAMENTOS
            </Text>
            {isLoading ? (
              <Skeleton width={40} height={28} />
            ) : (
              <Text variant="headline">{data?.lancamentos ?? 0}</Text>
            )}
          </Card>
          <Card style={styles.statCard}>
            <Text variant="caption" color={colors.secondary} center>
              CUSTO DE VIDA
            </Text>
            {isLoading ? (
              <Skeleton width={80} height={28} />
            ) : (
              <Text variant="headline" color={colors.primary}>
                {isVisible ? formatarBRL(data?.mediaMensal ?? 0) : "••••"}
              </Text>
            )}
          </Card>
        </View>
      </FadeInView>

      <View style={{ marginTop: 'auto', gap: spacing.xl, width: '100%' }}>
        <FadeInView delay={160}>
          <Text variant="caption" color={colors.secondary} center style={styles.rodape}>
            fortn · gestão financeira pessoal
          </Text>
        </FadeInView>

        {/* Sair — escondido no modo dev (AUTH_DISABLED), onde não há login */}
        {!modoDev && (
          <FadeInView delay={220}>
            <View>
              <Button
                label="Sair da conta"
                variant="ghost"
                icon="log-out-outline"
                onPress={async () => {
                  await sair();
                  router.replace("/inicio");
                }}
              />
            </View>
          </FadeInView>
        )}
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  conteudo: { paddingHorizontal: spacing.lg, gap: spacing.lg },
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarBloco: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.lg },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(117,90,38,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  stats: { flexDirection: "row", gap: spacing.md },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
  },
  rodape: { marginTop: spacing.xl },
});
