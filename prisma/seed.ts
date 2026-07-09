import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WEEKDAYS = [
  "domingo",
  "segunda-feira",
  "terça-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sábado",
];

// Feriados nacionais do Brasil — 2026
// Páscoa 2026: 05/04 — Carnaval: 16-17/02 — Corpus Christi: 04/06
const FERIADOS: { data: string; nome: string }[] = [
  { data: "2026-01-01", nome: "Confraternização Universal" },
  { data: "2026-02-16", nome: "Carnaval" },
  { data: "2026-02-17", nome: "Carnaval" },
  { data: "2026-04-03", nome: "Sexta-feira da Paixão" },
  { data: "2026-04-21", nome: "Tiradentes" },
  { data: "2026-05-01", nome: "Dia do Trabalho" },
  { data: "2026-06-04", nome: "Corpus Christi" },
  { data: "2026-09-07", nome: "Independência do Brasil" },
  { data: "2026-10-12", nome: "Nossa Senhora Aparecida" },
  { data: "2026-11-02", nome: "Finados" },
  { data: "2026-11-15", nome: "Proclamação da República" },
  { data: "2026-11-20", nome: "Consciência Negra" },
  { data: "2026-12-25", nome: "Natal" },
];

async function main() {
  // Inserir feriados e montar mapa data → holiday_id
  const feriadoMap = new Map<string, number>();

  for (const f of FERIADOS) {
    const holiday = await prisma.holiday.create({
      data: { name: f.nome, scope: "national" },
    });
    feriadoMap.set(f.data, holiday.id);
  }

  // Gerar todos os dias de 2026
  const businessDayCounter = new Map<string, number>(); // chave: "2026-01"
  const calendarDays: {
    date: Date;
    weekdayName: string;
    dayOfMonth: number;
    isBusinessDay: boolean;
    businessDayNumber: number | null;
    holidayId: number | null;
  }[] = [];

  const current = new Date(Date.UTC(2026, 0, 1));
  const end = new Date(Date.UTC(2026, 11, 31));

  while (current <= end) {
    const year = current.getUTCFullYear();
    const month = current.getUTCMonth();
    const day = current.getUTCDate();
    const weekday = current.getUTCDay();

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const monthKey = dateStr.substring(0, 7);

    const isHoliday = feriadoMap.has(dateStr);
    const isWeekend = weekday === 0 || weekday === 6;
    const isBusinessDay = !isWeekend && !isHoliday;

    let businessDayNumber: number | null = null;
    if (isBusinessDay) {
      const count = (businessDayCounter.get(monthKey) ?? 0) + 1;
      businessDayCounter.set(monthKey, count);
      businessDayNumber = count;
    }

    calendarDays.push({
      date: new Date(Date.UTC(year, month, day)),
      weekdayName: WEEKDAYS[weekday],
      dayOfMonth: day,
      isBusinessDay,
      businessDayNumber,
      holidayId: feriadoMap.get(dateStr) ?? null,
    });

    current.setUTCDate(current.getUTCDate() + 1);
  }

  // Upsert em lote
  await prisma.calendarDay.createMany({
    data: calendarDays.map((d) => ({
      date: d.date,
      weekdayName: d.weekdayName,
      dayOfMonth: d.dayOfMonth,
      isBusinessDay: d.isBusinessDay,
      businessDayNumber: d.businessDayNumber,
      holidayId: d.holidayId,
    })),
    skipDuplicates: true,
  });

  console.log(
    `Seed concluído: ${calendarDays.length} dias — ${FERIADOS.length} feriados nacionais`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
