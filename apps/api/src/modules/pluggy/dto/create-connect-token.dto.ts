import { IsOptional, IsUUID } from "class-validator";

export class CreateConnectTokenDto {
  @IsOptional()
  @IsUUID()
  itemId?: string;
}
