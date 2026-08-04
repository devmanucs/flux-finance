function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Próxima ocorrência do dia de vencimento (hoje inclusive), lidando com meses curtos. */
export function computeDueDate(dueDay: number | null, referenceDate = new Date()): Date | null {
  if (!dueDay) return null;

  const today = startOfDay(referenceDate);
  const clampedDay = (year: number, month: number) => Math.min(dueDay, daysInMonth(year, month));

  let candidate = new Date(today.getFullYear(), today.getMonth(), clampedDay(today.getFullYear(), today.getMonth()));

  if (candidate < today) {
    const nextMonthIndex = today.getMonth() + 1;
    const year = today.getFullYear() + Math.floor(nextMonthIndex / 12);
    const month = nextMonthIndex % 12;
    candidate = new Date(year, month, clampedDay(year, month));
  }

  return candidate;
}

/** Início do ciclo atual: o dia seguinte ao vencimento anterior. */
function computeCycleStart(dueDay: number, referenceDate = new Date()): Date {
  const currentDue = computeDueDate(dueDay, referenceDate) as Date;
  const cycleStart = new Date(currentDue);
  cycleStart.setMonth(cycleStart.getMonth() - 1);
  cycleStart.setDate(cycleStart.getDate() + 1);
  return cycleStart;
}

/**
 * "Paga" só conta pro ciclo vigente: se `paidAt` for de um ciclo anterior
 * (ex.: você marcou como paga mês passado e não mexeu mais na conta), o
 * status volta a ser "não paga" sozinho, sem precisar recadastrar.
 */
export function computeEffectiveIsPaid(
  dueDay: number | null,
  paidAt: Date | null,
  referenceDate = new Date(),
): boolean {
  if (!paidAt) return false;
  if (!dueDay) return true;
  return paidAt >= computeCycleStart(dueDay, referenceDate);
}
