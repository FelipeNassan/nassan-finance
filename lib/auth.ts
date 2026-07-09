import { headers } from "next/headers";
import { prisma } from "./prisma";
import { verificarToken } from "./auth/tokens";

// AUTH_DISABLED=true no .env desliga a autenticação e usa o usuário fixo local.
// Somente para desenvolvimento/testes — nunca usar em produção.
export const authDesligada = process.env.AUTH_DISABLED === "true";

const DEV_USER_ID = "dev-user";

// Resolve o usuário da requisição: valida o access token (Authorization: Bearer).
// Com a auth desligada e sem token, cai no dev-user.
export async function getUserId(): Promise<string | null> {
  const h = await headers();
  const authorization = h.get("authorization");

  if (authorization?.startsWith("Bearer ")) {
    return verificarToken(authorization.slice(7), "acesso");
  }

  if (authDesligada) return DEV_USER_ID;
  return null;
}

const CATEGORIAS_PADRAO = [
  "Alimentação",
  "Assinaturas",
  "Delivery",
  "Educação",
  "Imposto",
  "Lazer",
  "Moradia",
  "Outros",
  "Saúde",
  "Transporte",
];

const FORMAS_PAGAMENTO_PADRAO = [
  "Cartão de Crédito",
  "Cartão de Débito",
  "Dinheiro",
  "PIX",
];

// Garante que o usuário existe e tem os dados padrão (categorias/formas).
export async function getOrCreateUser() {
  const userId = await getUserId();
  if (!userId) return null;

  const user = await prisma.appUser.upsert({
    where: { id: userId },
    update: {},
    create: { id: userId },
  });

  await semearDadosPadrao(userId);

  return user;
}

// Categorias e formas de pagamento padrão — chamado no primeiro acesso
// e na ativação da conta. skipDuplicates torna a operação idempotente.
export async function semearDadosPadrao(userId: string) {
  await Promise.all([
    prisma.expenseCategory.createMany({
      data: CATEGORIAS_PADRAO.map((name) => ({ userId, name })),
      skipDuplicates: true,
    }),
    prisma.paymentMethod.createMany({
      data: FORMAS_PAGAMENTO_PADRAO.map((name) => ({ userId, name })),
      skipDuplicates: true,
    }),
  ]);
}
