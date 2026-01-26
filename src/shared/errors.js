/**
 * Centralized Error Handling Utilities
 * 
 * Provides consistent error handling patterns across CLI tools and server handlers.
 * 
 * Patterns:
 * - CLI errors: Log message and exit with appropriate code
 * - HTTP errors: Send JSON or text response with status code
 * - Async errors: Wrap async functions with error boundary
 */

// ============================================================================
// Exit Codes (for CLI tools)
// ============================================================================

const ExitCode = {
    SUCCESS: 0,
    GENERAL_ERROR: 1,
    MISSING_FILE: 2,
    RESTART_NEEDED: 3
};

// ============================================================================
// CLI Error Handling
// ============================================================================

/**
 * Log error and exit process (for CLI tools)
 * @param {string} message - Error message
 * @param {number} [exitCode=1] - Exit code
 */
function exitWithError(message, exitCode = ExitCode.GENERAL_ERROR) {
    console.error(`[ERROR] ${message}`);
    process.exit(exitCode);
}

/**
 * Log warning (non-fatal)
 * @param {string} message - Warning message
 */
function logWarning(message) {
    console.warn(`[WARN] ${message}`);
}

/**
 * Log info message
 * @param {string} tag - Log tag (e.g., 'PDF', 'ATS', 'SERVER')
 * @param {string} message - Message
 */
function logInfo(tag, message) {
    console.log(`[${tag}] ${message}`);
}

// ============================================================================
// HTTP Error Responses
// ============================================================================

/**
 * Send JSON error response
 * @param {http.ServerResponse} res - HTTP response
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 */
function sendJsonError(res, statusCode, error) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error }));
}

/**
 * Send JSON success response
 * @param {http.ServerResponse} res - HTTP response
 * @param {Object} data - Response data
 */
function sendJsonSuccess(res, data = {}) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, ...data }));
}

/**
 * Send text error response
 * @param {http.ServerResponse} res - HTTP response
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
function sendTextError(res, statusCode, message) {
    res.writeHead(statusCode, { 'Content-Type': 'text/plain' });
    res.end(message);
}

// ============================================================================
// Safe Execution Wrappers
// ============================================================================

/**
 * Execute a function safely, catching errors
 * @param {Function} fn - Function to execute
 * @param {string} context - Context for error logging
 * @param {*} [fallback=null] - Fallback value on error
 * @returns {*} Result or fallback
 */
function safeExecute(fn, context, fallback = null) {
    try {
        return fn();
    } catch (e) {
        logWarning(`${context}: ${e.message}`);
        return fallback;
    }
}

/**
 * Execute an async function safely, catching errors
 * @param {Function} fn - Async function to execute
 * @param {string} context - Context for error logging
 * @param {*} [fallback=null] - Fallback value on error
 * @returns {Promise<*>} Result or fallback
 */
async function safeExecuteAsync(fn, context, fallback = null) {
    try {
        return await fn();
    } catch (e) {
        logWarning(`${context}: ${e.message}`);
        return fallback;
    }
}

/**
 * Execute shell command safely using execSync
 * @param {string} command - Command to execute
 * @param {Object} options - execSync options
 * @param {string} context - Context for error logging
 * @returns {{success: boolean, output?: string, error?: string}}
 */
function safeExecSync(command, options, context) {
    const { execSync } = require('child_process');
    try {
        const output = execSync(command, { ...options, encoding: 'utf-8' });
        return { success: true, output: output.trim() };
    } catch (e) {
        logWarning(`${context}: ${e.message}`);
        return { success: false, error: e.message };
    }
}

module.exports = {
    ExitCode,
    exitWithError,
    logWarning,
    logInfo,
    sendJsonError,
    sendJsonSuccess,
    sendTextError,
    safeExecute,
    safeExecuteAsync,
    safeExecSync
};
