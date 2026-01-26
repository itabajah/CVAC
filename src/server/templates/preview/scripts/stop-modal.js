/**
 * Stop Server Modal
 * Modal for stopping the server with options
 * 
 * Note: FAVICON_SVG is injected by page.js during template generation
 */

// FAVICON_SVG is injected here: __FAVICON_SVG_PLACEHOLDER__
const FAVICON_SVG = '__FAVICON_SVG_PLACEHOLDER__';

function openStopModal() {
    Modal.open(`
        <div class="modal modal--stop">
            <h2 class="modal__title">Stop Server</h2>
            <div class="stop-options">
                <button class="stop-option" onclick="doStop('/api/shutdown-fast')">
                    <i class="fas fa-bolt"></i>
                    <span class="stop-option__label">Quick Stop</span>
                    <span class="stop-option__hint">Faster restart</span>
                </button>
                <button class="stop-option stop-option--alt" onclick="doStop('/api/shutdown')">
                    <i class="fas fa-broom"></i>
                    <span class="stop-option__label">Clean Up</span>
                    <span class="stop-option__hint">Remove files</span>
                </button>
            </div>
            <button class="modal__cancel" onclick="Modal.close()">Cancel</button>
        </div>
    `);
}

function doStop(endpoint) {
    Modal.close();
    
    // Stop live reload to prevent reconnection attempts and banners
    if (typeof stopLiveReload === 'function') {
        stopLiveReload();
    }
    
    fetch(endpoint).then(() => {
        document.documentElement.innerHTML = `
            <head>
                <title>CVAC | Server Stopped</title>
                <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${FAVICON_SVG}">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        background: #f5f5f5;
                        color: #374151;
                    }
                    h1 { font-size: 18px; font-weight: 600; margin-bottom: 6px; }
                    p { font-size: 13px; color: #6b7280; }
                </style>
            </head>
            <body>
                <h1>Server Stopped</h1>
                <p>You can close this tab</p>
            </body>
        `;
        
        // Try to close the tab after 2 seconds
        setTimeout(() => {
            window.close();
        }, 2000);
    });
}
