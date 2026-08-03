const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toNumber(value: unknown) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  // Cobre string e Decimal do Prisma (que vira string no JSON / tem valueOf).
  const parsed = Number(value as string | number);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Formata valor como moeda BRL (`R$ 1.234,56`). */
export function formatMoney(value: unknown) {
  return moneyFormatter.format(toNumber(value));
}

/** Formata só o número com 2 casas (`1.234,56`), sem símbolo. */
export function formatMoneyNumber(value: unknown) {
  return numberFormatter.format(toNumber(value));
}

/**
 * Converte texto mascarado/digitado em número.
 * Aceita `R$ 1.234,56`, `1234,56` ou só dígitos.
 */
export function parseMoney(value: string) {
  if (!value) return 0;

  const cleaned = value.replace(/[^\d,.-]/g, "");
  if (!cleaned) return 0;

  const hasComma = cleaned.includes(",");
  const normalized = hasComma
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Interpreta a entrada do usuário como centavos digitados.
 * Digitar `1234` vira `12,34`.
 */
export function moneyFromInputDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}
