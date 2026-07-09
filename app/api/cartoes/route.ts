import { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const cartoes = await prisma.card.findMany({
    where: { userId },
    include: { bank: true },
    orderBy: { id: "desc" },
  });

  return respostaJson(
    cartoes.map((c) => ({
      id: c.id,
      nickname: c.nickname,
      closingDay: c.closingDay,
      dueDay: c.dueDay,
      holderName: c.holderName,
      brand: c.brand,
      cardNumber: c.cardNumber,
      expiration: c.expiration,
      type: c.type,
      limit: c.limit,
      color: c.color,
      password: c.password,
      isActive: c.isActive,
      bank: {
        id: c.bank.id,
        name: c.bank.name,
        logo: c.bank.logo,
      },
    }))
  );
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  try {
    const { nickname, closingDay, dueDay, bankId, holderName, brand, cardNumber, expiration, type, limit, color, password } = await req.json();

    if (!nickname || !closingDay || !dueDay || !bankId) {
      return respostaErro("Campos obrigatórios ausentes", 400);
    }

    // Segurança: o banco precisa ser DESTE usuário (evita vincular ao banco de outro)
    const banco = await prisma.bank.findFirst({ where: { id: bankId, userId } });
    if (!banco) return respostaErro("Banco inválido", 400);

    const cartao = await prisma.card.create({
      data: {
        userId,
        nickname,
        closingDay,
        dueDay,
        bankId,
        holderName,
        brand,
        cardNumber,
        expiration,
        type,
        limit,
        color,
        password,
      },
      include: { bank: true },
    });

    return respostaJson({
      id: cartao.id,
      nickname: cartao.nickname,
      closingDay: cartao.closingDay,
      dueDay: cartao.dueDay,
      holderName: cartao.holderName,
      brand: cartao.brand,
      cardNumber: cartao.cardNumber,
      expiration: cartao.expiration,
      type: cartao.type,
      limit: cartao.limit,
      color: cartao.color,
      password: cartao.password,
      isActive: cartao.isActive,
      bank: {
        id: cartao.bank.id,
        name: cartao.bank.name,
      },
    });
  } catch (error) {
    console.error("Erro ao criar cartão:", error);
    return respostaErro("Erro interno ao criar cartão", 500);
  }
}
