import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { usuarioDoCadastro, lerJson } from "@/lib/auth/http";
import { enviarEmail, devolverCodigoEmDev } from "@/lib/auth/entrega";
import { randomInt } from "node:crypto";

export async function OPTIONS() {
  return respostaOptions();
}

const EXPIRA_MINUTOS = 15;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Etapa do e-mail no cadastro: registra o e-mail e envia um CÓDIGO de 6
// dígitos para o usuário digitar no app (sem link).
export async function POST(request: Request) {
  const usuario = await usuarioDoCadastro(request);
  if (!usuario) return respostaErro("Cadastro não autorizado.", 401);
  if (!usuario.phoneVerifiedAt) {
    return respostaErro("Verifique o celular antes.", 400);
  }

  const ip = ipDaRequisicao(request);
  if (estourouLimite(`email:${usuario.id}`, 5, 15 * 60 * 1000)) {
    return respostaErro("Muitos e-mails enviados. Aguarde alguns minutos.", 429);
  }

  const body = await lerJson<{ email?: string }>(request);
  const email = body?.email?.trim().toLowerCase();
  if (!email || !EMAIL_REGEX.test(email) || email.length > 255) {
    return respostaErro("E-mail inválido.", 400);
  }

  const jaExiste = await prisma.appUser.findFirst({
    where: { email, id: { not: usuario.id } },
  });
  if (jaExiste) {
    return respostaErro("Este e-mail já está em uso.", 409);
  }

  const codigo = String(randomInt(100000, 1000000));

  // Reenviar invalida códigos anteriores — só o mais novo funciona
  await prisma.$transaction([
    prisma.emailVerificationToken.updateMany({
      where: { userId: usuario.id, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationToken.create({
      data: {
        userId: usuario.id,
        token: codigo,
        expiresAt: new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000),
      },
    }),
    prisma.appUser.update({
      where: { id: usuario.id },
      data: { email, emailVerifiedAt: null },
    }),
  ]);

  await enviarEmail(
    email,
    "Seu código de confirmação — fortn",
    `Digite este código no app para confirmar seu e-mail (válido por ${EXPIRA_MINUTOS} minutos):<br><br>` +
      `<span style="font-family:Georgia,serif;font-size:32px;letter-spacing:8px;color:#755A26">${codigo}</span>`
  );
  await registrarEventoAuth({
    event: "email_confirmacao_enviada",
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
