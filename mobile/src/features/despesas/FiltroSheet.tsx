import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, View, ScrollView, Platform, Animated, PanResponder, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Text } from "@/components";
import {
  type Filtros,
  type Ordenacao,
  type Periodo,
  ROTULO_ORDENACAO,
  ROTULO_PERIODO,
  FILTROS_PADRAO,
} from "./filtros";
import { colors, radius, spacing } from "@/theme";

interface Props {
  visivel: boolean;
  filtros: Filtros;
  categorias: string[];
  formasPagamento: string[];
  onChange: (f: Filtros) => void;
  onFechar: () => void;
}

const ORDENACOES: Ordenacao[] = ["recentes", "antigos", "maior", "menor"];
const PERIODOS: Periodo[] = ["tudo", "mes", "mesPassado", "7dias"];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function FiltroSheet({
  visivel,
  filtros,
  categorias,
  formasPagamento,
  onChange,
  onFechar,
}: Props) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(visivel);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visivel) {
      setModalVisible(true);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [visivel, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > SCREEN_HEIGHT * 0.2 || gestureState.vy > 0.5) {
          onFechar();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
    })
  ).current;

  function toque() {
    if (Platform.OS !== "web") Haptics.selectionAsync();
  }

  const backdropOpacity = translateY.interpolate({
    inputRange: [0, SCREEN_HEIGHT],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onFechar}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onFechar} />
      </Animated.View>
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + spacing.md },
          { transform: [{ translateY }] },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.headerArea}>
          <View style={styles.puxador} />
          <View style={styles.tituloLinha}>
            <Text variant="headline">Filtros</Text>
            <Pressable onPress={() => onChange(FILTROS_PADRAO)} hitSlop={8}>
              <Text variant="label" color={colors.primary}>
                Limpar
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView 
          bounces={false} 
          showsVerticalScrollIndicator={false}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <View onStartShouldSetResponder={() => true}>
            <Grupo titulo="Status">
              <Chip
                label="Válidos"
                ativo={filtros.status === "validos"}
                onPress={() => {
                  toque();
                  onChange({ ...filtros, status: "validos" });
                }}
              />
              <Chip
                label="Apagados"
                ativo={filtros.status === "apagados"}
                onPress={() => {
                  toque();
                  onChange({ ...filtros, status: "apagados" });
                }}
              />
              <Chip
                label="Todos"
                ativo={filtros.status === "todos"}
                onPress={() => {
                  toque();
                  onChange({ ...filtros, status: "todos" });
                }}
              />
            </Grupo>

            <Grupo titulo="Ordenar por">
              {ORDENACOES.map((o) => (
                <Chip
                  key={o}
                  label={ROTULO_ORDENACAO[o]}
                  ativo={filtros.ordenacao === o}
                  onPress={() => {
                    toque();
                    onChange({ ...filtros, ordenacao: o });
                  }}
                />
              ))}
            </Grupo>

            <Grupo titulo="Período">
              {PERIODOS.map((p) => (
                <Chip
                  key={p}
                  label={ROTULO_PERIODO[p]}
                  ativo={filtros.periodo === p}
                  onPress={() => {
                    toque();
                    onChange({ ...filtros, periodo: p });
                  }}
                />
              ))}
            </Grupo>

            {categorias.length > 0 && (
              <Grupo titulo="Categoria">
                <Chip
                  label="Todas"
                  ativo={filtros.categoria === null}
                  onPress={() => {
                    toque();
                    onChange({ ...filtros, categoria: null });
                  }}
                />
                {categorias.map((c) => (
                  <Chip
                    key={c}
                    label={c}
                    ativo={filtros.categoria === c}
                    onPress={() => {
                      toque();
                      onChange({ ...filtros, categoria: c });
                    }}
                  />
                ))}
              </Grupo>
            )}

            {formasPagamento.length > 0 && (
              <Grupo titulo="Forma de pagamento">
                <Chip
                  label="Todas"
                  ativo={filtros.formaPagamento === null}
                  onPress={() => {
                    toque();
                    onChange({ ...filtros, formaPagamento: null });
                  }}
                />
                {formasPagamento.map((fp) => (
                  <Chip
                    key={fp}
                    label={fp}
                    ativo={filtros.formaPagamento === fp}
                    onPress={() => {
                      toque();
                      onChange({ ...filtros, formaPagamento: fp });
                    }}
                  />
                ))}
              </Grupo>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <View style={styles.grupo}>
      <Text variant="caption" color={colors.secondary}>
        {titulo.toUpperCase()}
      </Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({
  label,
  ativo,
  onPress,
}: {
  label: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, ativo && styles.chipAtivo]}>
      <Text variant="label" color={ativo ? colors.onPrimary : colors.secondary}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: "rgba(0,0,0,0.35)" 
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: "80%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  headerArea: {
    paddingBottom: spacing.sm,
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  tituloLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  grupo: { gap: spacing.sm, marginBottom: spacing.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
});
