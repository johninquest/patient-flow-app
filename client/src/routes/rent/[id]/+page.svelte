<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { Button, Card, ConfirmDialog } from '$lib/components';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { rentService, tenantService, propertyService } from '$lib/services';
    import { getCurrencyByCountryCode } from '$lib/types/currency.types';
    import { paymentMethods } from '$lib/types';
    import { t } from '$lib/i18n';
    import type { RentEntry, Tenant, Property } from '$lib/types';
    import { formatTimestamp } from '$lib/utils/date';

    let rentEntry = $state<RentEntry | null>(null);
    let tenant = $state<Tenant | null>(null);
    let property = $state<Property | null>(null);
    let loading = $state(true);
    let error = $state<string | null>(null);
    let deleteDialogOpen = $state(false);

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

    async function handleDelete() {
        if (!rentEntry) return;

        try {
            await rentService.delete(rentEntry.id);
            goto(property ? `/properties/${property.id}?tab=rents` : '/rent');
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to delete rent entry';
        }
    }

    function formatCurrency(amount: number): string {
        if (!property) return amount.toLocaleString();
        const currency = getCurrencyByCountryCode(property.country);
        return `${currency?.symbol ?? currency?.currencyCode ?? ''} ${amount.toLocaleString()}`;
    }

    function formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    function formatRentMonth(rentMonth: string): string {
        const [year, month] = rentMonth.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    function getPaymentMethodLabel(method: string): string {
        const pm = paymentMethods.find(m => m.value === method);
        return pm?.label ?? method;
    }
</script>

<svelte:head>
    <title>{rentEntry ? 'Rent Entry Details' : 'Rent Entry'} | Popati</title>
</svelte:head>

{#if loading}
    <div class="flex items-center justify-center py-12">
        <svg class="h-8 w-8 animate-spin text-brand-500" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    </div>
{:else if error && !rentEntry}
    <div class="mx-auto max-w-2xl px-4 py-8">
        <Card>
            <p class="text-red-600">{error}</p>
            <Button variant="secondary" onclick={loadData} class="mt-2">Retry</Button>
        </Card>
    </div>
{:else if rentEntry}
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                    <Tooltip text={$t('tooltip.back')} position="bottom">
                        <button
                            onclick={() => goto(property ? `/properties/${property.id}?tab=rents` : '/rent')}
                            class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                            aria-label={$t('tooltip.back')}
                        >
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Tooltip>
                    <div>
                        <h1 class="text-2xl font-bold text-neutral-900">Rent Payment Details</h1>
                        <p class="text-neutral-500 text-sm mt-1">
                            {formatRentMonth(rentEntry.rent_month)}
                        </p>
                    </div>
                </div>
            </div>

            {#if error}
                <div class="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">{error}</div>
            {/if}

            <!-- Details Card -->
            <Card>
                <h2 class="text-lg font-semibold text-neutral-900 mb-4">Payment Information</h2>
                
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
                        <dt class="text-sm font-medium text-neutral-500">Tenant</dt>
                        <dd class="mt-1 text-neutral-900">
                            {#if tenant}
                                <a href="/tenants/{tenant.id}" class="text-brand-600 hover:text-brand-700 hover:underline">
                                    {tenant.first_name} {tenant.last_name}
                                </a>
                            {:else if rentEntry.tenant_first_name && rentEntry.tenant_last_name}
                                {rentEntry.tenant_first_name} {rentEntry.tenant_last_name}
                            {:else}
                                —
                            {/if}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Amount</dt>
                        <dd class="mt-1 text-green-600 font-semibold text-lg">
                            {formatCurrency(rentEntry.amount)}
                        </dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Payment Method</dt>
                        <dd class="mt-1 text-neutral-900">
                            <span class="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700">
                                {getPaymentMethodLabel(rentEntry.payment_method)}
                            </span>
                        </dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Payment Date</dt>
                        <dd class="mt-1 text-neutral-900">{formatDate(rentEntry.payment_date)}</dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Rent Month</dt>
                        <dd class="mt-1 text-neutral-900">{formatRentMonth(rentEntry.rent_month)}</dd>
                    </div>

                    {#if rentEntry.notes}
                        <div class="sm:col-span-2">
                            <dt class="text-sm font-medium text-neutral-500">Notes</dt>
                            <dd class="mt-1 text-neutral-900 whitespace-pre-wrap">{rentEntry.notes}</dd>
                        </div>
                    {/if}

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Recorded</dt>
                        <dd class="mt-1 text-neutral-600 text-sm">{formatTimestamp(rentEntry.created)}</dd>
                    </div>

                    <div>
                        <dt class="text-sm font-medium text-neutral-500">Last Updated</dt>
                        <dd class="mt-1 text-neutral-600 text-sm">{formatTimestamp(rentEntry.updated)}</dd>
                    </div>
                </dl>
            </Card>

            <!-- Actions -->
            <Card>
                <div class="flex gap-3 justify-end">
                    <Button variant="secondary" onclick={() => goto(`/rent/${rentEntry?.id}/edit`)}>
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
        title="Delete Rent Entry"
        message="Are you sure you want to delete this rent payment record? This action cannot be undone."
        onconfirm={handleDelete}
    />
{/if}