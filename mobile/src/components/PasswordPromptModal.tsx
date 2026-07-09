import React, { useState } from "react";
import { Modal, View, StyleSheet, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Text, Field, Button } from "@/components";
import { colors, radius, spacing } from "@/theme";
import { api } from "@/services/api";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
}

export function PasswordPromptModal({ visible, onClose, onSuccess, title = "Digite sua senha" }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleVerify = async () => {
    if (!password.trim()) {
      setError("A senha é obrigatória.");
      return;
    }
    
    setError("");
    setIsLoading(true);
    try {
      await api.verificarSenha(password);
      setPassword(""); // Limpa para a próxima vez
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Senha incorreta.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    onClose();
    // Redireciona para a tela de recuperar senha passando o returnTo
    router.push({ pathname: "/recuperar", params: { returnTo: "/cartoes" } });
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.overlay} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="lock-closed" size={24} color={colors.primary} />
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.secondary} />
            </Pressable>
          </View>
          
          <Text variant="title" style={{ marginBottom: spacing.xs }}>{title}</Text>
          <Text variant="body" color={colors.secondary} style={{ marginBottom: spacing.lg }}>
            Para sua segurança, informe sua senha de acesso para visualizar e editar os dados do cartão.
          </Text>

          <Field
            placeholder="Sua senha"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (error) setError("");
            }}
            autoFocus
            rightIcon={showPassword ? "eye-off" : "eye"}
            onRightPress={() => setShowPassword(!showPassword)}
          />

          {!!error && (
            <Text variant="caption" color={colors.error} style={{ marginTop: spacing.sm, textAlign: "center" }}>
              {error}
            </Text>
          )}

          <View style={{ marginTop: spacing.xl, width: "100%" }}>
            <Button
              label={isLoading ? "Verificando..." : "Confirmar"}
              onPress={handleVerify}
              disabled={isLoading || !password.trim()}
            />
          </View>

          <Pressable onPress={handleForgotPassword} style={{ marginTop: spacing.md, alignSelf: "center", paddingVertical: spacing.xs }}>
            <Text variant="body" color={colors.primary}>Esqueci minha senha</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  content: {
    backgroundColor: colors.surface,
    width: "100%",
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(117,90,38,0.1)",
    justifyContent: "center",
    alignItems: "center",
  }
});
