import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../../core/auth/guards/auth.guard';
import { CurrentUser } from '../../core/auth/decorators/user.decorator';

@Controller('analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}

    @Get('property/:id/stats')
    getPropertyStats(
        @Param('id') id: string,
        @Query('year') year: string | undefined,
        @CurrentUser() user: any,
    ) {
        return this.analyticsService.getPropertyStats(
            id,
            user.id,
            year ? parseInt(year, 10) : undefined,
        );
    }
}