/**
 * Pre-launch Checks
 */

const net = require('net');
const { log, execSilent } = require('./utils');

/**
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} True if port is in use
 */
function checkPort(port) {
    return new Promise((resolve) => {
        const server = net.createServer();
        server.once('error', () => resolve(true)); // Port in use
        server.once('listening', () => {
            server.close();
            resolve(false); // Port available
        });
        server.listen(port);
    });
}

/**
 * Check for git updates from origin/main
 * @param {string} rootDir - Root directory of the repo
 * @returns {boolean} True if updates are available
 */
function checkForUpdates(rootDir) {
    // Check if this is a git repo
    const isGitRepo = execSilent('git rev-parse --git-dir', { cwd: rootDir });
    if (!isGitRepo) return false;

    log('UPDATE', 'Checking for template updates...');

    // Fetch latest from remote
    execSilent('git fetch origin main --quiet', { cwd: rootDir });

    // Check how many commits we're behind
    const behind = execSilent('git rev-list HEAD..origin/main --count', { cwd: rootDir });
    const behindCount = parseInt(behind, 10) || 0;

    if (behindCount > 0) {
        log('UPDATE', 'Update available! You can sync from the browser UI.');
        console.log('');
        return true;
    } else {
        log('UPDATE', 'You are using the latest version.');
        console.log('');
        return false;
    }
}

module.exports = { checkPort, checkForUpdates };
