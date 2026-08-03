import { TransactionKind } from "@flux-finance/database";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEnum(TransactionKind)
  kind!: TransactionKind;

  @IsOptional()
  @IsString()
  color?: string;
}
