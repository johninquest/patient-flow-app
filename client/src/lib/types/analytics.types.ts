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