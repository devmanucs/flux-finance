export type PaymentStatus = "paid" | "due_soon" | "overdue";

export const DUE_SOON_DAYS = 7;

export const PAYMENT_STATUS_META: Record<
  PaymentStatus,
  { label: string; shortLabel: string; dotClassName: string; badgeClassName: string }
> = {
  overdue: {
    label: "Atrasadas",
    shortLabel: "Atrasada",
    dotClassName: "bg-destructive",
    badgeClassName: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  due_soon: {
    label: "Próximas a vencer",
    shortLabel: "Próxima a vencer",
    dotClassName: "bg-amber-500",
    badgeClassName: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  paid: {
    label: "Pagas",
    shortLabel: "Paga",
    dotClassName: "bg-emerald-500",
    badgeClassName: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
};

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getPaymentStatus(item: {
  dueDate: Date | string | null;
  isPaid: boolean;
}): PaymentStatus | null {
  if (item.isPaid) return "paid";
  if (!item.dueDate) return null;

  const due = startOfDay(new Date(item.dueDate));
  const today = startOfDay(new Date());

  if (due < today) return "overdue";

  const soonLimit = startOfDay(new Date());
  soonLimit.setDate(soonLimit.getDate() + DUE_SOON_DAYS);

  if (due <= soonLimit) return "due_soon";

  return null;
}

export function isPaymentStatus(value: string | null | undefined): value is PaymentStatus {
  return value === "paid" || value === "due_soon" || value === "overdue";
}

export function getStatusCounts(items: Array<{ dueDate: Date | string | null; isPaid: boolean }>) {
  return items.reduce(
    (counts, item) => {
      const status = getPaymentStatus(item);
      if (status) counts[status] += 1;
      return counts;
    },
    { paid: 0, due_soon: 0, overdue: 0 } satisfies Record<PaymentStatus, number>,
  );
}
