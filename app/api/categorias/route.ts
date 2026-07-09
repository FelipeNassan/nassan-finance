import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  respostaJson,
  respostaErro,
  respostaOptions,
  ehConflitoUnico,
} from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  try {
    const { name, order } = await req.json();
    if (!name) return respostaErro("Nome é obrigatório", 400);

    const categoria = await prisma.expenseCategory.create({
      data: {
        userId,
        name,
        order: order || 0,
      },
    });
    return respostaJson(categoria);
  } catch (error) {
    if (ehConflitoUnico(error)) return respostaErro("Categoria já existe", 400);
    return respostaErro("Erro ao criar", 500);
  }
}

// Para reordenar enviamos [{ id, order }]
export async function PUT(req: Request) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  try {
    const updates: { id: number; order: number }[] = await req.json();

    await prisma.$transaction(
      updates.map((u) =>
        prisma.expenseCategory.updateMany({
          where: { id: u.id, userId },
          data: { order: u.order },
        })
      )
    );

    return respostaJson({ success: true });
  } catch {
    return respostaErro("Erro ao reordenar", 500);
  }
}
