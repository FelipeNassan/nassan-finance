import { prisma } from "@/lib/prisma";

export interface DespesaInput {
  data?: string;
  valor?: number;
  descricao?: string | null;
  categoriaId?: number;
  formaPagamentoId?: number;
  bancoId?: number | null;
}

type ValidacaoOk = {
  dados: {
    date: Date;
    amount: number;
    description: string | null;
    categoryId: number;
    paymentMethodId: number;
    bankId: number | null;
  };
};

export type Validacao = { erro: string } | ValidacaoOk;

// Validação compartilhada entre criar (POST) e editar (PATCH) despesa.
// Confere campos obrigatórios, valor, data no calendário e posse dos vínculos.
export async function validarDespesa(
  userId: string,
  body: DespesaInput
): Promise<Validacao> {
  const { data, valor, categoriaId, formaPagamentoId } = body;

  if (!data || !valor || !categoriaId || !formaPagamentoId) {
    return { erro: "Preencha todos os campos obrigatórios." };
  }
  if (!Number.isFinite(valor) || valor <= 0) {
    return { erro: "Valor inválido." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) {
    return { erro: "Data inválida." };
  }

  const [year, month, day] = data.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  const calendarDay = await prisma.calendarDay.findUnique({ where: { date } });
  if (!calendarDay) {
    return { erro: "Data fora do calendário suportado (apenas 2026 por ora)." };
  }

  const bankId = body.bancoId ?? null;

  const [categoria, formaPagamento, banco] = await Promise.all([
    prisma.expenseCategory.findFirst({ where: { id: categoriaId, userId } }),
    prisma.paymentMethod.findFirst({ where: { id: formaPagamentoId, userId } }),
    bankId
      ? prisma.bank.findFirst({ where: { id: bankId, userId } })
      : Promise.resolve(true),
  ]);
  if (!categoria || !formaPagamento || !banco) {
    return { erro: "Categoria, forma de pagamento ou banco inválidos." };
  }

  return {
    dados: {
      date,
      amount: valor,
      description: body.descricao?.trim() || null,
      categoryId: categoriaId,
      paymentMethodId: formaPagamentoId,
      bankId,
    },
  };
}
