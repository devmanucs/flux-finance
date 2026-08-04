import { z } from "zod";

export const transactionKindOptions = [
  { value: "EXPENSE", label: "Despesa" },
  { value: "INCOME", label: "Receita" },
] as const;

const optionalId = z.preprocess(
  (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
  z.number().int().optional(),
);

export const transactionSchema = z.object({
  accountId: z.coerce.number().int(),
  categoryId: optionalId,
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  kind: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().min(1, "Data obrigatória"),
  dueDate: z.string().optional().nullable(),
  isPaid: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  repeatEveryMonths: z.coerce.number().int().min(1).max(24).default(1),
  occurrences: z.coerce.number().int().min(2).max(60).default(12),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
