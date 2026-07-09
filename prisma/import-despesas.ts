import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DESPESAS = [
  { data: "2026-05-25", valor: 38.58,  descricao: "Ifood - Milkshake do MilkMoo. Estava precisando de um doce e não tinha nada em casa (sem mercado)", categoria: "Delivery",     forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-27", valor: 26.90,  descricao: "Assinatura - Apple",                                                                                  categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-27", valor: 26.90,  descricao: "Assinatura - Apple",                                                                                  categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-28", valor: 14.00,  descricao: "99 - Indo para a estação, estou atrasado para a faculdade",                                           categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-05-28", valor: 158.02, descricao: "Presente de padrinho de casamento para o David e a Júlia (parcelei R$ 474,06 em 3x)",                 categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-28", valor: 12.00,  descricao: "Kinder Bueno na Barra Funda, faz tempo que não como e estou com fome",                                categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-29", valor: 24.90,  descricao: "Assinatura - YouTube Premium",                                                                        categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-05-29", valor: 6.50,   descricao: "Pedi ao Nathan ir comprar as balas para o kit hálito pós-CPM",                                        categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-29", valor: 8.80,   descricao: "99 - Do CPM na central para o Habbib's em encontro com as namoradas do quarteto bombástico",          categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-05-30", valor: 102.48, descricao: "Conta do Habbib's pós encontro dos casais do quarteto bombástico",                                    categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-30", valor: 22.60,  descricao: "99 - Do Habbib's para a casa da Sara e depois para a minha",                                          categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-05-31", valor: 13.10,  descricao: "Balas para a RJM na comum, kit hálito",                                                               categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-05-31", valor: 42.97,  descricao: "Ifood - A mãe estava com muita vontade de comer bolo de milho",                                       categoria: "Delivery",      forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-01", valor: 7.95,   descricao: "Assinatura - Clube Ifood",                                                                            categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-03", valor: 49.99,  descricao: "Assinatura - Google One",                                                                             categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-04", valor: 211.08, descricao: "Estudos - Comunidade A Cara da Riqueza (parcelei R$ 633,24 em 3x)",                                   categoria: "Estudos",       forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-06", valor: 9.60,   descricao: "Kit hálito para o GEM",                                                                               categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-06", valor: 55.00,  descricao: "Cortei o cabelo com o irmão Genison",                                                                 categoria: "Outros",        forma: "PIX",               banco: "Mercado Pago" },
  { data: "2026-06-06", valor: 35.00,  descricao: "Peguei um hinário si bemol novo, o meu estava velho",                                                 categoria: "Outros",        forma: "PIX",               banco: "Mercado Pago" },
  { data: "2026-06-06", valor: 17.20,  descricao: "Dividimos o valor em 5, para a pizza da reunião de auxiliar no Marquinhos",                           categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-07", valor: 33.50,  descricao: "99 - Voltando para casa depois da reunião de auxiliar no Marquinhos",                                 categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-07", valor: 203.27, descricao: "O pai quis encher o tanque com gasolina para ir ao casamento do David",                               categoria: "Transporte",    forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-08", valor: 44.88,  descricao: "Estou com vontade de almoçar esfihas, pedi",                                                          categoria: "Delivery",      forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-08", valor: 24.19,  descricao: "Comprei no Mercado Livre uma capa para meu passaporte",                                               categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-10", valor: 19.90,  descricao: "Assinatura - Apple",                                                                                  categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-10", valor: 217.80, descricao: "Na lojinha da empresa (Banco BV): Camisa, case para notebook e caderno",                               categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-10", valor: 37.80,  descricao: "Almoço no shopping - fui presencial para a empresa",                                                  categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-10", valor: 22.95,  descricao: "Baccio Di Latte - sorvetinho pós almoço no shopping",                                                 categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-10", valor: 4.50,   descricao: "Um chicletinho tridente para salvar o hálito agora a tarde presencial na empresa",                    categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-10", valor: 162.00, descricao: "Na lojinha da empresa (Banco BV): Mochila",                                                           categoria: "Outros",        forma: "PIX",               banco: "BV" },
  { data: "2026-06-10", valor: 21.30,  descricao: "99 - desci em Franco da Rocha e peguei Uber para ir para casa",                                       categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-11", valor: 18.00,  descricao: "Uma coxinha superfaturada para comemorar férias da faculdade",                                        categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-11", valor: 26.56,  descricao: "Fui no carrefour comprar uma coquinha, um chiclete para amanhã ir presencial e um chocolate",         categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-12", valor: 50.29,  descricao: "Almoço com a minha gerente e as coordenadoras - fui presencial no banco",                             categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-12", valor: 6.00,   descricao: "Comprei um chocolatinho no banco, presencial",                                                        categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-12", valor: 33.00,  descricao: "Peguei um milshake no JhonnyJoy no shopping com o Thiago e a Giovana",                                categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-13", valor: 18.40,  descricao: "99 - Indo para o GEM",                                                                                categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-14", valor: 9.60,   descricao: "Kit hálito para a RJM na comum",                                                                      categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-14", valor: 40.89,  descricao: "Comprei esfihas para comer antes da RDM no Serpa",                                                    categoria: "Delivery",      forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-15", valor: 150.00, descricao: "Presente de dia dos namorados que encomendei com a tia Verinha",                                      categoria: "Outros",        forma: "PIX",               banco: "Nubank" },
  { data: "2026-06-17", valor: 9.00,   descricao: "99 - Fui para a estação de Franco, fui presencial no Banco",                                          categoria: "Transporte",    forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-17", valor: 86.90,  descricao: "Almoço com a equipe na Embaixada da Carne lá no Morumbi",                                             categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-17", valor: 14.90,  descricao: "Comprei um chaveiro com meu nome na livraria Leitura no MarketPlace",                                 categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-17", valor: 87.96,  descricao: "Fui na Panvel e comprei um multivitamínico de A-Z, Melatonina e um porta comprimidos",                categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-18", valor: 50.00,  descricao: "Contribuição com um pix de aniversário do Tavares",                                                   categoria: "Outros",        forma: "PIX",               banco: "Nubank" },
  { data: "2026-06-19", valor: 44.00,  descricao: "Assinatura da Udemy",                                                                                 categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-20", valor: 14.40,  descricao: "Kit hálito para o culto e reunião de jovens",                                                         categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-21", valor: 146.40, descricao: "Fomos no pesqueiro, paguei o meu e o da Sara",                                                        categoria: "Alimentação",   forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-22", valor: 5.44,   descricao: "Comprei um ebook sobre fingir até ser (sobre alter-ego) (parcelei em 4x de R$ 5,44)",                 categoria: "Estudos",       forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-22", valor: 72.92,  descricao: "Método voz de respeito do Cícero Alves (Parcelei em 2x de R$ 72,92)",                                 categoria: "Estudos",       forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-23", valor: 115.16, descricao: "Assinatura do Claude",                                                                                categoria: "Assinaturas",   forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-24", valor: 1.54,   descricao: "Repasse de IOF",                                                                                      categoria: "Imposto",       forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-24", valor: 4.03,   descricao: "IOF de compra internacional",                                                                         categoria: "Imposto",       forma: "Cartão de crédito", banco: "Nubank" },
  { data: "2026-06-24", valor: 35.68,  descricao: "Desafio 28 dias - Kiwify (2/2 de parcelas de R$ 35,68)",                                              categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-24", valor: 49.63,  descricao: "Compinhas na Kalunga no Market Place Morumbi (2/3 de parcelas de R$ 49,63)",                          categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
  { data: "2026-06-24", valor: 49.42,  descricao: "Comprei o livro 'A melhor carreira em Dados' (2/2 de parcelas de R$ 49,42)",                          categoria: "Outros",        forma: "Cartão de crédito", banco: "BV" },
];

async function findOrCreate<T extends { id: number }>(
  findFn: () => Promise<T | null>,
  createFn: () => Promise<T>
): Promise<number> {
  const existing = await findFn();
  if (existing) return existing.id;
  const created = await createFn();
  return created.id;
}

async function main() {
  const user = await prisma.appUser.findFirst();
  if (!user) throw new Error("Nenhum usuário encontrado no banco");

  const userId = user.id;
  console.log(`Usuário: ${userId}`);

  // Cache de lookups para evitar queries repetidas
  const catCache = new Map<string, number>();
  const formaCache = new Map<string, number>();
  const bancoCache = new Map<string, number>();

  async function getCategoria(nome: string): Promise<number> {
    if (catCache.has(nome)) return catCache.get(nome)!;
    const id = await findOrCreate(
      () => prisma.expenseCategory.findFirst({ where: { userId, name: { equals: nome, mode: "insensitive" } } }),
      () => prisma.expenseCategory.create({ data: { userId, name: nome } })
    );
    catCache.set(nome, id);
    return id;
  }

  async function getForma(nome: string): Promise<number> {
    if (formaCache.has(nome)) return formaCache.get(nome)!;
    const id = await findOrCreate(
      () => prisma.paymentMethod.findFirst({ where: { userId, name: { equals: nome, mode: "insensitive" } } }),
      () => prisma.paymentMethod.create({ data: { userId, name: nome } })
    );
    formaCache.set(nome, id);
    return id;
  }

  async function getBanco(nome: string): Promise<number> {
    if (bancoCache.has(nome)) return bancoCache.get(nome)!;
    const id = await findOrCreate(
      () => prisma.bank.findFirst({ where: { userId, name: { equals: nome, mode: "insensitive" } } }),
      () => prisma.bank.create({ data: { userId, name: nome } })
    );
    bancoCache.set(nome, id);
    return id;
  }

  let count = 0;
  for (const d of DESPESAS) {
    const [year, month, day] = d.data.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    const [categoryId, paymentMethodId, bankId] = await Promise.all([
      getCategoria(d.categoria),
      getForma(d.forma),
      getBanco(d.banco),
    ]);

    await prisma.expense.create({
      data: { userId, date, amount: d.valor, description: d.descricao, categoryId, paymentMethodId, bankId },
    });

    count++;
    process.stdout.write(`\r${count}/${DESPESAS.length} despesas inseridas`);
  }

  console.log(`\nConcluído: ${count} despesas importadas`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
