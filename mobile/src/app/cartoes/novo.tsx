import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useCriarCartao } from "@/features/cartoes/hooks";
import { useReferencias } from "@/features/despesas/hooks";
import { Text, Screen, Button, EditOptionsModal } from "@/components";
import { Field } from "@/components";
import { SelectField } from "@/components/SelectField";
import { colors, spacing } from "@/theme";
import { useCriarBanco, useDeletarBanco } from "@/features/despesas/hooks";

export default function NovoCartaoScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  
  const [nickname, setNickname] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [bankId, setBankId] = useState<number | null>(null);
  
  const [holderName, setHolderName] = useState("");
  const [brand, setBrand] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiration, setExpiration] = useState("");
  const [type, setType] = useState("Crédito");
  const [limit, setLimit] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState("#820AD1"); // Default premium color

  const PREDEFINED_COLORS = ["#820AD1", "#FF7A00", "#FFD400", "#21C25E", "#00B1EA", "#1F5EFF"];

  const [isBancosModalOpen, setIsBancosModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [customColor, setCustomColor] = useState("");

  const formatCurrency = (val: string) => {
    if (!val) return "";
    const num = parseInt(val, 10);
    if (isNaN(num)) return "";
    const str = (num / 100).toFixed(2);
    return "R$ " + str.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const { data: referencias, isLoading: isLoadingRef } = useReferencias();
  const criarCartao = useCriarCartao();
  const criarBanco = useCriarBanco();
  const deletarBanco = useDeletarBanco();

  const handleSalvar = () => {
    if (!nickname.trim()) return Alert.alert("Atenção", "Preencha o apelido do cartão.");
    if (!bankId) return Alert.alert("Atenção", "Selecione o banco.");
    
    const cd = parseInt(closingDay, 10);
    const dd = parseInt(dueDay, 10);
    
    if (isNaN(cd) || cd < 1 || cd > 31) return Alert.alert("Atenção", "Dia de fechamento inválido.");
    if (isNaN(dd) || dd < 1 || dd > 31) return Alert.alert("Atenção", "Dia de vencimento inválido.");

    criarCartao.mutate(
      { 
        nickname, 
        closingDay: cd, 
        dueDay: dd, 
        bankId,
        holderName,
        brand,
        cardNumber,
        expiration,
        type,
        limit: type.includes("Créd") && limit ? (parseFloat(limit) / 100) : undefined,
        color,
        password
      },
      {
        onSuccess: () => {
          router.back();
        },
        onError: () => {
          Alert.alert("Erro", "Não foi possível cadastrar o cartão.");
        },
      }
    );
  };

  const bancosOptions = (referencias?.bancos ?? [])
    .filter(b => b.isActive !== false)
    .map(b => ({
      id: b.id,
      name: b.name,
    }));

  return (
    <Screen>
      <Stack.Screen 
        options={{ 
          title: "Novo Cartão",
          headerLeft: () => step > 1 ? (
            <Pressable onPress={() => setStep(step - 1)} hitSlop={12} style={{ marginLeft: spacing.sm }}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          ) : undefined
        }} 
      />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text variant="headline" style={{ marginBottom: spacing.lg }}>
              Detalhes Básicos
            </Text>

            <View style={{ marginBottom: spacing.md }}>
              <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Apelido do Cartão</Text>
              <Field
                placeholder="Ex: Nubank Platinum, Itaú Black..."
                value={nickname}
                onChangeText={setNickname}
              />
            </View>

            <View style={{ marginVertical: spacing.md }}>
              <SelectField
                label="Banco"
                icon="business-outline"
                opcoes={bancosOptions}
                valor={bankId}
                onChange={(val) => setBankId(val)}
                placeholder={isLoadingRef ? "Carregando bancos..." : "Selecione um banco"}
                onEdit={() => setIsBancosModalOpen(true)}
              />
            </View>

            <View style={{ marginBottom: spacing.lg, marginTop: spacing.sm }}>
              <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs, textAlign: "center" }}>Cor do Cartão</Text>
              <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs, flexWrap: "wrap", justifyContent: "center" }}>
                {PREDEFINED_COLORS.map(c => (
                  <Pressable
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: c,
                      borderWidth: 3,
                      borderColor: color === c ? colors.primary : "transparent",
                    }}
                  />
                ))}
                
                <Pressable
                  onPress={() => setIsColorModalOpen(true)}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.surface,
                    borderWidth: 2,
                    borderColor: colors.border,
                    borderStyle: "dashed",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Ionicons name="add" size={20} color={colors.secondary} />
                </Pressable>
              </View>
            </View>

            <Button
              label="Seguir"
              onPress={() => {
                if (!nickname.trim()) return Alert.alert("Atenção", "Preencha o apelido do cartão.");
                if (!bankId) return Alert.alert("Atenção", "Selecione o banco.");
                setStep(2);
              }}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text variant="headline" style={{ marginBottom: spacing.lg }}>
              Dados do Cartão
            </Text>

            <View style={{ marginBottom: spacing.md }}>
              <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Nome no Cartão</Text>
              <Field
                placeholder="Ex: FULANO SILVA"
                autoCapitalize="characters"
                value={holderName}
                onChangeText={setHolderName}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Número do Cartão</Text>
              <Field
                placeholder="0000 0000 0000 0000"
                keyboardType="number-pad"
                maxLength={19}
                value={cardNumber}
                onChangeText={(text) => {
                  let v = text.replace(/\D/g, "");
                  v = v.replace(/(.{4})/g, "$1 ").trim();
                  setCardNumber(v);
                }}
              />
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginBottom: spacing.md }}>
                <SelectField
                  label="Bandeira"
                  opcoes={[
                    { id: "Visa", name: "Visa" },
                    { id: "Mastercard", name: "Mastercard" },
                    { id: "Elo", name: "Elo" },
                    { id: "American Express", name: "American Express" }
                  ]}
                  valor={brand}
                  onChange={(val) => setBrand(String(val))}
                  placeholder="Selecione..."
                />
              </View>
              <View style={{ flex: 1, marginBottom: spacing.md }}>
                <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Validade (MM/AA)</Text>
                <Field
                  placeholder="12/28"
                  keyboardType="number-pad"
                  maxLength={5}
                  value={expiration}
                  onChangeText={(t) => {
                    let v = t.replace(/\D/g, "");
                    if (v.length > 2) {
                      v = v.substring(0, 2) + "/" + v.substring(2);
                    }
                    setExpiration(v);
                  }}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1, marginBottom: spacing.md }}>
                <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Dia de Fechamento</Text>
                <Field
                  placeholder="Ex: 25"
                  keyboardType="number-pad"
                  value={closingDay}
                  onChangeText={setClosingDay}
                  maxLength={2}
                />
              </View>
              <View style={{ flex: 1, marginBottom: spacing.md }}>
                <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Dia de Vencimento</Text>
                <Field
                  placeholder="Ex: 5"
                  keyboardType="number-pad"
                  value={dueDay}
                  onChangeText={setDueDay}
                  maxLength={2}
                />
              </View>
            </View>

            <View style={{ marginBottom: spacing.md }}>
              <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Senha do Cartão</Text>
              <Field
                placeholder="4 ou 6 dígitos"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                value={password}
                onChangeText={(text) => setPassword(text.replace(/\D/g, ""))}
              />
            </View>

              <Button
                label="Seguir"
                onPress={() => {
                  if (!holderName.trim()) return Alert.alert("Atenção", "Preencha o nome no cartão.");
                  if (!cardNumber.trim()) return Alert.alert("Atenção", "Preencha o número do cartão.");
                  if (!brand) return Alert.alert("Atenção", "Selecione a bandeira.");
                  if (expiration.length < 5) return Alert.alert("Atenção", "Preencha a validade.");
                  if (!closingDay) return Alert.alert("Atenção", "Preencha o dia de fechamento.");
                  if (!dueDay) return Alert.alert("Atenção", "Preencha o dia de vencimento.");
                  setStep(3);
                }}
                style={{ marginTop: spacing.xl }}
              />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text variant="headline" style={{ marginBottom: spacing.lg }}>
              Informações Financeiras
            </Text>

            <View style={{ marginBottom: spacing.md }}>
              <SelectField
                label="Tipo de Cartão"
                opcoes={[
                  { id: "Crédito", name: "Crédito" },
                  { id: "Débito", name: "Débito" },
                  { id: "Créd./Deb.", name: "Créd./Deb." }
                ]}
                valor={type}
                onChange={(val) => setType(String(val))}
                placeholder="Selecione..."
              />
            </View>

            {type.includes("Créd") && (
              <View style={{ marginBottom: spacing.md }}>
                <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Limite do Cartão</Text>
                <Field
                  placeholder="R$ 0,00"
                  keyboardType="numeric"
                  value={formatCurrency(limit)}
                  onChangeText={(text) => setLimit(text.replace(/\D/g, ""))}
                />
              </View>
            )}

            <Button
              label={criarCartao.isPending ? "Salvando..." : "Salvar Cartão"}
              onPress={handleSalvar}
              disabled={criarCartao.isPending}
              style={{ marginTop: spacing.xl }}
            />
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      <EditOptionsModal
        visible={isBancosModalOpen}
        onClose={() => setIsBancosModalOpen(false)}
        tipo="banco"
        opcoes={bancosOptions}
      />

      <Modal visible={isColorModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="title" style={{ marginBottom: spacing.md }}>Cor Personalizada</Text>
            <Text variant="body" color={colors.secondary} style={{ marginBottom: spacing.sm }}>
              Digite o código HEX da cor (ex: #FF0000)
            </Text>
            <Field
              placeholder="#000000"
              value={customColor}
              onChangeText={setCustomColor}
              autoCapitalize="characters"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setIsColorModalOpen(false)} style={styles.modalActionBtn}>
                <Text variant="body" color={colors.secondary}>Cancelar</Text>
              </Pressable>
              <Pressable 
                onPress={() => {
                  let hex = customColor.trim();
                  if (!hex.startsWith("#")) hex = "#" + hex;
                  setColor(hex);
                  setIsColorModalOpen(false);
                }} 
                style={styles.modalActionBtn}
              >
                <Text variant="body" color={colors.primary}>Confirmar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stepContainer: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    width: "100%",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  modalActionBtn: {
    padding: spacing.xs,
  }
});
