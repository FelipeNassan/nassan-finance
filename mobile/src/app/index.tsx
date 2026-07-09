import { useState, useEffect, useRef } from "react";
import { ScrollView, View, StyleSheet, Pressable, RefreshControl, Modal, Platform, Animated, Dimensions, Image } from "react-native";
import { BlurView } from "expo-blur";
import { PieChartPremium, PieChartData } from "@/components/PieChartPremium";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  Card,
  Text,
  AnimatedNumber,
  FadeInView,
  Skeleton,
  FloatingButton,
  CardBlob,
  OnboardingLoader,
} from "@/components";
import { CategoryBar } from "@/features/despesas/CategoryBar";
import { TransactionRow } from "@/features/despesas/TransactionRow";
import { useResumo } from "@/features/despesas/hooks";
import { useAuth } from "@/features/auth/store";
import { mesAtualPorExtenso, capitalizar } from "@/utils/format";
import { colors, spacing } from "@/theme";
import { useVisibility } from "@/store/visibility";
import { introJaFoiExibida, marcarIntroExibida } from "@/store/intro";
import { useOnboarding } from "@/store/onboarding";

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data, isLoading, isRefetching, refetch } = useResumo();
  const usuario = useAuth((s) => s.usuario);

  const fullText = `Olá, ${capitalizar(usuario?.primeiroNome ?? "você")}!`;

  const onboardingAtivo = useOnboarding((s) => s.ativo);
  const onboardingNome = useOnboarding((s) => s.nome);
  const concluirOnboarding = useOnboarding((s) => s.concluir);

  const [isIntroFinished, setIsIntroFinished] = useState(!onboardingAtivo);
  const [showOnboarding, setShowOnboarding] = useState(onboardingAtivo);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [modalPagamentos, setModalPagamentos] = useState(false);
  const [modalSemanas, setModalSemanas] = useState(false);
  const scaleAnim = useState(new Animated.Value(0.8))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  const abrirModal = (tipo: 'categorias' | 'pagamentos' | 'semanas') => {
    if (tipo === 'categorias') setModalCategorias(true);
    else if (tipo === 'pagamentos') setModalPagamentos(true);
    else setModalSemanas(true);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const fecharModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalCategorias(false);
      setModalPagamentos(false);
      setModalSemanas(false);
    });
  };

  const screenWidth = Dimensions.get("window").width;
  const pieColors = [colors.primary, colors.secondary, "#C9A77C", "#5C4A3D", "#A38059", "#D2B48C", "#8B4513"];

  const totalPagamentos = data?.porPagamento?.reduce((acc, curr) => acc + curr.valor, 0) || 1;
  const pieData: PieChartData[] = data?.porPagamento?.map((p, i) => ({
    key: p.nome,
    label: p.nome,
    value: p.valor,
    color: pieColors[i % pieColors.length],
  })) ?? [];

  // Declarado aqui (antes dos efeitos que o usam) para evitar TDZ
  const showLoading = isLoading || !isIntroFinished;

  const scrollViewRef = useRef<ScrollView>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-scroll a cada 4.5 segundos
  useEffect(() => {
    if (!isIntroFinished || showLoading) return;
    const slides = (data?.porPagamento?.length ?? 0) > 0 ? 2 : 1;
    if (slides < 2) return;

    const interval = setInterval(() => {
      const nextIndex = (currentSlideIndex + 1) % slides;
      setCurrentSlideIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * (screenWidth - spacing.lg * 2 + spacing.md),
        animated: true,
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [currentSlideIndex, isIntroFinished, showLoading, data?.porPagamento?.length, screenWidth]);

  useEffect(() => {
    if (onboardingAtivo) {
      setIsIntroFinished(false);
      setShowOnboarding(true);
    }
  }, [onboardingAtivo]);

  const handleOnboardingComplete = () => {
    setIsIntroFinished(true);
    // Remove component a bit later to allow exit animation to finish
    setTimeout(() => {
      setShowOnboarding(false);
      concluirOnboarding();
    }, 600);
  };

  const maiorCategoria = data?.porCategoria[0]?.valor ?? 0;
  const { isVisible, toggleVisibility } = useVisibility();

  // Cálculo da Previsão do Mês (Taxa Diária)
  const hoje = new Date();
  const totalDiasMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
  const diasDecorridos = hoje.getDate();
  const taxaDiaria = diasDecorridos > 0 ? (data?.totalMes ?? 0) / diasDecorridos : 0;
  const previsaoMes = taxaDiaria * totalDiasMes;

  return (
    <Screen>
      {showOnboarding && (
        <OnboardingLoader
          userName={capitalizar(usuario?.primeiroNome ?? "você")}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Header */}
      {isIntroFinished && (
        <FadeInView delay={0}>
          <View style={styles.header}>
            <Text variant="headline" color={colors.primary}>
              {fullText}
            </Text>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => router.push("/cartoes")}
                hitSlop={8}
                style={styles.iconBtn}
              >
                <Ionicons name="card-outline" size={24} color={colors.primary} />
              </Pressable>
              <Pressable onPress={toggleVisibility} hitSlop={8} style={styles.iconBtn}>
                <Ionicons name={isVisible ? "eye-outline" : "eye-off-outline"} size={24} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={() => router.push("/perfil")}
                style={styles.avatar}
                hitSlop={8}
              >
                {usuario?.avatar ? (
                  <Image source={{ uri: usuario.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                ) : (
                  <Ionicons name="person" size={20} color={colors.primary} />
                )}
              </Pressable>
            </View>
          </View>
        </FadeInView>
      )}

      {isIntroFinished && (
        <ScrollView
          contentContainerStyle={[
            styles.conteudo,
            { paddingBottom: insets.bottom + 100 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
        >
          {/* Card principal: total do mês */}
          <FadeInView delay={1000}>
          <Pressable onPress={() => abrirModal('semanas')}>
            <Card style={styles.hero}>
              <CardBlob />
              <Text variant="caption" color={colors.secondary}>
              GASTOS DE {mesAtualPorExtenso().toUpperCase()}
            </Text>
            {showLoading ? (
              <Skeleton width={200} height={44} style={{ marginTop: spacing.sm }} />
            ) : (
              <AnimatedNumber value={data?.totalMes ?? 0} variant="displayXl" />
            )}

            <View style={styles.heroStats}>
              <View style={styles.stat}>
                <Text variant="caption" color={colors.secondary}>
                  PREVISÃO DO MÊS
                </Text>
                {showLoading ? (
                  <Skeleton width={80} height={20} />
                ) : (
                  <AnimatedNumber
                    value={previsaoMes}
                    variant="bodyLg"
                  />
                )}
              </View>
              <View style={styles.stat}>
                <Text variant="caption" color={colors.secondary}>
                  LANÇAMENTOS
                </Text>
                {showLoading ? (
                  <Skeleton width={40} height={20} />
                ) : (
                  <AnimatedNumber
                    value={data?.lancamentos ?? 0}
                    moeda={false}
                    variant="bodyLg"
                    color={colors.primary}
                  />
                )}
              </View>
            </View>
          </Card>
          </Pressable>
          </FadeInView>

          {/* Carrossel de Categoria e Pagamento */}
          {!showLoading && (data?.porCategoria.length ?? 0) > 0 && (
            <FadeInView delay={1100}>
              <ScrollView 
                ref={scrollViewRef}
                horizontal 
                pagingEnabled 
                showsHorizontalScrollIndicator={false}
                snapToInterval={screenWidth - spacing.lg * 2 + spacing.md}
                decelerationRate="fast"
                contentContainerStyle={{ gap: spacing.md, alignItems: "flex-start" }}
                onMomentumScrollEnd={(e) => {
                  const x = e.nativeEvent.contentOffset.x;
                  const slideWidth = screenWidth - spacing.lg * 2 + spacing.md;
                  setCurrentSlideIndex(Math.round(x / slideWidth));
                }}
              >
                {/* Card Categoria */}
                <Card style={[styles.bloco, { width: screenWidth - spacing.lg * 2, paddingBottom: spacing.md }]}>
                  <Pressable onPress={() => abrirModal('categorias')} style={{ gap: spacing.md }}>
                    <Text variant="headline">Categoria</Text>
                    <View style={styles.categorias}>
                      {data!.porCategoria.slice(0, 3).map((c, i) => (
                        <CategoryBar
                          key={c.categoriaId}
                          nome={c.nome}
                          valor={c.valor}
                          proporcao={maiorCategoria > 0 ? c.valor / maiorCategoria : 0}
                          delay={i * 90}
                        />
                      ))}
                      {data!.porCategoria.length > 3 && (
                        <View style={{ alignItems: "center" }}>
                          <View style={styles.puxador} />
                        </View>
                      )}
                    </View>
                  </Pressable>
                </Card>

                {/* Card Pagamento */}
                {data!.porPagamento?.length > 0 && (
                  <Card style={[styles.bloco, { width: screenWidth - spacing.lg * 2, paddingBottom: spacing.md }]}>
                    <Pressable onPress={() => abrirModal('pagamentos')} style={{ gap: spacing.md, alignItems: "center" }}>
                      <Text variant="headline" style={{ alignSelf: "flex-start" }}>Forma de pagamento</Text>
                      <View style={{ alignItems: "center", pointerEvents: "none" }}>
                        <PieChartPremium
                          data={pieData}
                          width={screenWidth - spacing.lg * 4}
                          height={180}
                        />
                      </View>
                    </Pressable>
                  </Card>
                )}
              </ScrollView>
            </FadeInView>
          )}

          {/* Extrato recente */}
          {!showLoading && (
            <FadeInView delay={1200}>
              <Card style={styles.bloco}>
                <View style={styles.blocoHeader}>
                  <Text variant="headline">Extrato</Text>
                  <Pressable onPress={() => router.push("/extrato")} hitSlop={8}>
                    <Text variant="label" color={colors.primary}>
                      Ver tudo
                    </Text>
                  </Pressable>
                </View>
              </Card>
            </FadeInView>
          )}
        </ScrollView>
      )}

      {!showLoading && isIntroFinished && (
        <FadeInView delay={1300}>
          <FloatingButton onPress={() => router.push("/nova")} />
        </FadeInView>
      )}

      <Modal
        visible={modalCategorias || modalPagamentos || modalSemanas}
        transparent
        animationType="none"
        onRequestClose={fecharModal}
      >
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacityAnim }]}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={fecharModal} />
          </BlurView>
        </Animated.View>

        <View style={styles.modalCenteredView}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text variant="title">
                {modalCategorias ? "Todas as Categorias" : modalPagamentos ? "Formas de Pagamento" : "Estudo de Gastos"}
              </Text>
              <Pressable onPress={fecharModal} hitSlop={12}>
                <Ionicons name="close" size={24} color={colors.secondary} />
              </Pressable>
            </View>
            <ScrollView
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
            >
              {modalCategorias && data?.porCategoria.map((c, i) => (
                <CategoryBar
                  key={c.categoriaId}
                  nome={c.nome}
                  valor={c.valor}
                  proporcao={maiorCategoria > 0 ? c.valor / maiorCategoria : 0}
                  delay={i * 50}
                />
              ))}

              {modalPagamentos && (
                <View style={{ gap: spacing.xl }}>
                  <View style={{ alignItems: "center" }}>
                    <PieChartPremium
                      data={pieData}
                      width={screenWidth - spacing.lg * 4}
                      height={180}
                    />
                  </View>
                  <View style={{ gap: spacing.md }}>
                    {pieData.map((p, i) => (
                      <View key={p.key} style={styles.pagamentoRow}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                          <View style={[styles.corPagamento, { backgroundColor: p.color }]} />
                          <Text variant="body" color={colors.secondary}>
                            {p.label} ({Math.round((p.value / totalPagamentos) * 100)}%)
                          </Text>
                        </View>
                        <View style={styles.pontilhado} />
                        <AnimatedNumber value={p.value} variant="body" color={colors.onSurface} />
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {modalSemanas && data?.porSemana?.map((s, i) => (
                <View key={s.nome} style={styles.semanaRow}>
                  <View style={{ gap: 2 }}>
                    <Text variant="body" color={colors.secondary} style={{ fontSize: 13 }}>
                      {s.nome}
                    </Text>
                    <Text variant="caption" color={colors.secondary} style={{ fontSize: 11, opacity: 0.7 }}>
                      {s.periodo}
                    </Text>
                  </View>

                  <View style={styles.pontilhado} />

                  <View style={{ alignItems: "flex-end" }}>
                    <AnimatedNumber value={s.valor} variant="body" color={colors.onSurface} />
                    
                    {s.percentDiff !== null && s.valor > 0 && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                        <Ionicons 
                          name={s.percentDiff > 0 ? "arrow-up" : "arrow-down"} 
                          size={12} 
                          color={s.percentDiff > 0 ? colors.error : colors.success} 
                        />
                        <Text variant="caption" color={s.percentDiff > 0 ? colors.error : colors.success} style={{ fontSize: 11 }}>
                          {Math.abs(s.percentDiff).toFixed(2)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
              
              {modalSemanas && (
                <>
                  <View style={{ height: 1, backgroundColor: colors.border, marginVertical: spacing.sm }} />
                  <View style={styles.semanaRow}>
                    <Text variant="body" color={"#A38059"} style={{ fontSize: 13, fontWeight: "600" }}>
                      Previsão Mensal
                    </Text>
                    <View style={styles.pontilhado} />
                    <AnimatedNumber value={previsaoMes} variant="body" color={"#A38059"} />
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
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
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  iconBtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(117,90,38,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  conteudo: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  hero: { gap: spacing.xs, overflow: "hidden" },
  heroStats: {
    flexDirection: "row",
    gap: spacing.xxl,
    marginTop: spacing.xl,
  },
  stat: { gap: spacing.xs },
  bloco: { gap: spacing.md },
  blocoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categorias: { gap: spacing.md },
  recentes: { gap: spacing.xs },
  modalCenteredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxHeight: "80%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: spacing.lg,
    paddingBottom: spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalList: {
    gap: spacing.md,
    paddingBottom: spacing.sm,
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
  },
  pagamentoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  semanaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  corPagamento: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  pontilhado: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: "dashed",
    marginHorizontal: spacing.sm,
    opacity: 0.5,
  },
});
