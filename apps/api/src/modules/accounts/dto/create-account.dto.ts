import { AccountType } from "@flux-finance/database";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateIf,
} from "class-validator";

export class CreateAccountDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(AccountType)
  type!: AccountType;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  balance?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  // Dia do mês (1-31) em que a fatura/conta vence, recorrente todo ciclo.
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31)
  dueDay?: number | null;

  // Marca a fatura do ciclo atual como paga (o service traduz isso pra um
  // timestamp `paidAt`, comparado ao ciclo vigente).
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  // Dinheiro guardado (poupança/investimento reservado): fora do saldo
  // total, mas soma no patrimônio líquido.
  @IsOptional()
  @IsBoolean()
  isReserved?: boolean;
}
