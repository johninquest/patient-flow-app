<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';
    import { APP_VERSION } from '$lib/config';

    async function checkRemoteVersion() {
        try {
            // Fetch version file with cache-busting, bypassing service worker cache
            const response = await fetch(`/version.json?_=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (!response.ok) return;
            
            const data = await response.json();
            
            if (data.version && data.version !== APP_VERSION) {
                console.log(`[Version] Remote version ${data.version} differs from local ${APP_VERSION}`);
                
                // Store new version to prevent loops
                localStorage.setItem('app-version', data.version);
                
                // Clear caches and force reload
                if ('caches' in window) {
                    const names = await caches.keys();
                    await Promise.all(names.map(name => caches.delete(name)));
                }
                
                if ('serviceWorker' in navigator) {
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(registrations.map(r => r.unregister()));
                }
                
                window.location.reload();
            }
        } catch (err) {
            // Network error - skip check silently
            console.warn('[Version] Remote check failed:', err);
        }
    }

    onMount(() => {
        if (!browser) return;

        // Immediate check on load
        checkRemoteVersion();
        
        // Check when app becomes visible (user returns to PWA after days/weeks)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                checkRemoteVersion();
            }
        });

        // Also store local version
        localStorage.setItem('app-version', APP_VERSION);
        console.log(`[Version] Current version: ${APP_VERSION}`);
    });
</script>