import { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  interpolateColor,
  Easing,
} from "react-native-reanimated";
import { Text } from "@/components";
import { useAuth } from "./store";
import { useOnboarding } from "@/store/onboarding";
import { useResumo } from "@/features/despesas/hooks";
import { capitalizar } from "@/utils/format";
import { colors, spacing, fonts } from "@/theme";

const { width: LARGURA, height: ALTURA } = Dimensions.get("window");

// Fases: 0 "Preparando" · 1 "Buscando" · 2 digitação · 3 revelação da Home.
// O avanço de fase é uma máquina de estados (um agendamento por fase, sempre
// limpo); as animações visuais rodam na UI thread via Reanimated. A revelação
// só acontece quando a digitação termina E os dados já chegaram.
export function OnboardingOverlay() {
  const insets = useSafeAreaInsets();
  const nome = capitalizar(useAuth((s) => s.usuario?.primeiroNome) ?? "você");
  const revelarHome = useOnboarding((s) => s.revelarHome);
  const concluir = useOnboarding((s) => s.concluir);
  const { isLoading } = useResumo();
  const dadosProntos = !isLoading;

  const saudacao = `Olá, ${nome}!`;

  const [fase, setFase] = useState(0);
  const [digitado, setDigitado] = useState("");
  const [digitou, setDigitou] = useState(false);

  // Shared values (UI thread)
  const prog = useSharedValue(0);
  const bg = useSharedValue(1);
  const barOp = useSharedValue(1);
  const s1 = useSharedValue(0); // estado msg1: 0 escondida → 1 destaque → 2 secundária
  const o1 = useSharedValue(1); // fade de saída da msg1 na fase 2
  const s2 = useSharedValue(0); // estado msg2
  const gEnter = useSharedValue(0); // entrada da saudação
  const gMove = useSharedValue(0); // 0 centro → 1 topo (revelação)
  const cursor = useSharedValue(1);

  // --- Máquina de estados por fase ---
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (fase === 0) {
      s1.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
      prog.value = withTiming(0.35, { duration: 900, easing: Easing.out(Easing.cubic) });
      timer = setTimeout(() => setFase(1), 1200);
    } else if (fase === 1) {
      s1.value = withTiming(2, { duration: 500, easing: Easing.inOut(Easing.cubic) });
      s2.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
      prog.value = withTiming(0.7, { duration: 900, easing: Easing.out(Easing.cubic) });
      timer = setTimeout(() => setFase(2), 1200);
    } else if (fase === 2) {
      o1.value = withTiming(0, { duration: 350 });
      s2.value = withTiming(2, { duration: 500, easing: Easing.inOut(Easing.cubic) });
      gEnter.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
      prog.value = withTiming(0.9, { duration: 700, easing: Easing.out(Easing.cubic) });
    }

    return () => clearTimeout(timer);
  }, [fase, s1, s2, o1, gEnter, prog]);

  // --- Digitação (um único interval) ---
  useEffect(() => {
    if (fase !== 2) return;
    const chars = [...saudacao];
    let i = 0;
    const iv = setInterval(() => {
      i += 1;
      setDigitado(chars.slice(0, i).join(""));
      if (i >= chars.length) {
        clearInterval(iv);
        // cursor pisca rápido e some
        cursor.value = withSequence(
          withRepeat(withTiming(0, { duration: 220 }), 5, true),
          withTiming(0, { duration: 150 })
        );
        setDigitou(true);
      }
    }, 55);
    return () => clearInterval(iv);
  }, [fase, saudacao, cursor]);

  // --- Revelação: só quando digitou E dados prontos ---
  useEffect(() => {
    if (!digitou || !dadosProntos || fase >= 3) return;
    prog.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
    const timer = setTimeout(() => setFase(3), 320);
    return () => clearTimeout(timer);
  }, [digitou, dadosProntos, fase, prog]);

  useEffect(() => {
    if (fase !== 3) return;
    revelarHome(); // Home começa a montar seus cards (stagger)
    gMove.value = withSpring(1, { damping: 18, stiffness: 90 });
    const t1 = setTimeout(() => {
      bg.value = withTiming(0, { duration: 450, easing: Easing.out(Easing.cubic) });
      barOp.value = withTiming(0, { duration: 300 });
    }, 220);
    const t2 = setTimeout(() => concluir(), 780);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [fase, revelarHome, concluir, gMove, bg, barOp]);

  // --- Estilos animados ---
  const corSurface = colors.onSurface;
  const corSec = colors.secondary;

  const estiloFundo = useAnimatedStyle(() => ({ opacity: bg.value }));

  const estiloMsg1 = useAnimatedStyle(() => ({
    opacity: interpolate(s1.value, [0, 1, 2], [0, 1, 0.85]) * o1.value,
    transform: [
      { translateY: interpolate(s1.value, [0, 1, 2], [12, 0, -46]) },
      { scale: interpolate(s1.value, [0, 1, 2], [1, 1, 0.72]) },
    ],
  }));
  const corMsg1 = useDerivedValue(() =>
    interpolateColor(s1.value, [1, 2], [corSurface, corSec])
  );

  const estiloMsg2 = useAnimatedStyle(() => ({
    opacity: interpolate(s2.value, [0, 1, 2], [0, 1, 0.85]),
    transform: [
      { translateY: interpolate(s2.value, [0, 1, 2], [12, 0, -46]) },
      { scale: interpolate(s2.value, [0, 1, 2], [1, 1, 0.72]) },
    ],
  }));
  const corMsg2 = useDerivedValue(() =>
    interpolateColor(s2.value, [1, 2], [corSurface, corSec])
  );

  // Saudação: entra no centro; na revelação sobe e diminui rumo ao topo
  const estiloSaudacao = useAnimatedStyle(() => ({
    opacity: gEnter.value,
    transform: [
      { translateY: interpolate(gMove.value, [0, 1], [0, -ALTURA * 0.32]) },
      { translateX: interpolate(gMove.value, [0, 1], [0, -LARGURA * 0.18]) },
      { scale: interpolate(gMove.value, [0, 1], [1, 0.78]) },
    ],
  }));
  const estiloCursor = useAnimatedStyle(() => ({ opacity: cursor.value }));

  const estiloBarra = useAnimatedStyle(() => ({
    width: `${prog.value * 100}%`,
  }));
  const estiloBarraWrap = useAnimatedStyle(() => ({ opacity: barOp.value }));

  return (
    <Animated.View style={[styles.container, estiloFundo]} pointerEvents="none">
      {/* Pilha de mensagens, centralizada */}
      <View style={styles.centro}>
        <Animated.Text style={[styles.mensagem, estiloMsg1, { color: corMsg1 }]}>
          Preparando a sua experiência
        </Animated.Text>

        {fase >= 1 && (
          <Animated.Text style={[styles.mensagem, styles.abs, estiloMsg2, { color: corMsg2 }]}>
            Buscando os seus dados
          </Animated.Text>
        )}

        {fase >= 2 && (
          <Animated.View style={[styles.abs, styles.saudacaoWrap, estiloSaudacao]}>
            <Text variant="displayLg" style={styles.saudacao}>
              {digitado}
              <Animated.Text style={[styles.cursor, estiloCursor]}>|</Animated.Text>
            </Text>
          </Animated.View>
        )}
      </View>

      {/* Barra de progresso inferior */}
      <Animated.View
        style={[styles.barraWrap, { bottom: insets.bottom + spacing.xl }, estiloBarraWrap]}
      >
        <View style={styles.barraTrilho}>
          <Animated.View style={[styles.barraFill, estiloBarra]} />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    zIndex: 1000,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  abs: { position: "absolute" },
  mensagem: {
    fontFamily: fonts.sans,
    fontSize: 18,
    textAlign: "center",
  },
  saudacaoWrap: { alignItems: "center" },
  saudacao: { textAlign: "center" },
  cursor: { color: colors.primary },
  barraWrap: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },
  barraTrilho: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "rgba(117,90,38,0.12)",
    overflow: "hidden",
  },
  barraFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});
