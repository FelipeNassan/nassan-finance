import Constants from "expo-constants";
import { Platform } from "react-native";

// Porta do backend Next.js
const PORTA_API = 3000;

// URL do backend. Em dev, deriva do host do Metro (mesmo IP da LAN),
// trocando a porta para a do Next.js — assim o celular físico alcança o PC
// sem precisar hardcodar o IP. Em produção, usar EXPO_PUBLIC_API_URL.
function resolverBaseUrl(): string {
  const explicita = process.env.EXPO_PUBLIC_API_URL;
  if (explicita) return explicita;

  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    "";
  const host = hostUri.split(":")[0];

  if (host) return `http://${host}:${PORTA_API}`;

  // Fallback do emulador Android — audit-ok: 10.0.2.2 é alias padrão do emulador p/ localhost, não IP interno
  if (Platform.OS === "android") return `http://10.0.2.2:${PORTA_API}`;
  return `http://localhost:${PORTA_API}`;
}

export const API_BASE_URL = resolverBaseUrl();
