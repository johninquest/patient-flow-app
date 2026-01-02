<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { Button, Card, Input, Select } from '$lib/components';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { expenseService, propertyService, unitService } from '$lib/services';
    import { getCurrencyByCountry } from '$lib/types/currency.types';
    import { expenseCategories, type ExpenseCategory } from '$lib/types';
    import { validateExpense } from '$lib/validation';
    import { t } from '$lib/i18n';
    import type { Expense, Property, Unit } from '$lib/types';

    let expense = $state<Expense | null>(null);
    let property = $state<Property | null>(null);
    let units = $state<Unit[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);
    let fieldErrors = $state<Record<string, string>>({});

    let formData = $state({
        category: 'maintenance' as ExpenseCategory,
        description: '',
        amount: 0,
        expense_date: '',
        vendor: '',
        unit: ''
    });

    const categoryOptions = expenseCategories.map((c) => ({ value: c.value, label: c.label }));

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

            // Set form data
            formData = {
                category: expense.category as ExpenseCategory,
                description: expense.description,
                amount: expense.amount,
                expense_date: expense.expense_date.split('T')[0],
                vendor: expense.vendor || '',
                unit: expense.unit || ''
            };

            // Load property details
            if (expense.property) {
                property = await propertyService.getById(expense.property);
                units = await unitService.getByProperty(expense.property);
            }
        } catch (err) {
            console.error('Failed to load expense:', err);
            error = err instanceof Error ? err.message : 'Failed to load expense';
        } finally {
            loading = false;
        }
    }

    function clearFieldError(field: string) {
        if (fieldErrors[field]) {
            const { [field]: _, ...rest } = fieldErrors;
            fieldErrors = rest;
        }
    }

    function getCurrencyCode(): string {
        if (!property) return '';
        const currency = getCurrencyByCountry(property.country);
        return currency?.code ?? '';
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = null;

        // Validate form
        const validation = validateExpense({
            property: expense?.property || '',
            category: formData.category,
            description: formData.description,
            amount: formData.amount,
            expense_date: formData.expense_date
        });
        fieldErrors = validation.errors;

        if (!validation.valid) {
            error = 'Please fix the errors below';
            return;
        }

        saving = true;

        try {
            const data = {
                category: formData.category,
                description: formData.description,
                amount: formData.amount,
                expense_date: formData.expense_date,
                vendor: formData.vendor || undefined,
                unit: formData.unit || undefined
            };

            await expenseService.update(expense!.id, data);
            goto(property ? `/properties/${property.id}?tab=expenses` : `/expenses/${expense!.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update expense';
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>Edit Expense | Popati</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="space-y-6">
        <div class="flex items-center gap-3">
            <Tooltip text={$t('tooltip.back')} position="bottom">
                <button
                    onclick={() => goto(`/expenses/${expense?.id}`)}
                    class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    aria-label={$t('tooltip.back')}
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </Tooltip>
            <div>
                <h1 class="text-2xl font-bold text-neutral-900">Edit Expense</h1>
                <p class="text-neutral-500">Update expense details</p>
            </div>
        </div>

        {#if loading}
            <Card>
                <div class="flex items-center justify-center py-8">
                    <svg class="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            </Card>
        {:else}
            <Card>
                <form onsubmit={handleSubmit} class="space-y-4">
                    {#if error}
                        <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
                    {/if}

                    <!-- Property (Read-only) -->
                    <div class="space-y-1.5">
                        <p class="block text-sm font-medium text-neutral-700">Property</p>
                        <div class="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900">
                            {property?.name || '—'}
                        </div>
                    </div>

                    <!-- Unit -->
                    {#if units.length > 0}
                        <Select
                            label="Unit"
                            bind:value={formData.unit}
                            options={[
                                { value: '', label: 'Property-wide expense' },
                                ...units.map((u) => ({ 
                                    value: u.id, 
                                    label: `${u.unit_number}${u.unit_name ? ` - ${u.unit_name}` : ''}` 
                                }))
                            ]}
                        />
                    {/if}

                    <!-- Category -->
                    <Select
                        label="Category"
                        bind:value={formData.category}
                        options={categoryOptions}
                        onchange={() => clearFieldError('category')}
                        error={fieldErrors.category}
                        required
                    />

                    <!-- Description -->
                    <div class="space-y-1.5">
                        <label for="description" class="block text-sm font-medium text-neutral-700">
                            Description <span class="text-red-500">*</span>
                        </label>
                        <textarea
                            id="description"
                            bind:value={formData.description}
                            oninput={() => clearFieldError('description')}
                            placeholder="e.g., Plumbing repair for kitchen sink"
                            rows="3"
                            required
                            class="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        ></textarea>
                        {#if fieldErrors.description}
                            <p class="text-sm text-red-600">{fieldErrors.description}</p>
                        {/if}
                    </div>

                    <!-- Amount & Date -->
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="space-y-1.5">
                            <label for="amount" class="block text-sm font-medium text-neutral-700">
                                Amount {#if getCurrencyCode()}<span class="text-neutral-500 font-normal">({getCurrencyCode()})</span>{/if} <span class="text-red-500">*</span>
                            </label>
                            <input
                                id="amount"
                                type="number"
                                bind:value={formData.amount}
                                oninput={() => clearFieldError('amount')}
                                step="0.01"
                                min="0"
                                placeholder="Enter amount"
                                required
                                class="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                            {#if fieldErrors.amount}
                                <p class="text-sm text-red-600">{fieldErrors.amount}</p>
                            {/if}
                        </div>

                        <Input
                            id="expense_date"
                            type="date"
                            label="Expense Date"
                            bind:value={formData.expense_date}
                            error={fieldErrors.expense_date}
                            required
                        />
                    </div>

                    <!-- Vendor -->
                    <Input
                        id="vendor"
                        label="Vendor"
                        bind:value={formData.vendor}
                        placeholder="e.g., ABC Plumbing (Optional)"
                    />

                    <div class="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onclick={() => goto(`/expenses/${expense?.id}`)}>Cancel</Button>
                        <Button type="submit" loading={saving}>Save Changes</Button>
                    </div>
                </form>
            </Card>
        {/if}
    </div>
</div>