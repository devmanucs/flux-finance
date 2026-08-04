function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

/** Soma meses a uma data, preservando o dia (com clamp pra meses mais curtos). */
export function addMonths(date: Date, months: number): Date {
  const day = date.getDate();
  const monthIndex = date.getMonth() + months;
  const year = date.getFullYear() + Math.floor(monthIndex / 12);
  const month = ((monthIndex % 12) + 12) % 12;

  return new Date(
    year,
    month,
    Math.min(day, daysInMonth(year, month)),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );
}
