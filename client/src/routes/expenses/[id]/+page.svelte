<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { Button, Card, ConfirmDialog } from '$lib/components';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { expenseService, propertyService, unitService } from '$lib/services';
    import { getCurrencyByCountry } from '$lib/types/currency.types';
    import { expenseCategories } from '$lib/types';
    import { t } from '$lib/i18n';
    import type { Expense, Property, Unit } from '$lib/types';

    let expense = $state<Expense | null>(null);
    let property = $state<Property | null>(null);
    let unit = $state<Unit | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let deleteDialogOpen = $state(false);

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        loading = true;
        error = null;
        const expenseId = page.params.id;

        if (!expenseId) {
            error = 'Expense ID is required';
            loading = false;
            return;
        }

        try {
            expense = await expenseService.getById(expenseId);
            
            // Load property details
            if (expense.property) {
                property = await propertyService.getById(expense.property);
            }

            // Load unit details if applicable
            if (expense.unit) {
                unit = await unitService.getById(expense.unit);
            }
        } catch (err) {
            console.error('Failed to load expense:', err);
            error = err instanceof Error ? err.message : 'Failed to load expense';
        } finally {
            loading = false;
        }
    }

    async function handleDelete() {
        if (!expense) return;

        try {
            await expenseService.delete(expense.id);
            goto(property ? `/properties/${property.id}?tab=expenses` : '/expenses');
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete expense';
        }
    }

    function formatCurrency(amount: number): string {
        if (!property) return amount.toLocaleString();
        const currency = getCurrencyByCountry(property.country);
        return `${currency?.symbol ?? currency?.code ?? ''} ${amount.toLocaleString()}`;
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function getCategoryLabel(value: string): string {
        const cat = expenseCategories.find((c) => c.value === value);
        return cat?.label ?? value;
    }
</script>

<svelte:head>
    <title>{expense ? 'Expense Details' : 'Expense'} | Popati</title>
</svelte:head>

{#if loading}
    <div class="flex items-center justify-center py-12">
        <svg class="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    </div>
{:else if error && !expense}
    <div class="mx-auto max-w-2xl px-4 py-8">
        <Card>
            <p class="text-red-600">{error}</p>
            <Button variant="secondary" onclick={loadData} class="mt-2">Retry</Button>
        </Card>
    </div>
{:else if expense}
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <Tooltip text={$t('tooltip.back')} position="bottom">
                        <button
                            onclick={() => goto(property ? `/properties/${property.id}?tab=expenses` : '/expenses')}
                            class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                            aria-label={$t('tooltip.back')}
                        >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Tooltip>
                    <div>
                        <h1 class="text-2xl font-bold text-neutral-900">Expense Details</h1>
                        <p class="text-neutral-500 text-sm mt-1">
                            {getCategoryLabel(expense.category)}
                        </p>
                    </div>
                </div>
            </div>

            {#if error}
                <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
            {/if}

            <!-- Details Card -->
            <Card>
                <h2 class="text-lg font-semibold text-neutral-900 mb-4">Expense Information</h2>
                
                <dl class="grid gap-4 sm:grid-cols-2">
                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Property</dt>
                        <dd class="mt-1 text-neutral-900">
                            {#if property}
                                <a href="/properties/{property.id}" class="text-brand-600 hover:text-brand-700 hover:underline">
                                    {property.name}
                                </a>
                            {:else}
                                —
                            {/if}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Unit</dt>
                        <dd class="mt-1 text-neutral-900">
                            {#if unit}
                                <a href="/units/{unit.id}" class="text-brand-600 hover:text-brand-700 hover:underline">
                                    {unit.unit_number}{unit.unit_name ? ` - ${unit.unit_name}` : ''}
                                </a>
                            {:else}
                                <span class="text-neutral-500">Property-wide</span>
                            {/if}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Category</dt>
                        <dd class="mt-1">
                            <span class="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                                {getCategoryLabel(expense.category)}
                            </span>
                        </dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Amount</dt>
                        <dd class="mt-1 text-red-600 font-semibold text-lg">
                            {formatCurrency(expense.amount)}
                        </dd>
                    </div>

                    <div class="sm:col-span-2">
                        <dt class="text-sm font-medium text-neutral-500">Description</dt>
                        <dd class="mt-1 text-neutral-900 whitespace-pre-wrap">{expense.description}</dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Expense Date</dt>
                        <dd class="mt-1 text-neutral-900">{formatDate(expense.expense_date)}</dd>
                    </div>

                    {#if expense.vendor}
                        <div>
                            <dt class="text-sm font-medium text-neutral-500">Vendor</dt>
                            <dd class="mt-1 text-neutral-900">{expense.vendor}</dd>
                        </div>
                    {/if}

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Recorded</dt>
                        <dd class="mt-1 text-neutral-600 text-sm">{formatDate(expense.created)}</dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Last Updated</dt>
                        <dd class="mt-1 text-neutral-600 text-sm">{formatDate(expense.updated)}</dd>
                    </div>
                </dl>
            </Card>

            <!-- Actions -->
            <Card>
                <div class="flex gap-3 justify-end">
                    <Button variant="secondary" onclick={() => goto(`/expenses/${expense?.id}/edit`)}>
                        Edit
                    </Button>
                    <Button variant="danger" onclick={() => (deleteDialogOpen = true)}>
                        Delete
                    </Button>
                </div>
            </Card>
        </div>
    </div>

    <ConfirmDialog
        bind:open={deleteDialogOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        onconfirm={handleDelete}
    />
{/if}