import { z } from "zod";

// Ainda não existe uma feature de contas: usamos a conta demo criada pelo
// seed (packages/database/prisma/seed.ts, id=1). Postgres tem FK de verdade
// agora, então precisa ser o id de uma conta que exista mesmo — troque pelo
// id de uma conta real quando a feature `accounts` existir.
export const DEMO_ACCOUNT_ID = 1;

export const transactionKindOptions = [
  { value: "EXPENSE", label: "Despesa" },
  { value: "INCOME", label: "Receita" },
] as const;

export const transactionSchema = z.object({
  accountId: z.coerce.number().int(),
  description: z.string().min(1, "Descrição obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  kind: z.enum(["INCOME", "EXPENSE"]),
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;
