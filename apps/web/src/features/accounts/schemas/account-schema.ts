import { z } from "zod";

export const accountTypeOptions = [
  { value: "CHECKING", label: "Conta corrente" },
  { value: "SAVINGS", label: "Poupança" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "CASH", label: "Dinheiro" },
] as const;

// Tipos de conta cujo saldo é dívida (quanto você deve), não saldo positivo.
export const DEBT_ACCOUNT_TYPES = ["CREDIT_CARD"] as const;

export const accountSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH"]),
  balance: z.coerce.number().optional(),
  currency: z.string().min(1).default("BRL"),
  dueDate: z.string().optional().nullable(),
  isPaid: z.boolean().default(false),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
