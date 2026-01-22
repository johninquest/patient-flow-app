<script lang="ts">
    import { goto } from '$app/navigation';
    import { Button, Input } from '$lib/components';
    import { propertyService } from '$lib/services';
    import { getCountryCodeList, getCountryCode } from '$lib/types/currency.types';
    import type { PropertyFormData } from '$lib/types';

    let loading = $state(false);
    let error = $state<string | null>(null);

    let formData = $state<PropertyFormData>({
        name: '',
        city: '',
        country: '',
        construction_year: undefined
    });

    const countryOptions = getCountryCodeList().map((c) => ({ 
        value: c.code, 
        label: c.name 
    }));

    async function handleSubmit(e: Event) {
        e.preventDefault();
        loading = true;
        error = null;

        try {
            const data: any = {
                name: formData.name,
                city: formData.city,
                country: formData.country, // Now sends country code
            };
            
            if (formData.construction_year !== undefined) {
                data.construction_year = formData.construction_year;
            }

            const newProperty = await propertyService.create(data);
            goto(`/properties/${newProperty.id}`);
        } catch (err) {
            console.error('Failed to create property:', err);
            error = err instanceof Error ? err.message : 'Failed to create property';
        } finally {
            loading = false;
        }
    }
</script>

<svelte:head>
    <title>Add Property | Popati</title>
</svelte:head>

<div class="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
    <div class="space-y-6">
        <div class="flex items-center gap-3">
            <button
                onclick={() => goto('/properties')}
                aria-label="Go back to properties"
                class="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
            >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
            </button>
            <h1 class="text-2xl font-semibold text-neutral-900">Add New Property</h1>
        </div>

        <div class="bg-white rounded-lg border border-neutral-200 p-6">
            <form onsubmit={handleSubmit} class="space-y-4">
                {#if error}
                    <div class="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">{error}</div>
                {/if}

                <Input
                    id="name"
                    label="Property Name"
                    bind:value={formData.name}
                    placeholder="e.g., Sunset Apartments"
                    required
                />

                <div class="grid gap-4 sm:grid-cols-2">
                    <Input id="city" label="City" bind:value={formData.city} placeholder="e.g., Nairobi" required />
                    
                    <div>
                        <label for="country" class="mb-1.5 block text-sm font-medium text-neutral-700">
                            Country <span class="text-red-500">*</span>
                        </label>
                        <select
                            id="country"
                            bind:value={formData.country}
                            required
                            class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                        >
                            <option value="" disabled>Select country</option>
                            {#each countryOptions as option}
                                <option value={option.value}>{option.label}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div>
                    <label for="construction_year" class="mb-1.5 block text-sm font-medium text-neutral-700">
                        Construction Year
                        <span class="font-normal text-neutral-500">(optional)</span>
                    </label>
                    <input
                        id="construction_year"
                        type="number"
                        min="1900"
                        max={new Date().getFullYear() + 5}
                        bind:value={formData.construction_year}
                        placeholder="e.g., 2020"
                        class="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 transition-colors focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                </div>

                <div class="flex justify-end gap-3 pt-4">
                    <Button variant="secondary" onclick={() => goto('/properties')}>Cancel</Button>
                    <Button type="submit" {loading}>Create Property</Button>
                </div>
            </form>
        </div>
    </div>
</div>