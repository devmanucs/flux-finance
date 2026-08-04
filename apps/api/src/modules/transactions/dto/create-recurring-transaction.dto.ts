import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";
import { CreateTransactionDto } from "./create-transaction.dto";

export class CreateRecurringTransactionDto extends CreateTransactionDto {
  // A cada quantos meses repete (1 = todo mês, 2 = bimestral...).
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(24)
  repeatEveryMonths!: number;

  // Quantas ocorrências gerar no total (incluindo a primeira).
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(60)
  occurrences!: number;
}
