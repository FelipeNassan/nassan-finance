import { NextRequest } from "next/server";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";

export async function OPTIONS() {
  return respostaOptions();
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;
  const cartaoId = parseInt(id, 10);
  if (isNaN(cartaoId)) return respostaErro("ID inválido", 400);

  const cartao = await prisma.card.findFirst({
    where: { id: cartaoId, userId },
    include: { bank: true },
  });

  if (!cartao) return respostaErro("Cartão não encontrado", 404);

  return respostaJson(cartao);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;
  const cartaoId = parseInt(id, 10);
  if (isNaN(cartaoId)) return respostaErro("ID inválido", 400);

  const body = await req.json();

  const cartaoAtual = await prisma.card.findFirst({
    where: { id: cartaoId, userId },
  });

  if (!cartaoAtual) return respostaErro("Cartão não encontrado", 404);

  // Segurança: se trocar de banco, o novo banco precisa ser deste usuário
  if (body.bankId !== undefined && body.bankId !== cartaoAtual.bankId) {
    const banco = await prisma.bank.findFirst({
      where: { id: body.bankId, userId },
    });
    if (!banco) return respostaErro("Banco inválido", 400);
  }

  const cartao = await prisma.card.update({
    where: { id: cartaoId },
    data: {
      nickname: body.nickname,
      bankId: body.bankId,
      holderName: body.holderName,
      brand: body.brand,
      cardNumber: body.cardNumber,
      expiration: body.expiration,
      closingDay: body.closingDay,
      dueDay: body.dueDay,
      type: body.type,
      limit: body.limit,
      color: body.color,
      password: body.password,
      isActive: body.isActive !== undefined ? body.isActive : undefined,
    },
    include: { bank: true },
  });

  return respostaJson(cartao);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (!userId) return respostaErro("Não autorizado", 401);

  const { id } = await params;
  const cartaoId = parseInt(id, 10);
  if (isNaN(cartaoId)) return respostaErro("ID inválido", 400);

  const cartaoAtual = await prisma.card.findFirst({
    where: { id: cartaoId, userId },
  });

  if (!cartaoAtual) return respostaErro("Cartão não encontrado", 404);

  await prisma.card.update({
    where: { id: cartaoId },
    data: { isActive: false },
  });

  return respostaJson({ success: true });
}
