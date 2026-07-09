import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { ipDaRequisicao } from "@/lib/auth/rate-limit";
import { usuarioDoCadastro, lerJson } from "@/lib/auth/http";

export async function OPTIONS() {
  return respostaOptions();
}

const MAX_TENTATIVAS = 5;

// Valida o código de confirmação do e-mail (mesma mecânica do SMS).
export async function POST(request: Request) {
  const usuario = await usuarioDoCadastro(request);
  if (!usuario) return respostaErro("Cadastro não autorizado.", 401);

  const body = await lerJson<{ codigo?: string }>(request);
  const codigo = body?.codigo?.replace(/\D/g, "");
  if (!codigo || codigo.length !== 6) {
    return respostaErro("Código inválido.", 400);
  }

  const registro = await prisma.emailVerificationToken.findFirst({
    where: { userId: usuario.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!registro || registro.expiresAt < new Date()) {
    return respostaErro("Código expirado. Peça um novo.", 400);
  }

  // Reusa a coluna de tentativas? A tabela de e-mail não tem attempts —
  // controla por rate limit leve: 5 erros invalidam o código.
  if (registro.token !== codigo) {
    const erradas = await prisma.authLog.count({
      where: {
        userId: usuario.id,
        event: "email_codigo_incorreto",
        createdAt: { gte: registro.createdAt },
      },
    });
    await registrarEventoAuth({
      event: "email_codigo_incorreto",
      userId: usuario.id,
      ip: ipDaRequisicao(request),
    });
    if (erradas + 1 >= MAX_TENTATIVAS) {
      await prisma.emailVerificationToken.update({
        where: { id: registro.id },
        data: { usedAt: new Date() },
      });
      return respostaErro("Muitas tentativas. Peça um novo código.", 429);
    }
    return respostaErro(
      `Código incorreto. ${MAX_TENTATIVAS - erradas - 1} tentativa(s) restante(s).`,
      400
    );
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: registro.id },
      data: { usedAt: new Date() },
    }),
    prisma.appUser.update({
      where: { id: usuario.id },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  await registrarEventoAuth({
    event: "email_verificado",
    userId: usuario.id,
    ip: ipDaRequisicao(request),
  });

  return respostaJson({ verificado: true });
}
