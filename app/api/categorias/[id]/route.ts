import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;

  try {
    // Soft delete
    await prisma.expenseCategory.updateMany({
      where: { id: parseInt(id, 10), userId },
      data: { deletedAt: new Date() },
    });
    return respostaJson({ success: true });
  } catch {
    return respostaErro("Erro ao deletar categoria", 500);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;
  
  try {
    const body = await req.json();
    const data: { deletedAt?: Date | null; isActive?: boolean } = {};

    if (body.restore === true) {
      data.deletedAt = null;
      data.isActive = true;
    }

    if (Object.keys(data).length > 0) {
      await prisma.expenseCategory.updateMany({
        where: { id: parseInt(id, 10), userId },
        data,
      });
    }
    return respostaJson({ success: true });
  } catch {
    return respostaErro("Erro ao atualizar", 500);
  }
}
