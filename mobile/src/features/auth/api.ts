import { API_BASE_URL } from "@/constants/config";
import { request, ApiError } from "@/services/http";

export interface Usuario {
  id: string;
  nome: string;
  primeiroNome: string;
  email: string | null;
  telefone: string | null;
  avatar: string | null;
  criadoEm: string;
}

export interface Credenciais {
  accessToken: string;
  refreshToken: string;
}

// Chamada de auth com token EXPLÍCITO (cadastro usa um token próprio, não o
// da sessão) ou sem token (login, refresh, reset). Não passa pelo refresh
// automático do http.request de propósito.
async function chamar<T>(
  path: string,
  opts: { metodo?: string; body?: unknown; token?: string } = {}
): Promise<T> {
  const resp = await fetch(`${API_BASE_URL}${path}`, {
    method: opts.metodo ?? (opts.body !== undefined ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(opts.token ? { Authorization: `Bearer ${opts.token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!resp.ok) {
    let mensagem = `Erro ${resp.status}`;
    try {
      const corpo = await resp.json();
      if (corpo?.error) mensagem = corpo.error;
    } catch {
      /* corpo não-JSON */
    }
    throw new ApiError(mensagem, resp.status);
  }
  if (resp.status === 204) return {} as T;
  return resp.json() as Promise<T>;
}

export const authApi = {
  // Sessão usa o access token da sessão (via http.request, com refresh)
  sessao: () => request<Usuario>("/api/auth/sessao"),
  atualizarPerfil: (dados: { firstName: string; lastName: string; email: string; phone: string; avatar?: string }) =>
    request<{ success: boolean }>("/api/auth/sessao", {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),

  login: (email: string, senha: string) =>
    chamar<Credenciais>("/api/auth/login", { body: { email, senha } }),

  logout: (refreshToken: string) =>
    chamar<{ ok: boolean }>("/api/auth/logout", { body: { refreshToken } }),

  // --- Cadastro em etapas (usam o cadastroToken retornado na etapa 1) ---
  cadastroDados: (dados: {
    nome: string;
    sobrenome: string;
    nascimento: string;
  }) => chamar<{ cadastroToken: string }>("/api/auth/cadastro", { body: dados }),

  cadastroTelefone: (token: string, ddd: string, numero: string) =>
    chamar<{ enviado: boolean; expiraEmSegundos: number; devCodigo?: string }>(
      "/api/auth/cadastro/telefone",
      { token, body: { ddd, numero } }
    ),

  cadastroTelefoneVerificar: (token: string, codigo: string) =>
    chamar<{ verificado: boolean }>("/api/auth/cadastro/telefone/verificar", {
      token,
      body: { codigo },
    }),

  cadastroEmail: (token: string, email: string) =>
    chamar<{ enviado: boolean; expiraEmSegundos: number; devCodigo?: string }>(
      "/api/auth/cadastro/email",
      { token, body: { email } }
    ),

  cadastroEmailVerificar: (token: string, codigo: string) =>
    chamar<{ verificado: boolean }>("/api/auth/cadastro/email/verificar", {
      token,
      body: { codigo },
    }),

  cadastroSenha: (token: string, senha: string) =>
    chamar<Credenciais>("/api/auth/cadastro/senha", { token, body: { senha } }),

  // --- Recuperação de senha (por código) ---
  senhaEsquecida: (email: string) =>
    chamar<{ enviado: boolean; expiraEmSegundos: number; devCodigo?: string }>(
      "/api/auth/senha/esquecida",
      { body: { email } }
    ),

  senhaCodigo: (email: string, codigo: string) =>
    chamar<{ resetToken: string }>("/api/auth/senha/codigo", {
      body: { email, codigo },
    }),

  senhaRedefinir: (resetToken: string, novaSenha: string) =>
    chamar<{ ok: boolean }>("/api/auth/senha/redefinir", {
      body: { resetToken, novaSenha },
    }),
};
