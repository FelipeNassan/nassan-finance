import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useReferencias } from "@/features/despesas/hooks";
import { Text, Screen, Button, EditOptionsModal } from "@/components";
import { Field } from "@/components";
import { SelectField } from "@/components/SelectField";
import { colors, spacing } from "@/theme";
import type { NovoCartao } from "@/types";
import { useCriarBanco, useDeletarBanco } from "@/features/despesas/hooks";
import * as Clipboard from "expo-clipboard";

const PREDEFINED_COLORS = [
  "#820AD1", "#FF7A00", "#FFD400", "#21C25E", "#00B1EA", "#1F5EFF"
];

export default function EditarCartaoScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  
  const [nickname, setNickname] = useState("");
  const [closingDay, setClosingDay] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [bankId, setBankId] = useState<number | "">("");
  
  const [holderName, setHolderName] = useState("");
  const [brand, setBrand] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiration, setExpiration] = useState("");
  const [type, setType] = useState("Crédito");
  const [limit, setLimit] = useState("");
  
  const [color, setColor] = useState("");
  const [password, setPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [isBancosModalOpen, setIsBancosModalOpen] = useState(false);

  const formatCurrency = (val: string) => {
    if (!val) return "";
    const num = parseInt(val, 10);
    if (isNaN(num)) return "";
    const str = (num / 100).toFixed(2);
    return "R$ " + str.replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const { data: referencias, isLoading: isLoadingRef } = useReferencias();
  
  const { data: cartao, isLoading: isLoadingCard } = useQuery({
    queryKey: ["cartao", id],
    queryFn: () => api.cartao(Number(id)),
  });

  const atualizarCartao = useMutation({
    mutationFn: (dados: NovoCartao) => api.atualizarCartao(Number(id), dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cartoes"] });
      qc.invalidateQueries({ queryKey: ["cartao", id] });
      router.back();
    }
  });

  const deletarCartao = useMutation({
    mutationFn: () => api.deletarCartao(Number(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cartoes"] });
      router.back();
    }
  });

  const criarBanco = useCriarBanco();
  const deletarBanco = useDeletarBanco();

  useEffect(() => {
    if (cartao) {
      setNickname(cartao.nickname);
      setBankId(cartao.bank.id);
      setClosingDay(String(cartao.closingDay));
      setDueDay(String(cartao.dueDay));
      setHolderName(cartao.holderName || "");
      setBrand(cartao.brand || "");
      setCardNumber(cartao.cardNumber || "");
      setExpiration(cartao.expiration || "");
      setType(cartao.type || "Crédito");
      if (cartao.limit) {
        setLimit(String(Math.round(cartao.limit * 100)));
      }
      setColor(cartao.color || "");
      setPassword(cartao.password || "");
      setIsActive(cartao.isActive !== false);
    }
  }, [cartao]);

  const handleCopy = async (text: string, id: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const renderLabelWithCopy = (label: string, textToCopy: string, copyId: string) => (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: spacing.xs, gap: spacing.xs }}>
      <Text variant="caption" color={colors.secondary}>{label}</Text>
      {!!textToCopy && (
        <Pressable onPress={() => handleCopy(textToCopy, copyId)} hitSlop={10} style={{ padding: 4 }}>
          <Ionicons 
            name={copiedId === copyId ? "checkmark" : "copy-outline"} 
            size={14} 
            color={copiedId === copyId ? colors.primary : colors.secondary} 
          />
        </Pressable>
      )}
    </View>
  );

  const handleSalvar = () => {
    if (!nickname.trim()) return Alert.alert("Atenção", "Preencha o apelido do cartão.");
    if (!bankId) return Alert.alert("Atenção", "Selecione o banco.");
    if (!holderName.trim()) return Alert.alert("Atenção", "Preencha o nome no cartão.");
    if (!cardNumber.trim()) return Alert.alert("Atenção", "Preencha o número do cartão.");
    if (!brand) return Alert.alert("Atenção", "Selecione a bandeira.");
    if (expiration.length < 5) return Alert.alert("Atenção", "Preencha a validade.");
    
    const cd = parseInt(closingDay, 10);
    const dd = parseInt(dueDay, 10);
    
    if (isNaN(cd) || cd < 1 || cd > 31) return Alert.alert("Atenção", "Dia de fechamento inválido.");
    if (isNaN(dd) || dd < 1 || dd > 31) return Alert.alert("Atenção", "Dia de vencimento inválido.");

    atualizarCartao.mutate({ 
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
      password,
      isActive
    });
  };



  if (isLoadingCard || isLoadingRef) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Detalhes do Cartão" }} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const bancosOptions = referencias?.bancos
    .filter(b => b.isActive !== false)
    .map((b) => ({
      id: b.id,
      name: b.name,
    })) || [];

  return (
    <Screen>
      <Stack.Screen options={{ title: "Detalhes do Cartão" }} />

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          
          <View style={styles.section}>
            <Text variant="headline" style={{ marginBottom: spacing.md }}>Detalhes Básicos</Text>
            
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
                placeholder="Selecione um banco"
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
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="headline" style={{ marginBottom: spacing.md }}>Dados do Cartão</Text>

            <View style={{ marginBottom: spacing.md }}>
              {renderLabelWithCopy("Nome no Cartão", holderName, "holderName")}
              <Field
                placeholder="Ex: FULANO SILVA"
                autoCapitalize="characters"
                value={holderName}
                onChangeText={setHolderName}
              />
            </View>

            <View style={{ marginBottom: spacing.md }}>
              {renderLabelWithCopy("Número do Cartão", cardNumber, "cardNumber")}
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
                    { id: "American Express", name: "American Express" },
                  ]}
                  valor={brand}
                  onChange={(val) => setBrand(String(val))}
                  placeholder="Selecione..."
                />
              </View>
              <View style={{ flex: 1, marginBottom: spacing.md }}>
                <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Validade</Text>
                <Field
                  placeholder="MM/AA"
                  keyboardType="number-pad"
                  maxLength={5}
                  value={expiration}
                  onChangeText={(text) => {
                    let v = text.replace(/\D/g, "");
                    if (v.length > 2) {
                      v = v.substring(0, 2) + "/" + v.substring(2, 4);
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
              {renderLabelWithCopy("Senha do Cartão", password, "password")}
              <Field
                placeholder="4 ou 6 dígitos"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={6}
                value={password}
                onChangeText={(text) => setPassword(text.replace(/\D/g, ""))}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text variant="headline" style={{ marginBottom: spacing.md }}>Informações Financeiras</Text>

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
          </View>

          <Button
            label={atualizarCartao.isPending ? "Salvando..." : "Salvar Alterações"}
            onPress={handleSalvar}
            disabled={atualizarCartao.isPending}
            style={{ marginTop: spacing.lg }}
          />

          <View style={[styles.section, { borderBottomWidth: 0, marginTop: spacing.md }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text variant="body" color={colors.text}>Cartão Ativo</Text>
              <Switch
                value={isActive}
                onValueChange={setIsActive}
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <EditOptionsModal
        visible={isBancosModalOpen}
        onClose={() => setIsBancosModalOpen(false)}
        tipo="banco"
        opcoes={referencias?.bancos || []}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
  }
});
