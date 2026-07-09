import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { validarDespesa } from "@/lib/despesas";

type Contexto = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return respostaOptions();
}

// Confere autenticação e posse da despesa; retorna o userId ou uma resposta de erro.
async function resolver(id: string) {
  const userId = await getUserId();
  if (!userId) return { erro: respostaErro("Não autorizado", 401) };

  const despesaId = Number(id);
  if (!Number.isInteger(despesaId)) {
    return { erro: respostaErro("ID inválido", 400) };
  }

  const despesa = await prisma.expense.findFirst({
    where: { id: despesaId, userId, isDeleted: false },
  });
  if (!despesa) return { erro: respostaErro("Despesa não encontrada", 404) };

  return { userId, despesaId };
}

export async function PATCH(request: Request, { params }: Contexto) {
  const { id } = await params;
  const r = await resolver(id);
  if (r.erro) return r.erro;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respostaErro("Corpo inválido", 400);
  }

  const validacao = await validarDespesa(r.userId, body as never);
  if ("erro" in validacao) return respostaErro(validacao.erro, 400);

  await prisma.expense.update({
    where: { id: r.despesaId },
    data: validacao.dados,
  });

  return respostaJson({ id: r.despesaId });
}

export async function DELETE(request: Request, { params }: Contexto) {
  const { id } = await params;
  const r = await resolver(id);
  if (r.erro) return r.erro;

  let body: { motivo?: string };
  try {
    body = await request.json();
  } catch {
    return respostaErro("Corpo inválido", 400);
  }

  const motivo = body.motivo?.trim();
  if (!motivo) {
    return respostaErro("Informe o motivo da exclusão.", 400);
  }

  // Soft delete: marca como deletado com data e motivo, sem remover a linha.
  await prisma.expense.update({
    where: { id: r.despesaId },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      deletedDescription: motivo.slice(0, 255),
    },
  });

  return respostaJson({ ok: true });
}
