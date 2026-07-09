import { prisma } from "@/lib/prisma";
import { respostaJson, respostaErro, respostaOptions } from "@/lib/api";
import { assinarToken } from "@/lib/auth/tokens";
import { registrarEventoAuth } from "@/lib/auth/log";
import { estourouLimite, ipDaRequisicao } from "@/lib/auth/rate-limit";
import { lerJson } from "@/lib/auth/http";

export async function OPTIONS() {
  return respostaOptions();
}

// Etapa 1 do cadastro: dados pessoais. Cria o usuário PENDENTE e devolve
// um token de escopo "cadastro" que autoriza as etapas seguintes.
export async function POST(request: Request) {
  const ip = ipDaRequisicao(request);
  if (estourouLimite(`cadastro:${ip}`, 10, 60 * 60 * 1000)) {
    return respostaErro("Muitas tentativas. Tente mais tarde.", 429);
  }

  const body = await lerJson<{
    nome?: string;
    sobrenome?: string;
    nascimento?: string;
  }>(request);

  const nome = body?.nome?.trim();
  const sobrenome = body?.sobrenome?.trim();
  const nascimento = body?.nascimento;

  if (!nome || !sobrenome || !nascimento) {
    return respostaErro("Preencha nome, sobrenome e data de nascimento.", 400);
  }
  if (nome.length > 60 || sobrenome.length > 60) {
    return respostaErro("Nome muito longo.", 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nascimento)) {
    return respostaErro("Data de nascimento inválida.", 400);
  }

  const [ano, mes, dia] = nascimento.split("-").map(Number);
  const dataNascimento = new Date(Date.UTC(ano, mes - 1, dia));
  const idadeMs = Date.now() - dataNascimento.getTime();
  const idade = idadeMs / (365.25 * 24 * 60 * 60 * 1000);
  if (Number.isNaN(dataNascimento.getTime())) {
    return respostaErro("Data de nascimento inválida.", 400);
  }
  if (idade <= 10) {
    return respostaErro("É preciso ter mais de 10 anos.", 400);
  }
  if (idade >= 100) {
    return respostaErro("Data de nascimento inválida.", 400);
  }

  const usuario = await prisma.appUser.create({
    data: { firstName: nome, lastName: sobrenome, birthDate: dataNascimento },
  });

  await registrarEventoAuth({ event: "cadastro_iniciado", userId: usuario.id, ip });

  const cadastroToken = await assinarToken(usuario.id, "cadastro");
  return respostaJson({ cadastroToken }, 201);
}
