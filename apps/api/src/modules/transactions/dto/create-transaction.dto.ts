import { TransactionKind } from "@flux-finance/database";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
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
}
