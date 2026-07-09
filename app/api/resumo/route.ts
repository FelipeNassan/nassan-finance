import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const agora = new Date();
  const inicioMes = new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), 1));
  const inicioProximoMes = new Date(
    Date.UTC(agora.getFullYear(), agora.getMonth() + 1, 1)
  );

  // isDeleted: false em todas as consultas — despesas com soft delete não contam
  const [agregadoMes, agregadoTotal, contagem, recentes, porCategoria, porPagamento, despesasMes, primeiraDespesa] =
    await Promise.all([
      prisma.expense.aggregate({
        where: {
          userId,
          isDeleted: false,
          date: { gte: inicioMes, lt: inicioProximoMes },
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, isDeleted: false },
        _sum: { amount: true },
      }),
      prisma.expense.count({ where: { userId, isDeleted: false } }),
      prisma.expense.findMany({
        where: { userId, isDeleted: false },
        include: { category: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      prisma.expense.groupBy({
        by: ["categoryId"],
        where: {
          userId,
          isDeleted: false,
          date: { gte: inicioMes, lt: inicioProximoMes },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 5,
      }),
      prisma.expense.groupBy({
        by: ["paymentMethodId"],
        where: {
          userId,
          isDeleted: false,
          date: { gte: inicioMes, lt: inicioProximoMes },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          isDeleted: false,
          date: { gte: inicioMes, lt: inicioProximoMes },
        },
        select: { amount: true, date: true },
      }),
      prisma.expense.findFirst({
        where: { userId, isDeleted: false },
        orderBy: { date: "asc" },
        select: { date: true },
      }),
    ]);

  const categorias = await prisma.expenseCategory.findMany({
    where: { id: { in: porCategoria.map((c) => c.categoryId) } },
  });
  const nomeCategoria = new Map(categorias.map((c) => [c.id, c.name]));

  const pagamentos = await prisma.paymentMethod.findMany({
    where: { id: { in: porPagamento.map((p) => p.paymentMethodId) } },
  });
  const nomePagamento = new Map(pagamentos.map((p) => [p.id, p.name]));

  // Lógica de agrupar por semanas (iniciando no domingo)
  const ano = agora.getUTCFullYear();
  const mes = agora.getUTCMonth();
  const totalDays = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  
  type SemanaRaw = {
    start: number;
    end: number;
    startDate: Date;
    endDate: Date;
    amount: number;
  };
  const semanasRaw: SemanaRaw[] = [];
  let currentStart = 1;
  while (currentStart <= totalDays) {
    const startDate = new Date(Date.UTC(ano, mes, currentStart));
    let endDay = currentStart + (6 - startDate.getUTCDay());
    if (endDay > totalDays) endDay = totalDays;
    
    semanasRaw.push({
      start: currentStart,
      end: endDay,
      startDate: new Date(Date.UTC(ano, mes, currentStart)),
      endDate: new Date(Date.UTC(ano, mes, endDay, 23, 59, 59, 999)),
      amount: 0,
    });
    
    currentStart = endDay + 1;
  }

  despesasMes.forEach(d => {
    const day = d.date.getUTCDate();
    const week = semanasRaw.find(w => day >= w.start && day <= w.end);
    if (week) {
      week.amount += d.amount.toNumber();
    }
  });

  const formatarData = (d: Date) => d.getUTCDate().toString().padStart(2, '0') + '/' + (d.getUTCMonth() + 1).toString().padStart(2, '0');

  const porSemana = semanasRaw.map((w, index) => {
    let percentDiff = null;
    if (index > 0) {
      const prevAmount = semanasRaw[index - 1].amount;
      if (prevAmount === 0 && w.amount > 0) {
        percentDiff = 100;
      } else if (prevAmount > 0) {
        percentDiff = ((w.amount - prevAmount) / prevAmount) * 100;
      } else {
        percentDiff = 0;
      }
    }
    return {
      nome: `SEMANA ${index + 1}`,
      periodo: `${formatarData(w.startDate)} - ${formatarData(w.endDate)}`,
      valor: w.amount,
      percentDiff,
    };
  });

  let mediaMensal = 0;
  const total = agregadoTotal._sum.amount?.toNumber() ?? 0;
  if (total > 0 && primeiraDespesa) {
    const diffTime = agora.getTime() - primeiraDespesa.date.getTime();
    let diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    if (diffMonths < 1) diffMonths = 1;
    mediaMensal = total / diffMonths;
  }

  return respostaJson({
    totalMes: agregadoMes._sum.amount?.toNumber() ?? 0,
    totalGeral: total,
    mediaMensal,
    lancamentos: contagem,
    porCategoria: porCategoria.map((c) => ({
      categoriaId: c.categoryId,
      nome: nomeCategoria.get(c.categoryId) ?? "Outros",
      valor: c._sum.amount?.toNumber() ?? 0,
    })),
    porPagamento: porPagamento.map((p) => ({
      pagamentoId: p.paymentMethodId,
      nome: nomePagamento.get(p.paymentMethodId) ?? "Outros",
      valor: p._sum.amount?.toNumber() ?? 0,
    })),
    porSemana,
    recentes: recentes.map((d) => ({
      id: d.id,
      data: d.date.toISOString().slice(0, 10),
      valor: d.amount.toNumber(),
      descricao: d.description,
      categoria: d.category.name,
    })),
  });
}
