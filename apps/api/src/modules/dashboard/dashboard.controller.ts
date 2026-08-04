import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  summary(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.summary(user.id);
  }

  @Get("cashflow")
  cashflow(@CurrentUser() user: AuthenticatedUser, @Query("range") range?: string) {
    return this.dashboardService.cashflow(user.id, range ?? "6");
  }

  @Get("by-category")
  byCategory(@CurrentUser() user: AuthenticatedUser, @Query("month") month?: string) {
    return this.dashboardService.byCategory(user.id, month);
  }
}
