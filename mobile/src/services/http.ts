import { API_BASE_URL } from "@/constants/config";
import { tokenStore } from "./token-store";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Uma renovação de token por vez: chamadas concorrentes compartilham a mesma
// promessa em vez de disparar vários refresh.
let refreshEmAndamento: Promise<boolean> | null = null;

async function renovarToken(): Promise<boolean> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return false;

  if (!refreshEmAndamento) {
    refreshEmAndamento = (async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: refresh }),
        });
        if (!resp.ok) {
          await tokenStore.limpar();
          return false;
        }
        const dados = await resp.json();
        await tokenStore.definir(dados.accessToken, dados.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshEmAndamento = null;
      }
    })();
  }
  return refreshEmAndamento;
}

// Cliente HTTP: injeta o access token e, no 401, tenta renovar uma vez e repete.
export async function request<T>(
  path: string,
  init?: RequestInit,
  tentarRenovar = true
): Promise<T> {
  const access = tokenStore.getAccess();
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(access ? { Authorization: `Bearer ${access}` } : {}),
      ...init?.headers,
    },
  });

  if (resp.status === 401 && tentarRenovar && tokenStore.getRefresh()) {
    const ok = await renovarToken();
    if (ok) return request<T>(path, init, false);
  }

  if (!resp.ok) {
    let mensagem = `Erro ${resp.status}`;
    try {
      const corpo = await resp.json();
      if (corpo?.error) mensagem = corpo.error;
    } catch {
      // corpo não-JSON
    }
    throw new ApiError(mensagem, resp.status);
  }

  // 204 (sem corpo) → objeto vazio
  if (resp.status === 204) return {} as T;
  return resp.json() as Promise<T>;
}
