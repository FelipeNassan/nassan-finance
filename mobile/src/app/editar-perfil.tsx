import { useState } from "react";
import { View, StyleSheet, Pressable, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Text, Field, Button } from "@/components";
import { useAuth } from "@/features/auth/store";
import { authApi } from "@/features/auth/api";
import { useToast } from "@/store/toast";
import { colors, spacing, radius } from "@/theme";

export default function EditarPerfil() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mostrarToast = useToast((s) => s.mostrar);
  
  const usuario = useAuth((s) => s.usuario);
  const hidratar = useAuth((s) => s.hidratar);

  const [firstName, setFirstName] = useState(usuario?.primeiroNome || "");
  const [lastName, setLastName] = useState(usuario?.nome.replace(usuario?.primeiroNome || "", "").trim() || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [phone, setPhone] = useState(usuario?.telefone || "");
  const [avatar, setAvatar] = useState(usuario?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.1,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setAvatar("data:image/jpeg;base64," + result.assets[0].base64);
      }
    } catch (e) {
      console.error("Erro no ImagePicker:", e);
      mostrarToast("Erro ao abrir a galeria", "erro");
    }
  };

  const handleSalvar = async () => {
    if (!firstName.trim()) {
      mostrarToast("O nome é obrigatório", "erro");
      return;
    }
    
    setIsLoading(true);
    try {
      await authApi.atualizarPerfil({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
      });
      await hidratar(); // Refresh user data
      mostrarToast("Perfil atualizado com sucesso", "sucesso");
      router.back();
    } catch (e) {
      console.error("Erro no salvar perfil:", e);
      mostrarToast(e instanceof Error ? e.message : "Erro ao atualizar perfil", "erro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.flex} 
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.flex, { paddingTop: spacing.md }]}>
        {/* Header do modal */}
        <View style={styles.puxador} />
        <View style={[styles.header, { marginTop: Platform.OS === 'android' ? insets.top : 0 }]}>
          <Text variant="label">Editar Perfil</Text>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.conteudo,
            { paddingTop: spacing.xl, paddingBottom: insets.bottom + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: "center", marginBottom: spacing.xl }}>
            <Pressable onPress={pickImage} style={styles.avatarContainer}>
              {avatar ? (
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="camera" size={32} color={colors.primary} />
                </View>
              )}
              <View style={styles.avatarEditIcon}>
                <Ionicons name="pencil" size={12} color={colors.white} />
              </View>
            </Pressable>
            <Text variant="caption" color={colors.secondary} style={{ marginTop: spacing.sm }}>
              Toque para alterar a foto
            </Text>
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Nome</Text>
            <Field
              placeholder="Seu nome"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Sobrenome</Text>
            <Field
              placeholder="Seu sobrenome"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>

          <View style={{ marginBottom: spacing.md }}>
            <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>E-mail</Text>
            <Field
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={{ marginBottom: spacing.lg }}>
            <Text variant="caption" color={colors.secondary} style={{ marginBottom: spacing.xs }}>Telefone</Text>
            <Field
              placeholder="(11) 99999-9999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Button
            label={isLoading ? "Salvando..." : "Salvar Alterações"}
            onPress={handleSalvar}
            disabled={isLoading}
            style={{ marginTop: spacing.md }}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  puxador: {
    width: 32,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: radius.full,
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
  fechar: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  conteudo: { paddingHorizontal: spacing.xl },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarEditIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background,
  }
});
