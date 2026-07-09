import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  TextInput,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Text, Button } from "@/components";
import { colors, radius, spacing } from "@/theme";
import {
  useCriarCategoria,
  useDeletarCategoria,
  useReordenarCategorias,
  useCriarPagamento,
  useDeletarPagamento,
  useReordenarPagamentos,
  useCriarBanco,
  useDeletarBanco,
  useAtualizarBanco,
  useRestaurarCategoria,
  useRestaurarPagamento,
  useRestaurarBanco,
} from "@/features/despesas/hooks";

interface Opcao {
  id: number;
  name: string;
  order?: number;
  logo?: string | null;
  isActive?: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tipo: "categoria" | "pagamento" | "banco";
  opcoes: Opcao[];
}

export function EditOptionsModal({ visible, onClose, tipo, opcoes }: Props) {
  const insets = useSafeAreaInsets();
  
  const [items, setItems] = useState<Opcao[]>([]);
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoBancoLogo, setNovoBancoLogo] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editingItemNome, setEditingItemNome] = useState("");
  const [editingBancoLogo, setEditingBancoLogo] = useState<string | null>(null);

  const criarCategoria = useCriarCategoria();
  const deletarCategoria = useDeletarCategoria();
  const reordenarCategorias = useReordenarCategorias();

  const criarPagamento = useCriarPagamento();
  const deletarPagamento = useDeletarPagamento();
  const reordenarPagamentos = useReordenarPagamentos();

  const criarBanco = useCriarBanco();
  const deletarBanco = useDeletarBanco();
  const atualizarBanco = useAtualizarBanco();

  const restaurarCategoria = useRestaurarCategoria();
  const restaurarPagamento = useRestaurarPagamento();
  const restaurarBanco = useRestaurarBanco();

  useEffect(() => {
    // Sort items by order, then by name
    const sorted = [...opcoes].sort((a, b) => {
      if (a.order !== b.order) return (a.order || 0) - (b.order || 0);
      return a.name.localeCompare(b.name);
    });
    setItems(sorted);
  }, [opcoes]);

  function handleSaveOrder(data: Opcao[]) {
    setItems(data);
    const updates = data.map((item, index) => ({ id: item.id, order: index }));
    
    if (tipo === "categoria") {
      reordenarCategorias.mutate(updates);
    } else if (tipo === "pagamento") {
      reordenarPagamentos.mutate(updates);
    }
  }

  function handleAdd() {
    if (!novoItemNome.trim()) return;
    
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order || 0)) : 0;
    
    if (tipo === "categoria") {
      criarCategoria.mutate({ name: novoItemNome.trim(), order: maxOrder + 1 }, {
        onSuccess: () => {
          setNovoItemNome("");
          setIsAdding(false);
        },
        onError: (err: Error) => {
          Alert.alert("Erro", err.message || "Não foi possível adicionar.");
        }
      });
    } else if (tipo === "pagamento") {
      criarPagamento.mutate({ name: novoItemNome.trim(), order: maxOrder + 1 }, {
        onSuccess: () => {
          setNovoItemNome("");
          setIsAdding(false);
        },
        onError: (err: Error) => {
          Alert.alert("Erro", err.message || "Não foi possível adicionar.");
        }
      });
    } else {
      criarBanco.mutate({ name: novoItemNome.trim(), logo: novoBancoLogo }, {
        onSuccess: () => {
          setNovoItemNome("");
          setNovoBancoLogo(null);
          setIsAdding(false);
        },
        onError: (err: Error) => {
          Alert.alert("Erro", err.message || "Não foi possível adicionar.");
        }
      });
    }
  }

  function handleEditSave() {
    if (!editingItemNome.trim() || editingItemId === null) return;
    
    if (tipo === "banco") {
      atualizarBanco.mutate({ id: editingItemId, name: editingItemNome.trim(), logo: editingBancoLogo }, {
        onSuccess: () => {
          setEditingItemId(null);
          setEditingItemNome("");
          setEditingBancoLogo(null);
        },
        onError: (err: Error) => {
          Alert.alert("Erro", err.message || "Não foi possível atualizar.");
        }
      });
    }
  }

  function handleDelete(id: number, name: string) {
    Alert.alert(
      "Excluir item",
      `Tem certeza que deseja excluir "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            if (tipo === "categoria") {
              deletarCategoria.mutate(id);
            } else if (tipo === "pagamento") {
              deletarPagamento.mutate(id);
            } else {
              deletarBanco.mutate(id);
            }
          },
        },
      ]
    );
  }

  function handleRestore(id: number, name: string) {
    Alert.alert(
      "Restaurar item",
      `Deseja restaurar "${name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Restaurar",
          style: "default",
          onPress: () => {
            if (tipo === "categoria") {
              restaurarCategoria.mutate(id);
            } else if (tipo === "pagamento") {
              restaurarPagamento.mutate(id);
            } else {
              restaurarBanco.mutate(id);
            }
          },
        },
      ]
    );
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<Opcao>) => {
    return (
      <ScaleDecorator>
        <Pressable 
          style={[styles.item, isActive && styles.itemActive]}
          onPress={() => {
            if (tipo === "banco") {
              setEditingItemId(item.id);
              setEditingItemNome(item.name);
              setEditingBancoLogo(item.logo || null);
            }
          }}
        >
          {editingItemId === item.id ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
              <Pressable
                onPress={async () => {
                  try {
                    const result = await ImagePicker.launchImageLibraryAsync({
                      mediaTypes: ["images"],
                      allowsEditing: true,
                      aspect: [1, 1],
                      quality: 0.1,
                      base64: true,
                    });
                    if (!result.canceled && result.assets && result.assets[0].base64) {
                      setEditingBancoLogo("data:image/jpeg;base64," + result.assets[0].base64);
                    }
                  } catch (e) {
                    console.error(e);
                  }
                }}
                style={[
                  styles.logoPicker,
                  !editingBancoLogo && { borderWidth: 1, borderColor: colors.border, width: 36, height: 36 }
                ]}
              >
                {editingBancoLogo ? (
                  <Image source={{ uri: editingBancoLogo }} style={styles.logoImage} />
                ) : (
                  <Ionicons name="camera-outline" size={16} color={colors.secondary} />
                )}
              </Pressable>
              <TextInput
                style={[styles.input, { flex: 1, height: 40, paddingVertical: 0 }]}
                value={editingItemNome}
                onChangeText={setEditingItemNome}
                onSubmitEditing={handleEditSave}
                autoFocus
              />
              <Pressable onPress={() => setEditingItemId(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={colors.secondary} />
              </Pressable>
              <Pressable onPress={handleEditSave} style={{ padding: 4 }}>
                <Ionicons name="checkmark" size={20} color={colors.primary} />
              </Pressable>
            </View>
          ) : (
            <View style={styles.itemLeft}>
              {item.isActive === false ? (
                <Pressable
                  onPress={() => handleRestore(item.id, item.name)}
                  hitSlop={12}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="refresh-outline" size={20} color={colors.success} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => handleDelete(item.id, item.name)}
                  hitSlop={12}
                  style={styles.deleteBtn}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error} />
                </Pressable>
              )}
              {tipo === "banco" && item.logo && (
                <Image source={{ uri: item.logo }} style={{ width: 24, height: 24, borderRadius: 4, marginRight: 8, opacity: item.isActive === false ? 0.5 : 1 }} />
              )}
              <Text variant="body" style={item.isActive === false ? { color: colors.secondary, textDecorationLine: "line-through" } : {}}>{item.name}</Text>
            </View>
          )}
          
          {tipo !== "banco" && editingItemId !== item.id && (
            <Pressable
              onLongPress={drag}
              delayLongPress={150}
              hitSlop={12}
              style={styles.dragBtn}
            >
              <Ionicons name="menu" size={24} color={colors.secondary} />
            </Pressable>
          )}
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <GestureHandlerRootView style={styles.container}>
        <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + spacing.md : spacing.lg }]}>
          <View style={styles.headerTop}>
            <Text variant="title">Editar {tipo === "categoria" ? "Categorias" : tipo === "pagamento" ? "Pagamentos" : "Bancos"}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text variant="body" color={colors.primary}>Concluir</Text>
            </Pressable>
          </View>
          {tipo !== "banco" && (
            <Text variant="caption" color={colors.secondary}>
              Segure os três traços para reordenar.
            </Text>
          )}
        </View>

        <DraggableFlatList
          data={items}
          onDragEnd={({ data }) => handleSaveOrder(data)}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + spacing.xl }]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <View style={styles.footer}>
              {isAdding ? (
                <View style={styles.addForm}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1 }}>
                    {tipo === "banco" && (
                      <Pressable
                        onPress={async () => {
                          try {
                            const result = await ImagePicker.launchImageLibraryAsync({
                              mediaTypes: ["images"],
                              allowsEditing: true,
                              aspect: [1, 1],
                              quality: 0.1,
                              base64: true,
                            });
                            if (!result.canceled && result.assets && result.assets[0].base64) {
                              setNovoBancoLogo("data:image/jpeg;base64," + result.assets[0].base64);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        style={[
                          styles.logoPicker,
                          !novoBancoLogo && { borderWidth: 1, borderColor: colors.border }
                        ]}
                      >
                        {novoBancoLogo ? (
                          <Image source={{ uri: novoBancoLogo }} style={styles.logoImage} />
                        ) : (
                          <Ionicons name="camera-outline" size={20} color={colors.secondary} />
                        )}
                      </Pressable>
                    )}
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={novoItemNome}
                      onChangeText={setNovoItemNome}
                      placeholder="Nome..."
                      placeholderTextColor={colors.secondary}
                      onSubmitEditing={handleAdd}
                      autoFocus
                    />
                  </View>
                  <View style={styles.addActions}>
                    <Pressable onPress={() => setIsAdding(false)} style={styles.btnIcon}>
                      <Ionicons name="close" size={24} color={colors.secondary} />
                    </Pressable>
                    <Pressable onPress={handleAdd} style={styles.btnIcon}>
                      <Ionicons name="checkmark" size={24} color={colors.primary} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Button
                  label="Adicionar Novo"
                  icon="add"
                  onPress={() => {
                    setIsAdding(true);
                    setNovoItemNome("");
                    setNovoBancoLogo(null);
                  }}
                  variant="outline"
                />
              )}
            </View>
          }
        />
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  list: {
    padding: spacing.lg,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemActive: {
    backgroundColor: "rgba(117,90,38,0.05)",
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  deleteBtn: {
    padding: spacing.xs,
    backgroundColor: "rgba(220, 38, 38, 0.1)",
    borderRadius: radius.sm,
  },
  dragBtn: {
    padding: spacing.xs,
  },
  footer: {
    marginTop: spacing.md,
  },
  addForm: {
    gap: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.onSurface,
  },
  addActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  logoPicker: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  btnIcon: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
});
