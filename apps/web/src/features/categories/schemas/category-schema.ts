import { z } from "zod";

export const categoryKindOptions = [
  { value: "EXPENSE", label: "Despesa" },
  { value: "INCOME", label: "Receita" },
] as const;

export const categorySchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  kind: z.enum(["INCOME", "EXPENSE"]),
  color: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
