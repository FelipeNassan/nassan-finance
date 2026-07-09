import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { validarDespesa } from "@/lib/despesas";

export async function OPTIONS() {
  return respostaOptions();
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const despesas = await prisma.expense.findMany({
    where: { userId },
    include: { category: true, paymentMethod: true, bank: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  return respostaJson(
    despesas.map((d) => ({
      id: d.id,
      data: d.date.toISOString().slice(0, 10),
      valor: d.amount.toNumber(),
      descricao: d.description,
      categoria: d.category.name,
      categoriaId: d.categoryId,
      formaPagamento: d.paymentMethod.name,
      formaPagamentoId: d.paymentMethodId,
      banco: d.bank?.name ?? null,
      bancoId: d.bankId ?? null,
      isDeleted: d.isDeleted,
    }))
  );
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respostaErro("Corpo inválido", 400);
  }

  const validacao = await validarDespesa(userId, body as never);
  if ("erro" in validacao) return respostaErro(validacao.erro, 400);

  const despesa = await prisma.expense.create({
    data: { userId, ...validacao.dados },
  });

  return respostaJson({ id: despesa.id }, 201);
}
