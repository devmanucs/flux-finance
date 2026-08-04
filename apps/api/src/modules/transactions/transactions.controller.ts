import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { TransactionsService } from "./transactions.service";
import { CreateRecurringTransactionDto } from "./dto/create-recurring-transaction.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { UpdateTransactionDto } from "./dto/update-transaction.dto";

@Controller("transactions")
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query("month") month?: string) {
    return this.transactionsService.findAll(user.id, month);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.findOne(id, user.id);
  }

  @Post()
  create(@Body() dto: CreateTransactionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.create(dto, user.id);
  }

  @Post("recurring")
  createRecurring(
    @Body() dto: CreateRecurringTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.createRecurring(dto, user.id);
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.transactionsService.update(id, dto, user.id);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: AuthenticatedUser) {
    return this.transactionsService.remove(id, user.id);
  }
}
