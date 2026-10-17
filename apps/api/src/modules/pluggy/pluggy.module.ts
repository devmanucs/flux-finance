import { Module } from "@nestjs/common";
import { PluggyApiService } from "./pluggy-api.service";
import { PluggyController } from "./pluggy.controller";
import { PluggyService } from "./pluggy.service";

@Module({
  controllers: [PluggyController],
  providers: [PluggyApiService, PluggyService],
})
export class PluggyModule {}
