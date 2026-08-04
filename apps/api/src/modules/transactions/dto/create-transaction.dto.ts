import { TransactionKind } from "@flux-finance/database";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreateTransactionDto {
  @Type(() => Number)
  @IsInt()
  accountId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  categoryId?: number;

  @IsString()
  @MinLength(1)
  description!: string;

  @IsNumber()
  amount!: number;

  @IsEnum(TransactionKind)
  kind!: TransactionKind;

  @IsOptional()
  @IsDateString()
  date?: string;

  // Vencimento pontual (ex.: boleto, aluguel). Null limpa o vencimento.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsDateString()
  dueDate?: string | null;

  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;
}
