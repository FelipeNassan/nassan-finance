import type { Despesa } from "@/types";

export type Ordenacao = "recentes" | "antigos" | "maior" | "menor";
export type Periodo = "tudo" | "mes" | "mesPassado" | "7dias";

export interface Filtros {
  ordenacao: Ordenacao;
  periodo: Periodo;
  categoria: string | null;
  formaPagamento: string | null;
  status: "todos" | "validos" | "apagados";
}

export const FILTROS_PADRAO: Filtros = {
  ordenacao: "recentes",
  periodo: "tudo",
  categoria: null,
  formaPagamento: null,
  status: "validos",
};

export const ROTULO_ORDENACAO: Record<Ordenacao, string> = {
  recentes: "Mais recentes",
  antigos: "Mais antigos",
  maior: "Maior valor",
  menor: "Menor valor",
};

export const ROTULO_PERIODO: Record<Periodo, string> = {
  tudo: "Tudo",
  mes: "Este mês",
  mesPassado: "Mês passado",
  "7dias": "Últimos 7 dias",
};

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

// Limites do período como strings YYYY-MM-DD (comparáveis lexicograficamente).
function limitesPeriodo(periodo: Periodo): { de: string; ate: string } | null {
  const hoje = new Date();
  if (periodo === "tudo") return null;
  if (periodo === "mes") {
    return { de: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: iso(hoje) };
  }
  if (periodo === "mesPassado") {
    return {
      de: iso(new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1)),
      ate: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 0)),
    };
  }
  // 7dias
  const de = new Date(hoje);
  de.setDate(de.getDate() - 6);
  return { de: iso(de), ate: iso(hoje) };
}

export function aplicarFiltros(lista: Despesa[], f: Filtros): Despesa[] {
  const lim = limitesPeriodo(f.periodo);

  const filtrada = lista.filter((d) => {
    // Status
    if (f.status === "validos" && d.isDeleted) return false;
    if (f.status === "apagados" && !d.isDeleted) return false;

    // Categoria
    if (f.categoria && d.categoria !== f.categoria) return false;
    // Pagamento
    if (f.formaPagamento && d.formaPagamento !== f.formaPagamento) return false;
    // Período
    if (lim && (d.data < lim.de || d.data > lim.ate)) return false;
    return true;
  });

  const ordenada = [...filtrada];
  ordenada.sort((a, b) => {
    switch (f.ordenacao) {
      case "maior":
        return b.valor - a.valor;
      case "menor":
        return a.valor - b.valor;
      case "antigos":
        return a.data < b.data ? -1 : a.data > b.data ? 1 : 0;
      default: // recentes
        return a.data > b.data ? -1 : a.data < b.data ? 1 : 0;
    }
  });

  return ordenada;
}

// Quantos filtros estão ativos (para o badge). Ordenação não conta como filtro.
export function contarFiltrosAtivos(f: Filtros): number {
  let n = 0;
  if (f.periodo !== "tudo") n++;
  if (f.categoria) n++;
  if (f.formaPagamento) n++;
  return n;
}
