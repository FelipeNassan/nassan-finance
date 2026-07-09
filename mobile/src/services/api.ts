import { request, ApiError } from "./http";
import type { Resumo, Despesa, Referencias, NovaDespesa, Cartao, NovoCartao } from "@/types";

export const api = {
  resumo: () => request<Resumo>("/api/resumo"),
  despesas: () => request<Despesa[]>("/api/despesas"),
  referencias: () => request<Referencias>("/api/referencias"),
  cartoes: () => request<Cartao[]>("/api/cartoes"),
  criarCartao: (dados: NovoCartao) =>
    request<Cartao>("/api/cartoes", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  cartao: (id: number) => request<Cartao>(`/api/cartoes/${id}`),
  atualizarCartao: (id: number, dados: NovoCartao) =>
    request<Cartao>(`/api/cartoes/${id}`, {
      method: "PUT",
      body: JSON.stringify(dados),
    }),
  deletarCartao: (id: number) =>
    request<{ ok: boolean }>(`/api/cartoes/${id}`, { method: "DELETE" }),
  verificarSenha: (senha: string) =>
    request<{ success: boolean }>("/api/auth/verificar-senha", {
      method: "POST",
      body: JSON.stringify({ senha }),
    }),
  criarDespesa: (dados: NovaDespesa) =>
    request<{ id: number }>("/api/despesas", {
      method: "POST",
      body: JSON.stringify(dados),
    }),
  atualizarDespesa: (id: number, dados: NovaDespesa) =>
    request<{ id: number }>(`/api/despesas/${id}`, {
      method: "PATCH",
      body: JSON.stringify(dados),
    }),
  apagarDespesa: (id: number, motivo: string) =>
    request<{ ok: boolean }>(`/api/despesas/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ motivo }),
    }),

  // Referências
  criarCategoria: (dados: { name: string; order?: number }) =>
    request<{ id: number; name: string }>("/api/categorias", { method: "POST", body: JSON.stringify(dados) }),
  deletarCategoria: (id: number) =>
    request<{ ok: boolean }>(`/api/categorias/${id}`, { method: "DELETE" }),
  restaurarCategoria: (id: number) =>
    request<{ ok: boolean }>(`/api/categorias/${id}`, { method: "PUT", body: JSON.stringify({ restore: true }) }),
  reordenarCategorias: (updates: { id: number; order: number }[]) =>
    request<{ ok: boolean }>("/api/categorias", { method: "PUT", body: JSON.stringify(updates) }),

  criarPagamento: (dados: { name: string; order?: number }) =>
    request<{ id: number; name: string }>("/api/pagamentos", { method: "POST", body: JSON.stringify(dados) }),
  deletarPagamento: (id: number) =>
    request<{ ok: boolean }>(`/api/pagamentos/${id}`, { method: "DELETE" }),
  restaurarPagamento: (id: number) =>
    request<{ ok: boolean }>(`/api/pagamentos/${id}`, { method: "PUT", body: JSON.stringify({ restore: true }) }),
  reordenarPagamentos: (updates: { id: number; order: number }[]) =>
    request<{ ok: boolean }>("/api/pagamentos", { method: "PUT", body: JSON.stringify(updates) }),

  criarBanco: (dados: { name: string; logo?: string | null }) =>
    request<{ id: number; name: string; logo: string | null }>("/api/bancos", { method: "POST", body: JSON.stringify(dados) }),
  atualizarBanco: (
    id: number,
    dados: { name?: string; logo?: string | null; restore?: boolean }
  ) =>
    request<{ ok: boolean }>(`/api/bancos/${id}`, { method: "PUT", body: JSON.stringify(dados) }),
  deletarBanco: (id: number) =>
    request<{ ok: boolean }>(`/api/bancos/${id}`, { method: "DELETE" }),
};

export { ApiError };
