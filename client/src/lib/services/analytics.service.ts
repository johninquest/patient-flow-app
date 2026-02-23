import { api } from '$lib/api/client';
import type { PropertyStats } from '$lib/types/analytics.types';

export const analyticsService = {
    /**
     * Get aggregated stats for a property by year
     */
    async getPropertyStats(propertyId: string, year?: number): Promise<PropertyStats> {
        const params = new URLSearchParams();
        if (year !== undefined) {
            params.append('year', year.toString());
        }
        const queryString = params.toString();
        const url = `/analytics/property/${propertyId}/stats${queryString ? `?${queryString}` : ''}`;
        return api.get<PropertyStats>(url);
    },
};