/**
 * Launcher Utilities
 */

const { execSync } = require('child_process');
const { spawn } = require('child_process');
const os = require('os');

const isWindows = os.platform() === 'win32';
const isMac = os.platform() === 'darwin';

/**
 * Log a message with a prefix
 */
function log(prefix, message) {
    console.log(`[${prefix}] ${message}`);
}

/**
 * Print the application banner
 */
function banner() {
    console.log('');
    console.log('========================================');
    console.log(' CV As Code - Resume Editor');
    console.log('========================================');
    console.log('');
}

/**
 * Execute a command silently, returning output or null on error
 */
function execSilent(command, options = {}) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe', ...options }).trim();
    } catch {
        return null;
    }
}

/**
 * Open a URL in the default browser
 */
function openBrowser(url) {
    try {
        if (isWindows) {
            execSync(`start "" "${url}"`, { shell: true, stdio: 'ignore' });
        } else if (isMac) {
            spawn('open', [url], { detached: true, stdio: 'ignore' }).unref();
        } else {
            spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
        }
    } catch {
        log('INFO', `Open ${url} in your browser`);
    }
}

module.exports = { log, banner, execSilent, openBrowser, isWindows };
