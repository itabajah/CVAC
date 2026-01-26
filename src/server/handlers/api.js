/**
 * API endpoint handlers
 * Handles /api/* routes for resume management and configuration
 */

const path = require('path');
const state = require('../state');
const { 
    getAllResumesWithExternals,
    getCurrentResume, 
    setCurrentResume 
} = require('../resumes');
const { switchWatcher, notifyClients } = require('../live-reload');
const { sendJsonError, sendJsonSuccess, safeExecSync } = require('../../shared/errors');

const ROOT_DIR = path.join(__dirname, '..', '..', '..');

/**
 * Handle GET /api/resumes - Get list of resumes
 */
function handleGetResumes(res, currentResume) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        resumes: getAllResumesWithExternals(),
        current: currentResume
    }));
}

/**
 * Handle GET /api/config - Get configuration
 */
function handleGetConfig(res) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
        visibleResumes: state.getVisibleResumesFilter(),
        externalPaths: state.getExternalPaths(),
        allResumes: getAllResumesWithExternals()
    }));
}

// Maximum request body size (64KB)
const MAX_BODY_SIZE = 64 * 1024;

/**
 * Safely collect request body with size limit
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {Function} callback - Called with body string on success
 */
function collectBody(req, res, callback) {
    let body = '';
    let bodySize = 0;
    let aborted = false;
    
    req.on('data', chunk => {
        if (aborted) return;
        bodySize += chunk.length;
        if (bodySize > MAX_BODY_SIZE) {
            aborted = true;
            sendJsonError(res, 413, 'Request body too large');
            req.destroy();
            return;
        }
        body += chunk;
    });
    
    req.on('end', () => {
        if (!aborted) {
            callback(body);
        }
    });
}

/**
 * Handle POST /api/config - Update configuration
 */
function handlePostConfig(req, res) {
    collectBody(req, res, (body) => {
        try {
            const data = JSON.parse(body);
            
            // Handle externalPaths update if provided
            if (Array.isArray(data.externalPaths)) {
                state.setExternalPaths(data.externalPaths);
            }
            
            if (Array.isArray(data.visibleResumes)) {
                const allResumes = getAllResumesWithExternals();
                const validResumes = data.visibleResumes.filter(r => allResumes.includes(r));
                
                if (validResumes.length === 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'No valid resumes selected' }));
                    return;
                }
                
                state.setVisibleResumesFilter(validResumes);
                
                // If current resume is no longer visible, switch to first visible
                if (!validResumes.includes(getCurrentResume())) {
                    setCurrentResume(validResumes[0]);
                }
                
                if (state.saveConfig()) {
                    console.log('[CONFIG] Saved visible resumes:', validResumes.join(', '));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, visibleResumes: validResumes }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Failed to save config file' }));
                }
            } else if (Array.isArray(data.externalPaths)) {
                // Just saving external paths without visible resumes
                if (state.saveConfig()) {
                    console.log('[CONFIG] Saved external paths:', data.externalPaths.join(', '));
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true, externalPaths: data.externalPaths }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: 'Failed to save config file' }));
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid data format' }));
            }
        } catch (e) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid JSON: ' + e.message }));
        }
    });
}

/**
 * Handle /api/switch/:name - Switch active resume
 */
function handleSwitchResume(res, newResume) {
    const resumes = getAllResumesWithExternals();
    
    if (resumes.includes(newResume)) {
        setCurrentResume(newResume);
        // Save as last resume for next session
        state.saveConfig({ lastResume: newResume });
        
        // Switch live reload watcher to new resume directory
        switchWatcher();
        
        // Notify connected clients about the switch
        notifyClients('switch', { resume: newResume, timestamp: Date.now() });
        
        console.log(`[SERVER] Switched to resume: ${newResume}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, current: newResume }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Resume not found' }));
    }
}

/**
 * Handle /api/shutdown - Shutdown server with cleanup
 */
function handleShutdown(res) {
    console.log('[SERVER] Shutdown requested (with cleanup)...');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server shutting down...');
    setTimeout(() => process.exit(0), 500);
}

/**
 * Handle /api/shutdown-fast - Fast shutdown without cleanup
 */
function handleShutdownFast(res) {
    console.log('[SERVER] Fast shutdown requested (no cleanup)...');
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Server shutting down...');
    setTimeout(() => process.exit(2), 500);
}

/**
 * Check if update is available (from environment variable set by run script)
 */
function isUpdateAvailable() {
    return process.env.CV_UPDATE_AVAILABLE === '1';
}

/**
 * Get detailed update status including branch and local changes info
 */
function getUpdateDetails() {
    const result = {
        updateAvailable: isUpdateAvailable(),
        canSync: true,
        warning: null,
        branch: 'main'
    };
    
    // Check current branch
    const branchResult = safeExecSync(
        'git rev-parse --abbrev-ref HEAD',
        { cwd: ROOT_DIR },
        'Check git branch'
    );
    
    if (!branchResult.success) {
        result.canSync = false;
        result.warning = 'Unable to check git status.';
        return result;
    }
    
    result.branch = branchResult.output;
    
    // If not on main, don't allow sync (too risky)
    if (result.branch !== 'main') {
        result.canSync = false;
        result.warning = `You are on branch "${result.branch}". Switch to main to sync updates.`;
        return result;
    }
    
    // Check for local commits ahead of origin/main
    const aheadResult = safeExecSync(
        'git rev-list origin/main..HEAD --count',
        { cwd: ROOT_DIR },
        'Check commits ahead'
    );
    
    if (aheadResult.success && parseInt(aheadResult.output, 10) > 0) {
        result.canSync = false;
        result.warning = `You have ${aheadResult.output} local commit(s). Push or reset them before syncing.`;
        return result;
    }
    
    // Check for changes in tools/ and templates/ only
    const statusResult = safeExecSync(
        'git status --porcelain',
        { cwd: ROOT_DIR },
        'Check git status'
    );
    
    if (statusResult.success) {
        const changedPaths = statusResult.output.split('\n')
            .filter(line => line.trim())
            .filter(line => !line.startsWith('??'))
            .map(line => line.substring(3))
            .filter(filepath => filepath.startsWith('tools/') || filepath.startsWith('templates/'));
        
        if (changedPaths.length > 0) {
            result.warning = `You have uncommitted changes in: ${changedPaths.slice(0, 3).join(', ')}${changedPaths.length > 3 ? ` (+${changedPaths.length - 3} more)` : ''}. These will be overwritten.`;
        }
    }
    
    return result;
}

/**
 * Handle GET /api/update-status - Check if update is available
 */
function handleGetUpdateStatus(res) {
    const details = getUpdateDetails();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(details));
}

/**
 * Handle POST /api/sync - Sync with remote (git reset --hard)
 */
function handleSync(res) {
    console.log('[SERVER] Sync requested...');
    
    const fetchResult = safeExecSync(
        'git fetch origin main --quiet',
        { cwd: ROOT_DIR, stdio: 'pipe' },
        'Git fetch'
    );
    
    if (!fetchResult.success) {
        return sendJsonError(res, 500, `Git fetch failed: ${fetchResult.error}`);
    }
    
    const resetResult = safeExecSync(
        'git reset --hard origin/main',
        { cwd: ROOT_DIR, stdio: 'pipe' },
        'Git reset'
    );
    
    if (!resetResult.success) {
        return sendJsonError(res, 500, `Git reset failed: ${resetResult.error}`);
    }
    
    console.log('[SERVER] Sync successful! Restarting...');
    sendJsonSuccess(res, { message: 'Synced successfully. Please restart the server.' });
    
    // Exit with code 3 to signal restart needed
    setTimeout(() => process.exit(3), 500);
}

module.exports = {
    handleGetResumes,
    handleGetConfig,
    handlePostConfig,
    handleSwitchResume,
    handleShutdown,
    handleShutdownFast,
    handleGetUpdateStatus,
    handleSync,
    isUpdateAvailable
};
