import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { ipDaRequisicao } from "@/lib/auth/rate-limit";
import { usuarioDoCadastro, lerJson } from "@/lib/auth/http";

export async function OPTIONS() {
  return respostaOptions();
}

const MAX_TENTATIVAS = 5;

// Valida o código SMS. Limite de tentativas por código.
export async function POST(request: Request) {
  const usuario = await usuarioDoCadastro(request);
  if (!usuario) return respostaErro("Cadastro não autorizado.", 401);

  const body = await lerJson<{ codigo?: string }>(request);
  const codigo = body?.codigo?.replace(/\D/g, "");
  if (!codigo || codigo.length !== 6) {
    return respostaErro("Código inválido.", 400);
  }

  const registro = await prisma.phoneVerificationCode.findFirst({
    where: { userId: usuario.id, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!registro || registro.expiresAt < new Date()) {
    return respostaErro("Código expirado. Peça um novo.", 400);
  }
  if (registro.attempts >= MAX_TENTATIVAS) {
    return respostaErro("Muitas tentativas. Peça um novo código.", 429);
  }

  if (registro.code !== codigo) {
    await prisma.phoneVerificationCode.update({
      where: { id: registro.id },
      data: { attempts: { increment: 1 } },
    });
    const restantes = MAX_TENTATIVAS - registro.attempts - 1;
    return respostaErro(
      restantes > 0
        ? `Código incorreto. ${restantes} tentativa(s) restante(s).`
        : "Muitas tentativas. Peça um novo código.",
      400
    );
  }

  await prisma.$transaction([
    prisma.phoneVerificationCode.update({
      where: { id: registro.id },
      data: { usedAt: new Date() },
    }),
    prisma.appUser.update({
      where: { id: usuario.id },
      data: { phoneVerifiedAt: new Date() },
    }),
  ]);

  await registrarEventoAuth({
    event: "telefone_verificado",
    userId: usuario.id,
    ip: ipDaRequisicao(request),
  });

  return respostaJson({ verificado: true });
}
