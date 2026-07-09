import React from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, TouchableOpacity, Image } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { useCartoes } from "@/features/cartoes/hooks";
import { useReferencias } from "@/features/despesas/hooks";
import { Text, Screen, Card, Button, PasswordPromptModal } from "@/components";
import { EditOptionsModal } from "@/components/EditOptionsModal";
import { colors, spacing } from "@/theme";
import type { Cartao } from "@/types";

export default function CartoesScreen() {
  const router = useRouter();
  const { data: cartoes, isLoading } = useCartoes();
  
  const [selectedCardId, setSelectedCardId] = React.useState<number | null>(null);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = React.useState(false);
  const [filter, setFilter] = React.useState<"ativos" | "inativos" | "todos">("ativos");
  const [isBankModalVisible, setIsBankModalVisible] = React.useState(false);
  
  const { data: referencias } = useReferencias();
  
  const filteredCartoes = React.useMemo(() => {
    if (!cartoes) return [];
    return cartoes.filter(c => {
      if (filter === "ativos") return c.isActive !== false;
      if (filter === "inativos") return c.isActive === false;
      return true;
    });
  }, [cartoes, filter]);

  if (isLoading) {
    return (
      <Screen>
        <Stack.Screen options={{ title: "Meus cartões" }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Screen>
    );
  }

  const hasCartoes = cartoes && cartoes.length > 0;
  
  const renderFilterPill = (label: string, value: "todos" | "ativos" | "inativos") => {
    const isActive = filter === value;
    return (
      <Pressable 
        onPress={() => setFilter(value)}
        style={{
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 16,
          backgroundColor: isActive ? colors.primary : "transparent",
          borderWidth: 1,
          borderColor: isActive ? colors.primary : colors.border
        }}
      >
        <Text style={{ fontSize: 12, color: isActive ? "#FFF" : colors.secondary, fontFamily: "HankenMedium" }}>
          {label}
        </Text>
      </Pressable>
    );
  };


  return (
    <Screen>
      <Stack.Screen
        options={{
          title: "Meus cartões",
          headerRight: () =>
            hasCartoes ? (
              <Pressable onPress={() => router.push("/cartoes/novo")} hitSlop={8}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </Pressable>
            ) : null,
        }}
      />

      <View style={styles.container}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md }}>
          <Text variant="headline">Meus cartões</Text>
          <Pressable 
            onPress={() => setIsBankModalVisible(true)}
            style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4, paddingHorizontal: 8, backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 12 }}
          >
            <Ionicons name="business-outline" size={16} color={colors.secondary} />
            <Text style={{ fontSize: 12, color: colors.secondary, fontFamily: "HankenMedium" }}>Bancos</Text>
          </Pressable>
        </View>

        {hasCartoes && (
          <View style={{ flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg }}>
            {renderFilterPill("Ativos", "ativos")}
            {renderFilterPill("Inativos", "inativos")}
            {renderFilterPill("Todos", "todos")}
          </View>
        )}

        {!hasCartoes ? (
          <View style={styles.emptyState}>
            <Ionicons name="card-outline" size={64} color={colors.secondary} style={{ marginBottom: spacing.md }} />
            <Text variant="title" style={{ textAlign: "center", marginBottom: spacing.sm }}>
              Nenhum cartão cadastrado
            </Text>
            <Text variant="body" color={colors.secondary} style={{ textAlign: "center", marginBottom: spacing.xl }}>
              Cadastre seus cartões para ter um controle individual melhor.
            </Text>
            <Button label="Cadastrar Cartão" onPress={() => router.push("/cartoes/novo")} />
          </View>
        ) : (
          <FlatList
            data={filteredCartoes}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <CardItem 
                item={item} 
                onPress={() => {
                  setSelectedCardId(item.id);
                  setIsPasswordModalVisible(true);
                }} 
              />
            )}
            ListEmptyComponent={
              <View style={{ alignItems: "center", paddingVertical: spacing.xl }}>
                <Ionicons 
                  name={filter === "inativos" ? "card-outline" : "add-circle-outline"} 
                  size={48} 
                  color={colors.border} 
                  style={{ marginBottom: spacing.sm }} 
                />
                <Text variant="body" color={colors.secondary} style={{ textAlign: "center" }}>
                  {filter === "inativos" 
                    ? "Você não possui nenhum cartão inativo." 
                    : "Você não possui cartões ativos no momento.\nCadastre um novo ou reative algum dos inativos."}
                </Text>
              </View>
            }
            ListFooterComponent={
              <View style={{ marginTop: spacing.md, marginBottom: spacing.xl }}>
                <Button 
                  label="Cadastrar Novo Cartão" 
                  onPress={() => router.push("/cartoes/novo")}
                />
              </View>
            }
          />
        )}

        <EditOptionsModal 
          visible={isBankModalVisible}
          onClose={() => setIsBankModalVisible(false)}
          tipo="banco"
          opcoes={referencias?.bancos || []}
        />
      </View>

      <PasswordPromptModal 
        visible={isPasswordModalVisible}
        onClose={() => {
          setIsPasswordModalVisible(false);
          setSelectedCardId(null);
        }}
        onSuccess={() => {
          setIsPasswordModalVisible(false);
          if (selectedCardId) {
            router.push(`/cartoes/${selectedCardId}`);
            setSelectedCardId(null);
          }
        }}
      />
    </Screen>
  );
}

function CardItem({ item, onPress }: { item: Cartao; onPress: () => void }) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const isInactive = item.isActive === false;
  const cardBackgroundColor = isInactive ? "#B0B0B0" : (item.color || colors.card);
  const colorText = isInactive ? "#FFFFFF" : (item.color ? "#FFF" : colors.text);
  const colorSecondary = isInactive ? "rgba(255,255,255,0.7)" : (item.color ? "rgba(255,255,255,0.7)" : colors.secondary);

  return (
    <View style={{ 
      marginBottom: spacing.md,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <Card style={[styles.card, { backgroundColor: cardBackgroundColor, paddingBottom: 0, overflow: "hidden" }]}>
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Pressable onPress={onPress} style={styles.cardHeader}>
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
            {item.bank.logo && (
              <Image 
                source={{ uri: item.bank.logo }} 
                style={{ width: 40, height: 40, borderRadius: 8, resizeMode: "contain" }} 
              />
            )}
            <View>
              <Text variant="headline" style={{ color: colorText, fontFamily: "HankenBold", fontSize: 20 }}>{item.bank.name}</Text>
              {item.nickname !== item.bank.name && (
                <Text variant="caption" style={{ color: colorSecondary }}>{item.nickname}</Text>
              )}
            </View>
          </View>
          
          <View style={{ alignItems: "flex-end", justifyContent: "flex-start" }}>
            <Ionicons name="card" size={24} color={colorText} />
            {!isExpanded && (
              <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                <Text variant="caption" style={{ color: colorSecondary, fontFamily: "HankenBold" }}>
                  {item.cardNumber ? `**** ${item.cardNumber.slice(-4)}` : "****"}
                </Text>
                <View style={{ 
                  flexDirection: "row", 
                  alignItems: "center", 
                  marginTop: 6, 
                  gap: 4, 
                  backgroundColor: "#FFFFFF",
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 12
                }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: item.isActive !== false ? colors.success : colors.error }} />
                  <Text style={{ fontSize: 9, color: item.isActive !== false ? colors.success : colors.error, textTransform: "uppercase", fontFamily: "HankenBold" }}>
                    {item.isActive !== false ? "Ativo" : "Inativo"}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </Pressable>
        
        {isExpanded && (
          <Pressable onPress={onPress}>
            <View style={[styles.cardDetails, { marginTop: spacing.xl }]}>
              <View>
                <Text variant="caption" style={{ color: colorSecondary }}>Titular</Text>
                <Text variant="body" style={{ color: colorText }}>{item.holderName || "NÃO INFORMADO"}</Text>
              </View>
            </View>

            <View style={[styles.cardDetails, { marginTop: spacing.md }]}>
              <View>
                <Text variant="caption" style={{ color: colorSecondary }}>Número do Cartão</Text>
                <View style={{ marginTop: 2, paddingVertical: 4 }}>
                  <Text variant="body" style={{ color: colorText }}>
                    {item.cardNumber ? `**** **** **** ${item.cardNumber.slice(-4)}` : "****"}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text variant="caption" style={{ color: colorSecondary }}>Validade</Text>
                <Text variant="body" style={{ color: colorText }}>{item.expiration || "--/--"}</Text>
              </View>
            </View>
            
            <View style={[styles.cardFooter, { borderTopColor: item.color ? "rgba(255,255,255,0.1)" : colors.border }]}>
              <Text variant="caption" style={{ color: colorSecondary }}>
                {item.type ? `${item.type} • ` : ""}Vencimento: Dia {item.dueDay} (Fechamento: Dia {item.closingDay})
              </Text>
            </View>
          </Pressable>
        )}

        <Pressable 
          onPress={() => setIsExpanded(!isExpanded)}
          style={{ paddingVertical: spacing.sm, alignItems: "center", borderTopWidth: isExpanded ? 0 : 1, borderTopColor: item.color ? "rgba(255,255,255,0.1)" : colors.border, marginTop: isExpanded ? 0 : spacing.sm }}
        >
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color={colorSecondary} />
        </Pressable>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  list: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
});
