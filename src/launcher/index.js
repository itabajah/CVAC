#!/usr/bin/env node
/**
 * CV As Code - Cross-platform Launcher
 * 
 * Entry point for the launcher. Handles:
 * - Git update checks
 * - Port availability
 * - Dependency installation
 * - Server lifecycle (start, restart, shutdown)
 * - Cleanup on exit
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const { log, banner, openBrowser, isWindows } = require('./utils');
const { checkPort, checkForUpdates } = require('./checks');
const { cleanup } = require('./cleanup');

// Directory paths (relative to this file in src/launcher/)
const SRC_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(SRC_DIR, '..');
const RESUMES_DIR = path.join(ROOT_DIR, 'resumes');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');
const PORT = 3000;

// State
let shouldCleanup = true;
let updateAvailable = false;

// ============================================================================
// Dependencies
// ============================================================================

/**
 * Install npm dependencies if not already present
 * @returns {boolean} True if dependencies are ready
 */
function installDependencies() {
    const puppeteerPath = path.join(SRC_DIR, 'node_modules', 'puppeteer');
    
    if (fs.existsSync(puppeteerPath)) {
        log('1/3', 'Dependencies already installed, reusing...');
        return true;
    }

    log('1/3', 'Installing dependencies...');
    try {
        execSync('npm install --silent', { cwd: SRC_DIR, stdio: 'inherit' });
        return true;
    } catch (err) {
        console.error('[ERROR] Failed to install dependencies');
        return false;
    }
}

// ============================================================================
// Server
// ============================================================================

/**
 * Start the preview server
 * @returns {Promise<number>} Exit code (0=normal, 2=fast shutdown, 3=restart)
 */
function runServer() {
    return new Promise((resolve) => {
        const env = { 
            ...process.env, 
            CV_UPDATE_AVAILABLE: updateAvailable ? '1' : '0' 
        };
        
        const serverProcess = spawn('node', ['server/index.js'], {
            cwd: SRC_DIR,
            stdio: 'inherit',
            env,
            shell: isWindows
        });

        serverProcess.on('close', (code) => resolve(code ?? 0));
        serverProcess.on('error', (err) => {
            console.error('[ERROR] Failed to start server:', err.message);
            resolve(1);
        });
    });
}

// ============================================================================
// Main
// ============================================================================

async function main() {
    banner();

    updateAvailable = checkForUpdates(ROOT_DIR);

    const portInUse = await checkPort(PORT);
    if (portInUse) {
        log('INFO', `Server already running on port ${PORT}`);
        log('INFO', 'Opening browser to existing server...');
        openBrowser(`http://localhost:${PORT}`);
        console.log('');
        console.log('To stop the server, use the Stop button in the browser.');
        console.log('');
        process.exit(0);
    }

    if (!installDependencies()) {
        process.exit(1);
    }

    log('2/3', 'Starting server...');
    console.log('');
    console.log(`  Open in browser: http://localhost:${PORT}/`);
    console.log('');
    console.log('  To stop: Close browser tab OR press Ctrl+C here');
    console.log('');

    openBrowser(`http://localhost:${PORT}`);

    // Server restart loop
    while (true) {
        const exitCode = await runServer();

        if (exitCode === 3) {
            console.log('');
            log('SYNC', 'Restarting server with updated code...');
            console.log('');
            updateAvailable = false;
            continue;
        }

        if (exitCode === 2) {
            shouldCleanup = false;
            console.log('');
            log('INFO', 'Fast shutdown - skipping cleanup for faster restart.');
            console.log('');
            console.log('Done! Server stopped (files preserved).');
            console.log('');
        }

        break;
    }

    if (shouldCleanup) {
        cleanup(SRC_DIR, RESUMES_DIR, TEMPLATES_DIR);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
}

// Signal handlers
process.on('SIGINT', () => {
    if (shouldCleanup) cleanup(SRC_DIR, RESUMES_DIR, TEMPLATES_DIR);
    process.exit(0);
});

process.on('SIGTERM', () => {
    if (shouldCleanup) cleanup(SRC_DIR, RESUMES_DIR, TEMPLATES_DIR);
    process.exit(0);
});

main().catch(err => {
    console.error('[ERROR]', err.message);
    process.exit(1);
});
