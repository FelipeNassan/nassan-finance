import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/services/api";
import type { Cartao, NovoCartao } from "@/types";

export const cartoesChaves = {
  all: ["cartoes"] as const,
};

export function useCartoes() {
  return useQuery<Cartao[]>({
    queryKey: cartoesChaves.all,
    queryFn: () => api.cartoes(),
  });
}

export function useCriarCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dados: NovoCartao) => api.criarCartao(dados),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cartoesChaves.all });
    },
  });
}
