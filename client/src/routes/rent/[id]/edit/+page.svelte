<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { Button, Card, Input, Select } from '$lib/components';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { rentService, tenantService, propertyService } from '$lib/services';
    import { getCurrencyByCountryCode } from '$lib/types/currency.types';
    import { paymentMethods, type PaymentMethod } from '$lib/types';
    import { validateRentEntry } from '$lib/validation';
    import { t } from '$lib/i18n';
    import type { RentEntry, Tenant, Property } from '$lib/types';

    let rentEntry = $state<RentEntry | null>(null);
    let tenant = $state<Tenant | null>(null);
    let property = $state<Property | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);
    let fieldErrors = $state<Record<string, string>>({});

    // Separate month and year selections
    let selectedMonth = $state<string>('01');
    let selectedYear = $state<string>(new Date().getFullYear().toString());

    let formData = $state({
        amount: 0,
        payment_date: '',
        rent_month: '',
        payment_method: 'cash' as PaymentMethod,
        notes: ''
    });

    const monthOptions = [
        { value: '01', label: 'January' },
        { value: '02', label: 'February' },
        { value: '03', label: 'March' },
        { value: '04', label: 'April' },
        { value: '05', label: 'May' },
        { value: '06', label: 'June' },
        { value: '07', label: 'July' },
        { value: '08', label: 'August' },
        { value: '09', label: 'September' },
        { value: '10', label: 'October' },
        { value: '11', label: 'November' },
        { value: '12', label: 'December' }
    ];

    function generateYearOptions(): { value: string; label: string }[] {
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let i = currentYear - 3; i <= currentYear + 3; i++) {
            years.push({ value: String(i), label: String(i) });
        }
        return years;
    }

    const yearOptions = generateYearOptions();

    onMount(async () => {
        await loadData();
    });

    async function loadData() {
        loading = true;
        error = null;
        const rentId = page.params.id;

        if (!rentId) {
            error = 'Rent entry ID is required';
            loading = false;
            return;
        }

        try {
            rentEntry = await rentService.getById(rentId);

            // Parse rent_month
            const [year, month] = rentEntry.rent_month.split('-');
            selectedYear = year;
            selectedMonth = month;

            // Set form data
            formData = {
                amount: rentEntry.amount,
                payment_date: rentEntry.payment_date.split('T')[0],
                rent_month: rentEntry.rent_month,
                payment_method: rentEntry.payment_method,
                notes: rentEntry.notes || ''
            };

            // Load tenant details
            if (rentEntry.tenant) {
                tenant = await tenantService.getById(rentEntry.tenant);

                // Load property details
                if (tenant.property) {
                    property = await propertyService.getById(tenant.property);
                }
            }
        } catch (err) {
            console.error('Failed to load rent entry:', err);
            error = err instanceof Error ? err.message : 'Failed to load rent entry';
        } finally {
            loading = false;
        }
    }

    function handleMonthChange(value: string) {
        selectedMonth = value;
        updateRentMonth();
    }

    function handleYearChange(value: string) {
        selectedYear = value;
        updateRentMonth();
    }

    function updateRentMonth() {
        formData.rent_month = `${selectedYear}-${selectedMonth}`;
        clearFieldError('rent_month');
    }

    function clearFieldError(field: string) {
        if (fieldErrors[field]) {
            const { [field]: _, ...rest } = fieldErrors;
            fieldErrors = rest;
        }
    }

    function getCurrencyCode(): string {
        if (!property) return '';
        const currency = getCurrencyByCountryCode(property.country);
        return currency?.currencyCode ?? '';
    }

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = null;

        // Validate form
        const validation = validateRentEntry(
            {
                tenant: rentEntry?.tenant || '',
                amount: formData.amount,
                payment_date: formData.payment_date,
                rent_month: formData.rent_month,
                payment_method: formData.payment_method
            },
            property?.id || ''
        );
        fieldErrors = validation.errors;

        if (!validation.valid) {
            error = 'Please fix the errors below';
            return;
        }

        saving = true;

        try {
            await rentService.update(rentEntry!.id, formData);
            goto(property ? `/properties/${property.id}?tab=rents` : `/rent/${rentEntry!.id}`);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update rent entry';
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>Edit Rent Entry | Popati</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="space-y-6">
        <div class="flex items-center gap-3">
            <Tooltip text={$t('tooltip.back')} position="bottom">
                <button
                    onclick={() => goto(`/rent/${rentEntry?.id}`)}
                    class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    aria-label={$t('tooltip.back')}
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </Tooltip>
            <div>
                <h1 class="text-2xl font-bold text-neutral-900">Edit Rent Entry</h1>
                <p class="text-neutral-500">Update rent payment details</p>
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

                    <!-- Property & Tenant (Read-only) -->
                    <div class="grid gap-4 sm:grid-cols-2">
                        <div class="space-y-1.5">
                            <div class="block text-sm font-medium text-neutral-700">Property</div>
                            <div class="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900">
                                {property?.name || '—'}
                            </div>
                        </div>
                        <div class="space-y-1.5">
                            <div class="block text-sm font-medium text-neutral-700">Tenant</div>
                            <div class="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-2 text-neutral-900">
                                {tenant ? `${tenant.first_name} ${tenant.last_name}` : '—'}
                            </div>
                        </div>
                    </div>

                    <!-- Amount -->
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

                    <!-- Payment Date -->
                    <Input
                        id="payment_date"
                        type="date"
                        label="Payment Date"
                        bind:value={formData.payment_date}
                        error={fieldErrors.payment_date}
                        required
                    />

                    <!-- Rent Month -->
                    <fieldset class="space-y-1.5">
                        <legend class="block text-sm font-medium text-neutral-700">
                            Rent Month <span class="text-red-500">*</span>
                        </legend>
                        <div class="grid gap-4 sm:grid-cols-2">
                            <Select
                                value={selectedMonth}
                                options={monthOptions}
                                onchange={handleMonthChange}
                                required
                            />
                            <Select
                                value={selectedYear}
                                options={yearOptions}
                                onchange={handleYearChange}
                                required
                            />
                        </div>
                        {#if fieldErrors.rent_month}
                            <p class="text-sm text-red-600">{fieldErrors.rent_month}</p>
                        {/if}
                    </fieldset>

                    <!-- Payment Method -->
                    <Select
                        label="Payment Method"
                        bind:value={formData.payment_method}
                        options={paymentMethods.map(pm => ({ value: pm.value, label: pm.label }))}
                        onchange={() => clearFieldError('payment_method')}
                        error={fieldErrors.payment_method}
                        required
                    />

                    <!-- Notes -->
                    <div class="space-y-1.5">
                        <label for="notes" class="block text-sm font-medium text-neutral-700">Notes</label>
                        <textarea
                            id="notes"
                            bind:value={formData.notes}
                            rows="3"
                            placeholder="Optional notes about this payment"
                            class="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        ></textarea>
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onclick={() => goto(`/rent/${rentEntry?.id}`)}>Cancel</Button>
                        <Button type="submit" loading={saving}>Save Changes</Button>
                    </div>
                </form>
            </Card>
        {/if}
    </div>
</div>