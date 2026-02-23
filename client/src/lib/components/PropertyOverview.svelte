<script lang="ts">
    import { analyticsService } from '$lib/services/analytics.service';
    import { getCurrencyByCountryCode } from '$lib/types/currency.types';
    import type { PropertyStats } from '$lib/types/analytics.types';
    import Card from './Card.svelte';
    import EmptyState from './EmptyState.svelte';

    interface Props {
        propertyId: string;
        country: string;
        activeTab: string;
    }

    let { propertyId, country, activeTab }: Props = $props();

    let stats = $state<PropertyStats | null>(null);
    let loading = $state(false);
    let error = $state<string | null>(null);

    const currentYear = new Date().getFullYear();

    const MONTH_LABELS = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    function formatCurrency(amount: number): string {
        const currency = getCurrencyByCountryCode(country);
        const symbol = currency?.symbol ?? currency?.currencyCode ?? '';
        return `${symbol} ${amount.toLocaleString()}`;
    }

    function getMonthLabel(yearMonth: string): string {
        const month = parseInt(yearMonth.split('-')[1], 10);
        return MONTH_LABELS[month - 1] ?? yearMonth;
    }

    // Build a full 12-month array, filling gaps with zeroes
    const monthlyRows = $derived(() => {
        if (!stats) return [];
        return MONTH_LABELS.map((label, idx) => {
            const monthStr = `${currentYear}-${String(idx + 1).padStart(2, '0')}`;
            const entry = stats!.monthly.find((m) => m.month === monthStr);
            return {
                label,
                collected: entry?.collected ?? 0,
                expenses: entry?.expenses ?? 0,
                net: entry?.net ?? 0,
            };
        });
    });

    const hasAnyData = $derived(
        stats !== null &&
        (stats.total_collected > 0 || stats.total_expenses > 0)
    );

    async function loadStats() {
        if (!propertyId || loading) return;
        loading = true;
        error = null;
        try {
            stats = await analyticsService.getPropertyStats(propertyId, currentYear);
        } catch (err) {
            console.error('Failed to load property stats:', err);
            error = 'Failed to load stats';
        } finally {
            loading = false;
        }
    }

    // Same lazy-load pattern as the activity tab in [id]/+page.svelte
    $effect(() => {
        if (activeTab === 'overview' && propertyId && !stats) {
            loadStats();
        }
    });
</script>

{#if loading}
    <Card>
        <div class="flex items-center justify-center py-12">
            <svg class="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        </div>
    </Card>

{:else if error}
    <Card>
        <div class="rounded bg-red-50 border border-red-200 p-4 text-red-700 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button
                onclick={loadStats}
                class="ml-4 text-red-600 underline hover:text-red-800 text-xs font-medium"
            >
                Retry
            </button>
        </div>
    </Card>

{:else if !hasAnyData}
    <EmptyState
        title="No data yet"
        description="Stats will appear here once rent payments and expenses are recorded for this property."
    />

{:else if stats}
    <div class="space-y-6">

        <!-- Year heading -->
        <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-900">{currentYear} Summary</h2>
        </div>

        <!-- KPI Cards -->
        <div class="grid gap-4 sm:grid-cols-3">

            <!-- Collected -->
            <Card>
                <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Collected This Year
                    </p>
                    <p class="text-2xl font-bold text-green-600">
                        {formatCurrency(stats.total_collected)}
                    </p>
                </div>
            </Card>

            <!-- Expenses -->
            <Card>
                <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Expenses This Year
                    </p>
                    <p class="text-2xl font-bold text-red-500">
                        {formatCurrency(stats.total_expenses)}
                    </p>
                </div>
            </Card>

            <!-- Net Income — green if positive, red if negative -->
            <Card>
                <div class="space-y-1">
                    <p class="text-xs font-medium uppercase tracking-wider text-neutral-500">
                        Net Income
                    </p>
                    <p class="text-2xl font-bold {stats.net_income >= 0 ? 'text-green-600' : 'text-red-500'}">
                        {formatCurrency(stats.net_income)}
                    </p>
                    {#if stats.net_income < 0}
                        <p class="text-xs text-red-400">Expenses exceed collected rent</p>
                    {/if}
                </div>
            </Card>

        </div>

        <!-- Monthly Breakdown Table -->
        <Card>
            <h3 class="text-sm font-semibold text-neutral-700 mb-4">Monthly Breakdown</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-neutral-200">
                    <thead class="bg-neutral-50">
                        <tr>
                            <th class="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Month
                            </th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Collected
                            </th>
                            <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Expenses
                            </th>
                            <!-- Net column hidden for now -->
                            <!-- <th class="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                                Net
                            </th> -->
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-neutral-100 bg-white">
                        {#each monthlyRows() as row}
                            {@const isEmpty = row.collected === 0 && row.expenses === 0}
                            <tr class={isEmpty ? 'opacity-40' : 'hover:bg-neutral-50'}>
                                <td class="px-4 py-2.5 text-sm text-neutral-700">{row.label}</td>
                                <td class="px-4 py-2.5 text-sm text-right {row.collected > 0 ? 'text-green-600 font-medium' : 'text-neutral-400'}">
                                    {row.collected > 0 ? formatCurrency(row.collected) : '—'}
                                </td>
                                <td class="px-4 py-2.5 text-sm text-right {row.expenses > 0 ? 'text-red-500 font-medium' : 'text-neutral-400'}">
                                    {row.expenses > 0 ? formatCurrency(row.expenses) : '—'}
                                </td>
                                <!-- Net column hidden for now -->
                                <!-- <td class="px-4 py-2.5 text-sm text-right font-medium {row.net > 0 ? 'text-green-600' : row.net < 0 ? 'text-red-500' : 'text-neutral-400'}">
                                    {row.collected > 0 || row.expenses > 0 ? formatCurrency(row.net) : '—'}
                                </td> -->
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </Card>

    </div>
{/if}