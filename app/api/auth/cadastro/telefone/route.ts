import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { usuarioDoCadastro, lerJson } from "@/lib/auth/http";
import { enviarSms, devolverCodigoEmDev } from "@/lib/auth/entrega";
import { randomInt } from "node:crypto";

export async function OPTIONS() {
  return respostaOptions();
}

const EXPIRA_MINUTOS = 5;

// Etapa 2 do cadastro: envia código SMS de 6 dígitos para o celular.
export async function POST(request: Request) {
  const usuario = await usuarioDoCadastro(request);
  if (!usuario) return respostaErro("Cadastro não autorizado.", 401);

  const ip = ipDaRequisicao(request);
  if (estourouLimite(`sms:${usuario.id}`, 5, 15 * 60 * 1000)) {
    return respostaErro("Muitos códigos enviados. Aguarde alguns minutos.", 429);
  }

  const body = await lerJson<{ ddd?: string; numero?: string }>(request);
  const ddd = body?.ddd?.replace(/\D/g, "");
  const numero = body?.numero?.replace(/\D/g, "");

  if (!ddd || ddd.length !== 2 || !numero || numero.length < 8 || numero.length > 9) {
    return respostaErro("Informe DDD e número válidos.", 400);
  }

  const telefone = `+55${ddd}${numero}`;
  const codigo = String(randomInt(100000, 1000000));

  // Invalida códigos anteriores ainda abertos deste usuário
  await prisma.phoneVerificationCode.updateMany({
    where: { userId: usuario.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await prisma.phoneVerificationCode.create({
    data: {
      userId: usuario.id,
      phone: telefone,
      code: codigo,
      expiresAt: new Date(Date.now() + EXPIRA_MINUTOS * 60 * 1000),
    },
  });

  await prisma.appUser.update({
    where: { id: usuario.id },
    data: { phone: telefone, phoneVerifiedAt: null },
  });

  await enviarSms(telefone, `fortn: seu código é ${codigo}`);
  await registrarEventoAuth({
    event: "telefone_codigo_enviado",
    userId: usuario.id,
    ip,
  });

  return respostaJson({
    enviado: true,
    expiraEmSegundos: EXPIRA_MINUTOS * 60,
    ...(devolverCodigoEmDev ? { devCodigo: codigo } : {}),
  });
}
