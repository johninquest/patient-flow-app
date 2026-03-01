<script lang="ts">
    import { useRegisterSW } from 'virtual:pwa-register/svelte';
    import { browser } from '$app/environment';

    const {
        needRefresh,
        offlineReady,
        updateServiceWorker
    } = useRegisterSW({
        immediate: true,
        onRegistered(registration: ServiceWorkerRegistration | undefined) {
            console.log('[PWA] Service worker registered');
            if (registration) {
                // Check for updates every 2 minutes
                setInterval(() => {
                    console.log('[PWA] Periodic update check...');
                    registration.update();
                }, 2 * 60 * 1000);
                
                if (browser) {
                    // Check when app comes to foreground (critical for mobile PWAs)
                    document.addEventListener('visibilitychange', () => {
                        if (document.visibilityState === 'visible') {
                            console.log('[PWA] App visible, checking for updates...');
                            registration.update();
                        }
                    });

                    // Check on network reconnect
                    window.addEventListener('online', () => {
                        console.log('[PWA] Back online, checking for updates...');
                        registration.update();
                    });

                    // Check on window focus
                    window.addEventListener('focus', () => {
                        console.log('[PWA] Window focused, checking for updates...');
                        registration.update();
                    });
                }
            }
        },
        onRegisterError(error: Error) {
            console.error('[PWA] SW registration error:', error);
        },
        onNeedRefresh() {
            console.log('[PWA] New content available - auto-reloading');
        },
        onOfflineReady() {
            console.log('[PWA] App ready to work offline');
        }
    });

    // Auto-reload immediately when update is available - no user prompt
    $effect(() => {
        if ($needRefresh && browser) {
            // Small delay to let SW activate, then force reload
            const timeout = setTimeout(() => {
                console.log('[PWA] Auto-updating now...');
                updateServiceWorker(true);
            }, 1500);

            return () => clearTimeout(timeout);
        }
    });
</script>

<!-- No UI needed - updates happen automatically -->
{#if $offlineReady}
    <!-- Optional: brief offline ready indicator -->
{/if}