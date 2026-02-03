<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import { Button, Card, Input, Select } from '$lib/components';
    import Tooltip from '$lib/components/Tooltip.svelte';
    import { propertyService } from '$lib/services';
    import { getCountryCodeList } from '$lib/types/currency.types';
    import { t } from '$lib/i18n';
    import type { Property, PropertyFormData } from '$lib/types';

    // Extract and validate the property ID
    const propertyId = $derived(page.params.id ?? '');

    let property = $state<Property | null>(null);
    let loading = $state(true);
    let saving = $state(false);
    let error = $state<string | null>(null);

    let formData = $state<PropertyFormData>({
        name: '',
        city: '',
        country: '',
        address: '',
        construction_year: undefined
    });

    let constructionYearStr = $state<string>('');

    // Use country code list (code as value, name as label)
    const countryOptions = getCountryCodeList().map((c) => ({ value: c.code, label: c.name }));

    // Sync construction year whenever the string changes
    $effect(() => {
        formData.construction_year = constructionYearStr ? parseInt(constructionYearStr, 10) : undefined;
    });

    onMount(async () => {
        if (!propertyId) {
            error = 'Property ID is required';
            loading = false;
            return;
        }

        try {
            property = await propertyService.getById(propertyId);
            formData = {
                name: property.name,
                city: property.city,
                country: property.country,
                address: property.address || '', // ✅ Load existing address
                construction_year: property.construction_year
            };
            constructionYearStr = property.construction_year?.toString() ?? '';
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to load property';
        } finally {
            loading = false;
        }
    });

    async function handleSubmit(e: Event) {
        e.preventDefault();
        if (!propertyId) return;
        
        saving = true;
        error = null;

        try {
            const data: any = {
                name: formData.name,
                city: formData.city,
                country: formData.country,
            };

            if (formData.address && formData.address.trim()) { // ✅ Include if provided
                data.address = formData.address.trim();
            }
            
            if (constructionYearStr) {
                data.construction_year = parseInt(constructionYearStr, 10);
            }

            await propertyService.update(propertyId, data);
            goto(`/properties/${propertyId}`);
        } catch (err) {
            error = err instanceof Error ? err.message : 'Failed to update property';
        } finally {
            saving = false;
        }
    }
</script>

<svelte:head>
    <title>Edit {property?.name ?? 'Property'} | Popati</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="space-y-6">
        <div class="flex items-center gap-3">
            <Tooltip text={$t('tooltip.back')} position="bottom">
                <button
                    onclick={() => goto(`/properties/${propertyId}`)}
                    class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                    aria-label={$t('tooltip.back')}
                >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
            </Tooltip>
            <div>
                <h1 class="text-2xl font-bold text-neutral-900">Edit Property</h1>
                <p class="text-neutral-500">Update property details</p>
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

                    <div>
                        <label for="property-name" class="block text-sm font-medium text-neutral-700 mb-1.5">
                            Property Name <span class="text-red-500">*</span>
                        </label>
                        <input
                            id="property-name"
                            type="text"
                            bind:value={formData.name}
                            placeholder="e.g., Sunset Apartments"
                            required
                            class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                    </div>

                    <Input 
                        id="address" 
                        label="Address (Optional)" 
                        bind:value={formData.address} 
                        placeholder="e.g., 123 Kenyatta Avenue" 
                    />

                    <div class="grid gap-4 sm:grid-cols-2">
                        <Input id="city" label="City" bind:value={formData.city} required />
                        
                        <div>
                            <label for="country" class="block text-sm font-medium text-neutral-700 mb-1.5">
                                Country <span class="text-red-500">*</span>
                            </label>
                            <select
                                id="country"
                                bind:value={formData.country}
                                required
                                class="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                            >
                                <option value="" disabled>Select a country</option>
                                {#each countryOptions as option}
                                    <option value={option.value}>{option.label}</option>
                                {/each}
                            </select>
                        </div>
                    </div>

                    <Input id="construction-year" label="Construction Year" type="number" bind:value={constructionYearStr} placeholder="e.g., 2015" />

                    <div class="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onclick={() => goto(`/properties/${propertyId}`)}>Cancel</Button>
                        <Button type="submit" loading={saving}>Save Changes</Button>
                    </div>
                </form>
            </Card>
        {/if}
    </div>
</div>