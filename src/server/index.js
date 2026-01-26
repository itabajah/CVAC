/**
 * Development Server for CV As Code
 * 
 * Serves a preview page that wraps the user's resume with toolbar.
 * Supports multiple resumes in the resumes/ folder with UI switching.
 * 
 * Provides endpoints for:
 * - / - Preview page with toolbar + embedded resume
 * - /resume - Raw resume HTML (unchanged)
 * - /pdf - Loading page then PDF
 * - /ats-test - Loading page then ATS test
 * - /api/pdf - Generate and serve PDF
 * - /api/ats-test - Run ATS test
 * - /api/resumes - List available resumes
 * - /api/switch/:name - Switch to a different resume
 * - /api/config - GET/POST visible resumes configuration
 * - /api/shutdown - Stop server and clean up
 * - /api/shutdown-fast - Stop server without cleanup (faster restart)
 * 
 * Usage:
 *   npm run serve
 *   npm run serve -- --resume=example
 */

const http = require('http');

const { parseResumeArg, getCurrentResumeDir, getAvailableResumes, getCurrentResume } = require('./resumes');
const { handleRequest } = require('./routes');
const { initWatcher, cleanup: cleanupLiveReload } = require('./live-reload');

const PORT = process.env.CV_PORT || 3000;

// Create HTTP server
const server = http.createServer(async (req, res) => {
    await handleRequest(req, res, PORT);
});

// Handle port already in use
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[ERROR] Port ${PORT} is already in use.`);
        console.error('[ERROR] Another server may be running. Stop it first or use the existing one.');
        console.error(`[INFO] Try opening http://localhost:${PORT}/ in your browser.\n`);
        process.exit(1);
    } else {
        console.error('[ERROR] Server error:', err.message);
        process.exit(1);
    }
});

// Parse args and initialize
parseResumeArg();
getCurrentResumeDir();

// Graceful shutdown handlers
function gracefulShutdown(signal, exitCode) {
    console.log(`\n[SERVER] Received ${signal}. Shutting down gracefully...`);
    cleanupLiveReload();
    server.close(() => {
        console.log('[SERVER] Server closed.');
        process.exit(exitCode);
    });
    // Force exit after 3 seconds if server doesn't close
    setTimeout(() => {
        console.log('[SERVER] Forcing shutdown...');
        process.exit(exitCode);
    }, 3000);
}

// Handle Ctrl+C - exit with cleanup (code 0)
process.on('SIGINT', () => gracefulShutdown('SIGINT', 0));

// Handle termination signal - exit with cleanup (code 0)
process.on('SIGTERM', () => gracefulShutdown('SIGTERM', 0));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('\n[ERROR] Uncaught exception:', err.message);
    console.error(err.stack);
    gracefulShutdown('uncaughtException', 1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('\n[ERROR] Unhandled promise rejection:', reason);
    gracefulShutdown('unhandledRejection', 1);
});

// Start server
server.listen(PORT, () => {
    const resumes = getAvailableResumes();
    const currentResume = getCurrentResume();
    console.log(`\n[SERVER] CV Preview Server running at http://localhost:${PORT}`);
    console.log(`[SERVER] Available resumes: ${resumes.join(', ')}`);
    console.log(`[SERVER] Current resume: ${currentResume}`);
    console.log('[SERVER] Live Reload: Enabled');
    console.log('[SERVER] Endpoints:');
    console.log(`  - Preview:  http://localhost:${PORT}/`);
    console.log(`  - Resume:   http://localhost:${PORT}/resume`);
    console.log(`  - PDF:      http://localhost:${PORT}/pdf`);
    console.log(`  - ATS Test: http://localhost:${PORT}/ats-test`);
    console.log('\nPress Ctrl+C to stop (with cleanup).\n');
    
    // Initialize live reload file watcher after server starts
    initWatcher();
});
