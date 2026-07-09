import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";
import { enviarEmail, devolverCodigoEmDev } from "@/lib/auth/entrega";
import { randomInt } from "node:crypto";

export async function OPTIONS() {
  return respostaOptions();
}

const EXPIRA_MINUTOS = 15;

// Solicita a redefinição: valida que a conta existe (decisão de produto:
// app pessoal responde "Usuário não encontrado") e envia código de 6 dígitos.
// Reenviar invalida o código anterior.
export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`esqueci:${ip}`, 8, 15 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const body = await lerJson<{ email?: string }>(request);
  const email = body?.email?.trim().toLowerCase();
  if (!email) return respostaErro("Informe o e-mail.", 400);

  const usuario = await prisma.appUser.findUnique({ where: { email } });
  if (!usuario?.activatedAt) {
    return respostaErro("Usuário não encontrado.", 404);
  }

  const codigo = String(randomInt(100000, 1000000));

  await prisma.$transaction([
    prisma.passwordResetToken.updateMany({
      where: { userId: usuario.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: usuario.id,
        token: codigo,
        expiresAt: new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000),
      },
    }),
  ]);

  await enviarEmail(
    email,
    "Código de recuperação — fortn",
    `Digite este código no app para criar uma nova senha (válido por ${EXPIRA_MINUTOS} minutos):<br><br>` +
      `<span style="font-family:Georgia,serif;font-size:32px;letter-spacing:8px;color:#755A26">${codigo}</span>`
  );
  await registrarEventoAuth({
    event: "senha_reset_solicitado",
    userId: usuario.id,
    email,
    ip,
  });

  return respostaJson({
    enviado: true,
    expiraEmSegundos: EXPIRA_MINUTOS * 60,
    ...(devolverCodigoEmDev ? { devCodigo: codigo } : {}),
  });
}
