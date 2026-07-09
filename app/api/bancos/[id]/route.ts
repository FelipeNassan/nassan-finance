import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  respostaJson,
  respostaErro,
  respostaOptions,
  ehConflitoUnico,
} from "@/lib/api";

type Contexto = { params: Promise<{ id: string }> };

export async function OPTIONS() {
  return respostaOptions();
}

export async function DELETE(_req: Request, { params }: Contexto) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;

  // Soft delete via isActive (só afeta banco do próprio usuário)
  await prisma.bank.updateMany({
    where: { id: Number(id), userId },
    data: { isActive: false },
  });

  return respostaJson({ ok: true });
}

export async function PUT(req: Request, { params }: Contexto) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;

  try {
    const body = await req.json();
    const data: { name?: string; logo?: string | null; isActive?: boolean } = {};
    if (body.name) data.name = body.name;
    if (body.logo !== undefined) data.logo = body.logo;
    if (body.restore === true) data.isActive = true;

    if (Object.keys(data).length === 0) return respostaErro("Nada a atualizar", 400);

    const banco = await prisma.bank.updateMany({
      where: { id: Number(id), userId },
      data,
    });

    if (banco.count === 0) return respostaErro("Banco não encontrado", 404);

    return respostaJson({ ok: true });
  } catch (error) {
    if (ehConflitoUnico(error)) {
      return respostaErro("Já existe um banco com este nome", 400);
    }
    return respostaErro("Erro ao atualizar", 500);
  }
}
