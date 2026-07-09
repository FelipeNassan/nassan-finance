import { prisma } from "@/lib/prisma";

export type EventoAuth =
  | "cadastro_iniciado"
  | "telefone_codigo_enviado"
  | "telefone_verificado"
  | "email_confirmacao_enviada"
  | "email_codigo_incorreto"
  | "email_verificado"
  | "conta_ativada"
  | "login_ok"
  | "login_falha"
  | "login_bloqueado"
  | "logout"
  | "refresh_ok"
  | "refresh_invalido"
  | "senha_reset_solicitado"
  | "senha_reset_codigo_ok"
  | "senha_redefinida";

export async function registrarEventoAuth(dados: {
  event: EventoAuth;
  userId?: string | null;
  email?: string | null;
  ip?: string | null;
}) {
  // Log nunca pode derrubar o fluxo principal
  try {
    await prisma.authLog.create({
      data: {
        event: dados.event,
        userId: dados.userId ?? null,
        email: dados.email?.toLowerCase() ?? null,
        ip: dados.ip ?? null,
      },
    });
  } catch (e) {
    console.error("[auth] falha ao registrar log:", e);
  }
}

// Anti-brute-force: conta falhas recentes de login para um e-mail.
export async function falhasRecentesDeLogin(
  email: string,
  janelaMinutos: number
): Promise<number> {
  return prisma.authLog.count({
    where: {
      email: email.toLowerCase(),
      event: "login_falha",
      createdAt: { gte: new Date(Date.now() - janelaMinutos * 60 * 1000) },
    },
  });
}
