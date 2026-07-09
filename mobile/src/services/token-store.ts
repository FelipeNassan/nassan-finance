import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// Guarda os tokens: SecureStore no aparelho (keychain/keystore),
// localStorage na Web (SecureStore não existe lá). Cache em memória para
// leitura síncrona a cada requisição.
const CHAVE_ACCESS = "fortn.accessToken";
const CHAVE_REFRESH = "fortn.refreshToken";
const web = Platform.OS === "web";

let accessMem: string | null = null;
let refreshMem: string | null = null;
const ouvintesLimpar: (() => void)[] = [];

async function persistir(chave: string, valor: string | null) {
  if (web) {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, valor);
    return;
  }
  if (valor === null) await SecureStore.deleteItemAsync(chave);
  else await SecureStore.setItemAsync(chave, valor);
}

async function recuperar(chave: string): Promise<string | null> {
  if (web) return localStorage.getItem(chave);
  return SecureStore.getItemAsync(chave);
}

export const tokenStore = {
  getAccess: () => accessMem,
  getRefresh: () => refreshMem,

  async hidratar() {
    [accessMem, refreshMem] = await Promise.all([
      recuperar(CHAVE_ACCESS),
      recuperar(CHAVE_REFRESH),
    ]);
  },

  async definir(access: string, refresh: string) {
    accessMem = access;
    refreshMem = refresh;
    await Promise.all([
      persistir(CHAVE_ACCESS, access),
      persistir(CHAVE_REFRESH, refresh),
    ]);
  },

  async limpar() {
    accessMem = null;
    refreshMem = null;
    await Promise.all([
      persistir(CHAVE_ACCESS, null),
      persistir(CHAVE_REFRESH, null),
    ]);
    ouvintesLimpar.forEach((cb) => cb());
  },

  // Notifica quando os tokens são limpos (logout ou refresh que falhou),
  // para o store de auth reagir e mandar o usuário ao login.
  aoLimpar(cb: () => void) {
    ouvintesLimpar.push(cb);
  },
};
