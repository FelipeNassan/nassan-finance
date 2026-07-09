import { create } from "zustand";
import { tokenStore } from "@/services/token-store";
import { authApi, type Usuario } from "./api";

type StatusAuth = "carregando" | "autenticado" | "deslogado";

interface AuthState {
  status: StatusAuth;
  usuario: Usuario | null;
  hidratar: () => Promise<void>;
  aplicarCredenciais: (access: string, refresh: string) => Promise<void>;
  sair: () => Promise<void>;
  marcarDeslogado: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  status: "carregando",
  usuario: null,

  // Chamado uma vez na inicialização: carrega tokens e consulta a sessão.
  // Com AUTH_DISABLED o backend devolve o dev-user mesmo sem token.
  hidratar: async () => {
    await tokenStore.hidratar();
    try {
      const usuario = await authApi.sessao();
      set({ status: "autenticado", usuario });
    } catch {
      set({ status: "deslogado", usuario: null });
    }
  },

  aplicarCredenciais: async (access, refresh) => {
    await tokenStore.definir(access, refresh);
    const usuario = await authApi.sessao();
    set({ status: "autenticado", usuario });
  },

  sair: async () => {
    const refresh = tokenStore.getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      /* logout é best-effort */
    }
    await tokenStore.limpar();
    set({ status: "deslogado", usuario: null });
  },

  marcarDeslogado: () => set({ status: "deslogado", usuario: null }),
}));

// Se os tokens forem limpos por fora (refresh falhou), reflete no estado.
tokenStore.aoLimpar(() => {
  if (useAuth.getState().status === "autenticado") {
    useAuth.getState().marcarDeslogado();
  }
});
