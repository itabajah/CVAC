/**
 * Live Reload Module for CV As Code
 * 
 * Uses Server-Sent Events (SSE) to push file change notifications to the browser.
 * The browser reloads the iframe when changes are detected in the active resume.
 * 
 * This approach is simpler than WebSocket and requires no additional dependencies
 * beyond chokidar for file watching.
 * 
 * Auto-shutdown: Server automatically closes 5 seconds after the last client disconnects.
 */

const chokidar = require('chokidar');
const path = require('path');
const { getCurrentResumeDir, getCurrentResume } = require('./resumes');

// Store active SSE clients
const clients = new Set();

// Current file watcher instance
let watcher = null;

// Debounce timer to prevent rapid-fire notifications
let debounceTimer = null;
const DEBOUNCE_MS = 100;

// Auto-shutdown timer and callback
let autoShutdownTimer = null;
let autoShutdownCallback = null;
const AUTO_SHUTDOWN_DELAY_MS = 5000;

/**
 * Initialize file watcher for the current resume directory
 * Watches HTML and CSS files for changes
 */
function initWatcher() {
    // Clean up existing watcher
    if (watcher) {
        watcher.close();
        watcher = null;
    }

    const resumeDir = getCurrentResumeDir();
    if (!resumeDir) {
        console.log('[LIVE-RELOAD] No resume directory to watch');
        return;
    }

    const resumeName = getCurrentResume();
    
    // Files to watch - HTML and CSS
    const watchPatterns = [
        path.join(resumeDir, 'resume.html'),
        path.join(resumeDir, '**/*.css'),
        path.join(resumeDir, '**/*.html')
    ];

    watcher = chokidar.watch(watchPatterns, {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
            stabilityThreshold: 100,
            pollInterval: 50
        }
    });

    watcher.on('change', (filePath) => {
        const relativePath = path.relative(resumeDir, filePath);
        console.log(`[LIVE-RELOAD] File changed: ${relativePath}`);
        
        // Debounce to handle rapid saves
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            notifyClients('reload', {
                file: relativePath,
                resume: resumeName,
                timestamp: Date.now()
            });
        }, DEBOUNCE_MS);
    });

    watcher.on('error', (error) => {
        console.error('[LIVE-RELOAD] Watcher error:', error.message);
    });

    console.log(`[LIVE-RELOAD] Watching: ${resumeName}`);
}

/**
 * Reinitialize watcher when resume changes
 */
function switchWatcher() {
    console.log('[LIVE-RELOAD] Switching to new resume...');
    initWatcher();
}

/**
 * Send event to all connected SSE clients
 * @param {string} eventType - Event type (e.g., 'reload', 'switch')
 * @param {object} data - Event data to send
 */
function notifyClients(eventType, data) {
    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    
    clients.forEach((client) => {
        try {
            client.write(message);
        } catch (err) {
            // Remove dead clients
            clients.delete(client);
        }
    });
    
    console.log(`[LIVE-RELOAD] Notified ${clients.size} client(s): ${eventType}`);
}

/**
 * Handle SSE connection request
 * @param {http.ServerResponse} res - HTTP response object
 */
function handleSSEConnection(res) {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });

    // Send initial connection message
    res.write(`event: connected\ndata: ${JSON.stringify({ 
        message: 'Live reload connected',
        resume: getCurrentResume(),
        timestamp: Date.now()
    })}\n\n`);

    // Add to clients set
    clients.add(res);
    console.log(`[LIVE-RELOAD] Client connected (${clients.size} total)`);
    
    // Cancel auto-shutdown if a new client connects
    cancelAutoShutdownTimer();

    // Handle client disconnect
    res.on('close', () => {
        clients.delete(res);
        console.log(`[LIVE-RELOAD] Client disconnected (${clients.size} remaining)`);
        
        // Start auto-shutdown timer when last client disconnects
        if (clients.size === 0) {
            startAutoShutdownTimer();
        }
    });

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
        try {
            res.write(': heartbeat\n\n');
        } catch {
            clearInterval(heartbeat);
            clients.delete(res);
        }
    }, 30000);

    res.on('close', () => clearInterval(heartbeat));
}

/**
 * Clean up watcher on shutdown
 */
function cleanup() {
    if (watcher) {
        watcher.close();
        watcher = null;
    }
    clients.clear();
    clearTimeout(debounceTimer);
    if (autoShutdownTimer) {
        clearTimeout(autoShutdownTimer);
        autoShutdownTimer = null;
    }
    console.log('[LIVE-RELOAD] Cleaned up');
}

/**
 * Get number of connected clients
 */
function getClientCount() {
    return clients.size;
}

/**
 * Set callback for auto-shutdown when all clients disconnect
 * @param {Function} callback - Function to call when shutting down
 */
function setAutoShutdownCallback(callback) {
    autoShutdownCallback = callback;
}

/**
 * Start auto-shutdown timer (called when last client disconnects)
 */
function startAutoShutdownTimer() {
    // Clear any existing timer
    if (autoShutdownTimer) {
        clearTimeout(autoShutdownTimer);
    }
    
    console.log(`[LIVE-RELOAD] No clients connected. Server will shutdown in ${AUTO_SHUTDOWN_DELAY_MS / 1000} seconds...`);
    
    autoShutdownTimer = setTimeout(() => {
        if (clients.size === 0 && autoShutdownCallback) {
            console.log('[LIVE-RELOAD] Auto-shutdown triggered (no clients)');
            autoShutdownCallback();
        }
    }, AUTO_SHUTDOWN_DELAY_MS);
}

/**
 * Cancel auto-shutdown timer (called when a new client connects)
 */
function cancelAutoShutdownTimer() {
    if (autoShutdownTimer) {
        clearTimeout(autoShutdownTimer);
        autoShutdownTimer = null;
        console.log('[LIVE-RELOAD] Auto-shutdown cancelled (client connected)');
    }
}

module.exports = {
    initWatcher,
    switchWatcher,
    handleSSEConnection,
    notifyClients,
    cleanup,
    getClientCount,
    setAutoShutdownCallback,
    cancelAutoShutdownTimer
};
