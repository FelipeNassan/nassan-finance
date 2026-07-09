import { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Keyboard,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Controller, useForm, useWatch } from "react-hook-form";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Text, Button } from "@/components";
import { SelectField } from "@/components/SelectField";
import { EditOptionsModal } from "@/components/EditOptionsModal";
import { useReferencias } from "@/features/despesas/hooks";
import { hojeIso, formatarDataCurta } from "@/utils/format";
import { ApiError } from "@/services/api";
import type { NovaDespesa } from "@/types";
import { colors, radius, spacing } from "@/theme";

interface FormValues {
  valor: string;
  categoriaId: number | null;
  formaPagamentoId: number | null;
  bancoId: number | null;
  descricao: string;
  data: string;
}

export interface DespesaFormProps {
  titulo: string;
  submitLabel: string;
  inicial?: Partial<FormValues>;
  submitting: boolean;
  onSubmit: (dados: NovaDespesa) => Promise<void>;
  onClose: () => void;
}

// Formulário compartilhado entre "Novo Lançamento" e "Editar". O pai passa
// os valores iniciais e o onSubmit (que faz a chamada de API + navegação);
// o erro de submit é exibido aqui dentro.
export function DespesaForm({
  titulo,
  submitLabel,
  inicial,
  submitting,
  onSubmit,
  onClose,
}: DespesaFormProps) {
  const insets = useSafeAreaInsets();
  const { data: refs } = useReferencias();
  const [erro, setErro] = useState<string | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editModalTipo, setEditModalTipo] = useState<"categoria" | "pagamento">("categoria");

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      valor: inicial?.valor ?? "",
      categoriaId: inicial?.categoriaId ?? null,
      formaPagamentoId: inicial?.formaPagamentoId ?? null,
      bancoId: inicial?.bancoId ?? null,
      descricao: inicial?.descricao ?? "",
      data: inicial?.data ?? hojeIso(),
    },
  });

  const teclado = useSharedValue(0);
  const isDescricaoFocused = useRef(false);
  const keyboardHeight = useRef(0);

  const watchFormaPagamentoId = useWatch({ control, name: "formaPagamentoId" });
  const isDinheiro = refs?.formasPagamento.find(p => p.id === watchFormaPagamentoId)?.name.toLowerCase() === "dinheiro";

  useEffect(() => {
    const evtShow = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const evtHide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    
    const s1 = Keyboard.addListener(evtShow, (e) => {
      keyboardHeight.current = e.endCoordinates.height;
      // Dá um pequeno tempo para o onFocus ser registrado pelo React Native antes de subir
      setTimeout(() => {
        if (!isDescricaoFocused.current) {
          teclado.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
        } else {
          const compensacao = insets.bottom + spacing.xl;
          teclado.value = withTiming(e.endCoordinates.height - compensacao, {
            duration: 250,
            easing: Easing.out(Easing.cubic),
          });
        }
      }, 50);
    });

    const s2 = Keyboard.addListener(evtHide, () => {
      keyboardHeight.current = 0;
      teclado.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
    });
    return () => {
      s1.remove();
      s2.remove();
    };
  }, [teclado]);

  const estiloAnimado = useAnimatedStyle(() => ({
    transform: [{ translateY: -teclado.value }],
  }));

  async function enviar(form: FormValues) {
    setErro(null);
    const valorNum = parseFloat(form.valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) {
      setErro("Informe um valor válido.");
      return;
    }
    if (!form.categoriaId || !form.formaPagamentoId) {
      setErro("Selecione categoria e forma de pagamento.");
      return;
    }
    if (!form.descricao.trim()) {
      setErro("A observação/descrição do lançamento é obrigatória.");
      return;
    }

    const isFormDinheiro = refs?.formasPagamento.find(p => p.id === form.formaPagamentoId)?.name.toLowerCase() === "dinheiro";
    if (!isFormDinheiro && !form.bancoId) {
      setErro("Selecione um banco.");
      return;
    }

    try {
      await onSubmit({
        data: form.data,
        valor: valorNum,
        descricao: form.descricao,
        categoriaId: form.categoriaId,
        formaPagamentoId: form.formaPagamentoId,
        bancoId: form.bancoId,
      });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Falha ao salvar.");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }

  return (
    <>
      <Animated.View style={[styles.flex, estiloAnimado]}>
        <View style={[styles.container, { paddingTop: spacing.md }]}>
          <View style={styles.puxador} />
          <View style={[styles.header, { marginTop: Platform.OS === 'android' ? insets.top : 0 }]}>
            <Pressable onPress={onClose} hitSlop={8} style={styles.fechar}>
              <Ionicons name="close" size={24} color={colors.onSurface} />
            </Pressable>
            <Text variant="label">{titulo}</Text>
            <View style={styles.fechar} />
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.conteudo,
              { paddingBottom: insets.bottom + spacing.xl },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Valor em destaque */}
            <View style={styles.valorBloco}>
              <Text variant="caption" color={colors.secondary}>
                VALOR
              </Text>
              <View style={styles.valorLinha}>
                <Text variant="displayLg" color={colors.primary}>
                  R$
                </Text>
                <Controller
                  control={control}
                  name="valor"
                  render={({ field: { value, onChange } }) => (
                    <TextInput
                      value={value}
                      onChangeText={(t) => {
                        const nums = t.replace(/\D/g, "");
                        if (!nums) return onChange("");
                        const num = parseInt(nums, 10) / 100;
                        onChange(num.toFixed(2).replace(".", ","));
                      }}
                      placeholder="0,00"
                      placeholderTextColor="rgba(27,28,27,0.2)"
                      keyboardType="number-pad"
                      style={styles.valorInput}
                    />
                  )}
                />
              </View>
            </View>

            {erro && (
              <View style={styles.erro}>
                <Ionicons name="alert-circle" size={18} color={colors.error} />
                <Text variant="label" color={colors.error} style={styles.flex}>
                  {erro}
                </Text>
              </View>
            )}

            <Controller
              control={control}
              name="data"
              render={({ field: { value, onChange } }) => (
                <DateChips value={value} onChange={onChange} />
              )}
            />

            <Controller
              control={control}
              name="categoriaId"
              render={({ field: { value, onChange } }) => (
                <SelectField
                  label="Categoria"
                  icon="grid"
                  opcoes={(refs?.categorias ?? []).filter(c => c.isActive !== false)}
                  valor={value}
                  onChange={onChange}
                  onEdit={() => {
                    setEditModalTipo("categoria");
                    setEditModalVisible(true);
                  }}
                />
              )}
            />

            <Controller
              control={control}
              name="formaPagamentoId"
              render={({ field: { value, onChange } }) => (
                <SelectField
                  label="Forma de pagamento"
                  icon="card"
                  opcoes={(refs?.formasPagamento ?? []).filter(f => f.isActive !== false)}
                  valor={value}
                  onChange={onChange}
                  onEdit={() => {
                    setEditModalTipo("pagamento");
                    setEditModalVisible(true);
                  }}
                />
              )}
            />

            {(refs?.bancos.length ?? 0) > 0 && !!watchFormaPagamentoId && !isDinheiro && (
              <Controller
                control={control}
                name="bancoId"
                render={({ field: { value, onChange } }) => (
                  <SelectField
                    label="Banco"
                    icon="business"
                    opcoes={(refs?.bancos ?? []).filter(b => b.isActive !== false)}
                    valor={value}
                    onChange={onChange}
                    placeholder="Selecione um banco"
                  />
                )}
              />
            )}

            <Controller
              control={control}
              name="descricao"
              render={({ field: { value, onChange } }) => (
                <View style={styles.obs}>
                  <Text variant="caption" color={colors.secondary}>
                    OBSERVAÇÃO
                  </Text>
                  <TextInput
                    value={value}
                    onChangeText={onChange}
                    onFocus={() => { 
                      isDescricaoFocused.current = true;
                      if (keyboardHeight.current > 0) {
                        const compensacao = insets.bottom + spacing.xl;
                        teclado.value = withTiming(keyboardHeight.current - compensacao, {
                          duration: 250, easing: Easing.out(Easing.cubic)
                        });
                      }
                    }}
                    onBlur={() => { 
                      isDescricaoFocused.current = false;
                      // Se fechou a observação e foi pra outro campo, volta a tela
                      teclado.value = withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) });
                    }}
                    placeholder="Para que serve este gasto?"
                    placeholderTextColor="rgba(27,28,27,0.25)"
                    style={styles.obsInput}
                    multiline
                    maxLength={255}
                  />
                </View>
              )}
            />

            <View style={styles.acao}>
              <Button
                label={submitLabel}
                icon="checkmark"
                onPress={handleSubmit(enviar)}
                loading={submitting}
              />
            </View>
          </ScrollView>
          <View style={styles.fundoExtra} />
        </View>
      </Animated.View>

      <EditOptionsModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        tipo={editModalTipo}
        opcoes={
          editModalTipo === "categoria"
            ? refs?.categorias ?? []
            : refs?.formasPagamento ?? []
        }
      />
    </>
  );
}

// Chips de data: Hoje / Ontem cobrem a maioria dos registros; datas fora disso
// aparecem como um chip extra já selecionado.
function DateChips({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const hoje = hojeIso();
  const ontemDate = new Date();
  ontemDate.setDate(ontemDate.getDate() - 1);
  const ontem = `${ontemDate.getFullYear()}-${String(
    ontemDate.getMonth() + 1
  ).padStart(2, "0")}-${String(ontemDate.getDate()).padStart(2, "0")}`;

  const opcoes = [
    { label: "Hoje", valor: hoje },
    { label: "Ontem", valor: ontem },
  ];

  const ehPredefinida = value === hoje || value === ontem;

  return (
    <View style={styles.chips}>
      {opcoes.map((o) => {
        const ativa = value === o.valor;
        return (
          <Pressable
            key={o.valor}
            onPress={() => onChange(o.valor)}
            style={[styles.chip, ativa && styles.chipAtiva]}
          >
            <Text
              variant="label"
              color={ativa ? colors.onPrimary : colors.secondary}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
      {!ehPredefinida ? (
        <Pressable
          onPress={() => setShowPicker(true)}
          style={[styles.chip, styles.chipAtiva]}
        >
          <Text variant="label" color={colors.onPrimary}>
            {formatarDataCurta(value)}
          </Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => setShowPicker(true)}
          style={styles.chip}
        >
          <Text variant="label" color={colors.secondary}>
            Outro dia
          </Text>
        </Pressable>
      )}

      <DateTimePickerModal
        isVisible={showPicker}
        mode="date"
        date={new Date(value + "T12:00:00")}
        onConfirm={(date) => {
          setShowPicker(false);
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, "0");
          const dd = String(date.getDate()).padStart(2, "0");
          onChange(`${yyyy}-${mm}-${dd}`);
        }}
        onCancel={() => setShowPicker(false)}
        confirmTextIOS="Confirmar"
        cancelTextIOS="Cancelar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  // Estende o fundo para baixo (cobre o bounce/overscroll no fim da lista)
  fundoExtra: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -1000,
    height: 1000,
    backgroundColor: colors.background,
    zIndex: -1,
  },
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  fechar: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  conteudo: { paddingHorizontal: spacing.lg, gap: spacing.md },
  valorBloco: { alignItems: "center", paddingVertical: spacing.lg, gap: spacing.xs },
  valorLinha: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  valorInput: {
    fontFamily: "Caslon",
    fontSize: 44,
    color: colors.onSurface,
    minWidth: 160,
    textAlign: "center",
    padding: 0,
    fontVariant: ["tabular-nums"],
  },
  erro: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(186,26,26,0.08)",
    padding: spacing.md,
    borderRadius: radius.md,
  },
  chips: { flexDirection: "row", gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtiva: { backgroundColor: colors.primary, borderColor: colors.primary },
  obs: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  obsInput: {
    fontFamily: "Hanken",
    fontSize: 16,
    color: colors.onSurface,
    minHeight: 48,
    textAlignVertical: "top",
    padding: 0,
  },
  acao: { marginTop: spacing.md },
});
