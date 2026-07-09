import { useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  Keyboard,
} from "react-native";
import { useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { Text } from "./Text";
import { colors, radius, spacing } from "@/theme";

// id aceita número (categorias/formas/bancos) ou texto (bandeira/tipo do cartão).
// Genérico em T preserva o tipo do id por uso (não quebra chamadores numéricos).
type IdOpcao = number | string;

interface Opcao<T extends IdOpcao> {
  id: T;
  name: string;
}

interface Props<T extends IdOpcao> {
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  opcoes: Opcao<T>[];
  valor: T | null;
  onChange: (id: T) => void;
  placeholder?: string;
  onEdit?: () => void;
}

// Campo que abre um bottom sheet com as opções. Modal nativo (slide) —
// consistente em iOS, Android e Web.
export function SelectField<T extends IdOpcao = number>({
  label,
  icon,
  opcoes,
  valor,
  onChange,
  placeholder = "Selecionar",
  onEdit,
}: Props<T>) {
  const [aberto, setAberto] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const selecionada = opcoes.find((o) => o.id === valor);

  function abrir() {
    Keyboard.dismiss();
    setAberto(true);
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }

  function fechar(callback?: () => void) {
    Animated.timing(anim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setAberto(false);
      if (typeof callback === "function") callback();
    });
  }

  function selecionar(id: T) {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onChange(id);
    fechar();
  }

  return (
    <>
      <Pressable style={styles.campo} onPress={abrir}>
        {icon && (
          <View style={styles.iconeCampo}>
            <Ionicons name={icon} size={20} color={colors.primary} />
          </View>
        )}
        <View style={styles.textoCampo}>
          <Text variant="caption" color={colors.secondary}>
            {label.toUpperCase()}
          </Text>
          <Text
            variant="body"
            color={selecionada ? colors.onSurface : colors.secondary}
          >
            {selecionada?.name ?? placeholder}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.secondary} />
      </Pressable>

      <Modal
        visible={aberto}
        transparent
        animationType="none"
        onRequestClose={() => fechar()}
      >
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: anim.interpolate({
                inputRange: [0, 0.4, 1],
                outputRange: [0, 0, 1],
              }),
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => fechar()} />
        </Animated.View>

        <Animated.View 
          style={[
            styles.sheet, 
            { 
              paddingBottom: insets.bottom + spacing.md,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get("window").height, 0],
                  }),
                },
              ],
            }
          ]}
        >
          <View style={styles.puxador} />
          <View style={styles.headerSheet}>
            <Text variant="headline" style={styles.tituloSheet}>
              {label}
            </Text>
            {onEdit && (
              <Pressable onPress={() => fechar(onEdit)} hitSlop={12} style={styles.botaoEdit}>
                <Ionicons name="pencil" size={20} color={colors.primary} />
              </Pressable>
            )}
          </View>
          <ScrollView style={styles.lista} bounces={false}>
            {opcoes.map((o) => {
              const ativa = o.id === valor;
              return (
                <Pressable
                  key={o.id}
                  style={styles.opcao}
                  onPress={() => selecionar(o.id)}
                >
                  <Text variant="body" color={ativa ? colors.primary : colors.onSurface}>
                    {o.name}
                  </Text>
                  {ativa && (
                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  campo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  iconeCampo: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: "rgba(117,90,38,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  textoCampo: { flex: 1, gap: 2 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    maxHeight: "70%",
  },
  puxador: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  headerSheet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  tituloSheet: { marginBottom: 0 },
  botaoEdit: {
    padding: spacing.xs,
  },
  lista: { flexGrow: 0 },
  opcao: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
