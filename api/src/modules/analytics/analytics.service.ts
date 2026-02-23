import { Injectable, ForbiddenException } from '@nestjs/common';
import { db } from '../../core/db';
import { rent_entries, expenses, tenants } from '../../core/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { canAccessProperty } from '../../core/common/access.util';

export interface MonthlyStats {
    month: string; // Format: "YYYY-MM"
    collected: number;
    expenses: number;
    net: number;
}

export interface PropertyStats {
    year: number;
    total_collected: number;
    total_expenses: number;
    net_income: number;
    monthly: MonthlyStats[];
}

@Injectable()
export class AnalyticsService {
    async getPropertyStats(
        propertyId: string,
        userId: string,
        year?: number,
    ): Promise<PropertyStats> {
        const targetYear = year ?? new Date().getFullYear();

        const hasAccess = await canAccessProperty(propertyId, userId);
        if (!hasAccess) {
            throw new ForbiddenException('Access denied');
        }

        // Rent: group by rent_month (already "YYYY-MM" string) for the target year
        const rentRows = await db
            .select({
                month: rent_entries.rent_month,
                total: sql<string>`CAST(SUM(CAST(${rent_entries.amount} AS DECIMAL)) AS TEXT)`,
            })
            .from(rent_entries)
            .innerJoin(tenants, eq(rent_entries.tenant, tenants.id))
            .where(
                and(
                    eq(tenants.property, propertyId),
                    sql`${rent_entries.rent_month} LIKE ${`${targetYear}-%`}`,
                ),
            )
            .groupBy(rent_entries.rent_month);

        // Expenses: group by truncated month from expense_date for the target year
        const expenseRows = await db
            .select({
                month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${expenses.expense_date}), 'YYYY-MM')`,
                total: sql<string>`CAST(SUM(CAST(${expenses.amount} AS DECIMAL)) AS TEXT)`,
            })
            .from(expenses)
            .where(
                and(
                    eq(expenses.property, propertyId),
                    sql`EXTRACT(YEAR FROM ${expenses.expense_date}) = ${targetYear}`,
                ),
            )
            .groupBy(sql`DATE_TRUNC('month', ${expenses.expense_date})`);

        // Build lookup maps
        const rentByMonth = new Map<string, number>(
            rentRows.map((r) => [r.month, parseFloat(r.total ?? '0')]),
        );
        const expenseByMonth = new Map<string, number>(
            expenseRows.map((e) => [e.month, parseFloat(e.total ?? '0')]),
        );

        // Merge into full 12-month array — emit only months with data
        const allMonths = new Set([
            ...rentByMonth.keys(),
            ...expenseByMonth.keys(),
        ]);

        const monthly: MonthlyStats[] = Array.from(allMonths)
            .sort()
            .map((month) => {
                const collected = rentByMonth.get(month) ?? 0;
                const exp = expenseByMonth.get(month) ?? 0;
                return {
                    month,
                    collected,
                    expenses: exp,
                    net: collected - exp,
                };
            });

        const total_collected = monthly.reduce((sum, m) => sum + m.collected, 0);
        const total_expenses = monthly.reduce((sum, m) => sum + m.expenses, 0);

        return {
            year: targetYear,
            total_collected,
            total_expenses,
            net_income: total_collected - total_expenses,
            monthly,
        };
    }
}