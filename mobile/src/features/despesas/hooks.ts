import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/services/api";
import type { NovaDespesa } from "@/types";

export const chaves = {
  resumo: ["resumo"] as const,
  despesas: ["despesas"] as const,
  referencias: ["referencias"] as const,
};

export function useResumo() {
  return useQuery({ queryKey: chaves.resumo, queryFn: api.resumo });
}

export function useDespesas() {
  return useQuery({ queryKey: chaves.despesas, queryFn: api.despesas });
}

export function useReferencias() {
  return useQuery({
    queryKey: chaves.referencias,
    queryFn: api.referencias,
    staleTime: 1000 * 60 * 10,
  });
}

function invalidarListas(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: chaves.resumo });
  qc.invalidateQueries({ queryKey: chaves.despesas });
}

export function useCriarDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovaDespesa) => api.criarDespesa(dados),
    onSuccess: () => invalidarListas(qc),
  });
}

export function useAtualizarDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dados }: { id: number; dados: NovaDespesa }) =>
      api.atualizarDespesa(id, dados),
    onSuccess: () => invalidarListas(qc),
  });
}

export function useApagarDespesa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: number; motivo: string }) =>
      api.apagarDespesa(id, motivo),
    onSuccess: () => invalidarListas(qc),
  });
}

// ==========================================
// REFERÊNCIAS (CATEGORIAS E FORMAS DE PAGAMENTO)
// ==========================================

export function useCriarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { name: string; order?: number }) => api.criarCategoria(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export function useDeletarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletarCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export function useRestaurarCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.restaurarCategoria(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export function useReordenarCategorias() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: number; order: number }[]) => api.reordenarCategorias(updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export function useCriarPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { name: string; order?: number }) => api.criarPagamento(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export function useDeletarPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletarPagamento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export function useRestaurarPagamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.restaurarPagamento(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}

export const useCriarBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { name: string; logo?: string | null }) => api.criarBanco(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.referencias });
    },
  });
};

export const useAtualizarBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: { id: number; name: string; logo?: string | null }) => 
      api.atualizarBanco(dados.id, { name: dados.name, logo: dados.logo }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.referencias });
      qc.invalidateQueries({ queryKey: ["cartoes"] });
    },
  });
};

export const useDeletarBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deletarBanco(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.referencias });
    },
  });
};

export const useRestaurarBanco = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.atualizarBanco(id, { restore: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: chaves.referencias });
    },
  });
};

export function useReordenarPagamentos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (updates: { id: number; order: number }[]) => api.reordenarPagamentos(updates),
    onSuccess: () => qc.invalidateQueries({ queryKey: chaves.referencias }),
  });
}
