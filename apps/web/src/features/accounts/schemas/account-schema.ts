import { z } from "zod";

export const accountTypeOptions = [
  { value: "CHECKING", label: "Conta corrente" },
  { value: "SAVINGS", label: "Poupança" },
  { value: "CREDIT_CARD", label: "Cartão de crédito" },
  { value: "INVESTMENT", label: "Investimento" },
  { value: "CASH", label: "Dinheiro" },
  { value: "MEAL_VOUCHER", label: "Vale-alimentação/refeição" },
] as const;

// Tipos de conta cujo saldo é dívida (quanto você deve), não saldo positivo.
export const DEBT_ACCOUNT_TYPES = ["CREDIT_CARD"] as const;

// Tipos de conta onde faz sentido oferecer a opção "guardado" (poupança,
// dinheiro reservado que não deve contar no saldo total gastável).
export const RESERVABLE_ACCOUNT_TYPES = ["SAVINGS", "INVESTMENT"] as const;

export const accountSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["CHECKING", "SAVINGS", "CREDIT_CARD", "INVESTMENT", "CASH", "MEAL_VOUCHER"]),
  balance: z.coerce.number().optional(),
  currency: z.string().min(1).default("BRL"),
  dueDay: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .refine(
      (value) =>
        value === null || value === undefined || value === "" || (Number(value) >= 1 && Number(value) <= 31),
      { message: "Dia inválido (1 a 31)" },
    ),
  isPaid: z.boolean().default(false),
  isReserved: z.boolean().default(false),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
