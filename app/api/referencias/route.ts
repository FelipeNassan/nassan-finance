import { getOrCreateUser, getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  // Garante categorias/formas padrão no primeiro acesso via app
  await getOrCreateUser();

  const [categorias, formasPagamento, bancos] = await Promise.all([
    prisma.expenseCategory.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, order: true, isActive: true },
    }),
    prisma.paymentMethod.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: { id: true, name: true, order: true, isActive: true },
    }),
    prisma.bank.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, logo: true, isActive: true },
    }),
  ]);

  return respostaJson({ categorias, formasPagamento, bancos });
}
