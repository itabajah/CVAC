/**
 * Live Reload Client Script
 * 
 * Connects to the server's SSE endpoint and reloads the resume iframe
 * when file changes are detected. Includes automatic reconnection.
 */

// Live reload state
let liveReloadEventSource = null;
let liveReloadReconnectAttempts = 0;
let liveReloadStopping = false; // Flag to prevent banners when intentionally stopping
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_DELAY_MS = 2000;

/**
 * Stop live reload (call before shutting down server)
 */
function stopLiveReload() {
    liveReloadStopping = true;
    if (liveReloadEventSource) {
        liveReloadEventSource.close();
        liveReloadEventSource = null;
    }
    hideBanner('liveReloadStatus');
    hideBanner('reloadNotification');
}

/**
 * Initialize live reload SSE connection
 */
function initLiveReload() {
    if (liveReloadStopping) return; // Don't reconnect if stopping
    
    if (liveReloadEventSource) {
        liveReloadEventSource.close();
    }

    try {
        liveReloadEventSource = new EventSource('/api/live-reload');

        liveReloadEventSource.addEventListener('connected', (event) => {
            const data = JSON.parse(event.data);
            console.log('[Live Reload] Connected:', data.message);
            liveReloadReconnectAttempts = 0;
            // Show brief connected banner
            showBanner('liveReloadStatus', {
                type: 'info',
                message: 'Live reload connected',
                icon: 'fa-plug',
                autoDismiss: true,
                dismissTimeout: 2000,
                showClose: true
            });
        });

        liveReloadEventSource.addEventListener('reload', (event) => {
            const data = JSON.parse(event.data);
            console.log('[Live Reload] File changed:', data.file);
            reloadResumeFrame();
        });

        liveReloadEventSource.addEventListener('switch', (event) => {
            const data = JSON.parse(event.data);
            console.log('[Live Reload] Resume switched to:', data.resume);
            // Full page reload on resume switch
            location.reload();
        });

        liveReloadEventSource.onerror = () => {
            if (liveReloadStopping) return; // Don't show banners if stopping
            
            console.warn('[Live Reload] Connection lost, attempting to reconnect...');
            showBanner('liveReloadStatus', {
                type: 'warning',
                message: 'Live reload disconnected. Reconnecting...',
                icon: 'fa-plug',
                autoDismiss: false,
                showClose: true
            });
            liveReloadEventSource.close();
            
            if (liveReloadReconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                liveReloadReconnectAttempts++;
                setTimeout(initLiveReload, RECONNECT_DELAY_MS);
            } else {
                console.error('[Live Reload] Max reconnection attempts reached');
                showBanner('liveReloadStatus', {
                    type: 'error',
                    message: 'Live reload connection failed. Refresh the page to retry.',
                    icon: 'fa-plug',
                    autoDismiss: false,
                    showClose: true
                });
            }
        };

    } catch (err) {
        console.error('[Live Reload] Failed to initialize:', err.message);
    }
}

/**
 * Reload the resume iframe without full page refresh
 */
function reloadResumeFrame() {
    const frame = document.getElementById('resumeFrame');
    if (frame) {
        // Add cache-busting parameter to force reload
        const src = frame.src.split('?')[0];
        frame.src = src + '?t=' + Date.now();
        showReloadNotification();
    }
}

/**
 * Show a brief notification when auto-reload happens
 */
function showReloadNotification() {
    showBanner('reloadNotification', {
        type: 'success',
        message: 'Reloaded',
        icon: 'fa-sync-alt',
        autoDismiss: true,
        dismissTimeout: 2000,
        showClose: false
    });
}

// Initialize on page load
initLiveReload();
