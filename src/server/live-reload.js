/**
 * Live Reload Module for CV As Code
 * 
 * Uses Server-Sent Events (SSE) to push file change notifications to the browser.
 * The browser reloads the iframe when changes are detected in the active resume.
 * 
 * This approach is simpler than WebSocket and requires no additional dependencies
 * beyond chokidar for file watching.
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

    // Handle client disconnect
    res.on('close', () => {
        clients.delete(res);
        console.log(`[LIVE-RELOAD] Client disconnected (${clients.size} remaining)`);
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
    console.log('[LIVE-RELOAD] Cleaned up');
}

/**
 * Get number of connected clients
 */
function getClientCount() {
    return clients.size;
}

module.exports = {
    initWatcher,
    switchWatcher,
    handleSSEConnection,
    notifyClients,
    cleanup,
    getClientCount
};
