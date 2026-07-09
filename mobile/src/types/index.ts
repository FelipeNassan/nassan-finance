export interface CategoriaResumo {
  categoriaId: number;
  nome: string;
  valor: number;
}

export interface DespesaResumo {
  id: number;
  data: string;
  valor: number;
  descricao: string | null;
  categoria: string;
}

export interface PagamentoResumo {
  pagamentoId: number;
  nome: string;
  valor: number;
}

export interface SemanaResumo {
  nome: string;
  periodo: string;
  valor: number;
  percentDiff: number | null;
}

export interface Resumo {
  totalMes: number;
  totalGeral: number;
  mediaMensal?: number;
  lancamentos: number;
  porCategoria: CategoriaResumo[];
  porPagamento: PagamentoResumo[];
  porSemana: SemanaResumo[];
  recentes: DespesaResumo[];
}

export interface Despesa {
  id: number;
  data: string;
  valor: number;
  descricao: string | null;
  categoria: string;
  categoriaId: number;
  formaPagamento: string;
  formaPagamentoId: number;
  banco: string | null;
  bancoId: number | null;
  isDeleted?: boolean;
}

export interface Referencia {
  id: number;
  name: string;
  logo?: string | null;
  isActive?: boolean;
}

export interface Referencias {
  categorias: Referencia[];
  formasPagamento: Referencia[];
  bancos: Referencia[];
}

export interface Cartao {
  id: number;
  nickname: string;
  closingDay: number;
  dueDay: number;
  holderName?: string | null;
  brand?: string | null;
  cardNumber?: string | null;
  expiration?: string | null;
  type: string;
  limit?: number | null;
  color?: string | null;
  password?: string;
  isActive?: boolean;
  bank: {
    id: number;
    name: string;
    logo?: string | null;
  };
}

export interface NovoCartao {
  nickname: string;
  closingDay: number;
  dueDay: number;
  bankId: number;
  holderName?: string;
  brand?: string;
  cardNumber?: string;
  expiration?: string;
  type: string;
  limit?: number;
  color?: string;
  password?: string;
  isActive?: boolean;
}


export interface NovaDespesa {
  data: string;
  valor: number;
  descricao?: string | null;
  categoriaId: number;
  formaPagamentoId: number;
  bancoId?: number | null;
}
