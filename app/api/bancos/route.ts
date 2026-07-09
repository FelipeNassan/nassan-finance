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
    const { name, logo } = await req.json();
    if (!name) return respostaErro("Nome é obrigatório", 400);

    const banco = await prisma.bank.create({
      data: {
        userId,
        name,
        logo: logo || null,
      },
    });
    return respostaJson(banco);
  } catch (error) {
    if (ehConflitoUnico(error)) return respostaErro("Banco já existe", 400);
    return respostaErro("Erro ao criar", 500);
  }
}
