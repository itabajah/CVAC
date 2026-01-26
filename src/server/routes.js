/**
 * HTTP request handlers for CV As Code server
 * Main router that delegates to specialized handlers
 */

const { getCurrentResumeDir, getCurrentResume } = require('./resumes');
const { getPreviewPage } = require('./templates/preview/page');
const { getLoadingPage } = require('./templates/loading');
const { handleSSEConnection } = require('./live-reload');

// Import specialized handlers
const {
    handleGetResumes,
    handleGetConfig,
    handlePostConfig,
    handleSwitchResume,
    handleShutdown,
    handleShutdownFast,
    handleGetUpdateStatus,
    handleSync,
    handlePdfGeneration,
    handleAtsTest,
    serveStaticFile,
    serveResumeHtml
} = require('./handlers');

/**
 * Handle incoming HTTP request
 */
async function handleRequest(req, res, PORT) {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;
    
    console.log(`[SERVER] ${req.method} ${pathname}`);
    
    const resumeDir = getCurrentResumeDir();
    const currentResume = getCurrentResume();
    
    // Allow shutdown even if no resumes
    if (!resumeDir && pathname !== '/api/shutdown' && pathname !== '/api/shutdown-fast') {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('No resumes found. Create a folder in resumes/ with resume.html');
        return;
    }
    
    try {
        // API: Get list of resumes
        if (pathname === '/api/resumes') {
            return handleGetResumes(res, currentResume);
        }
        
        // API: Get/Set config
        if (pathname === '/api/config') {
            if (req.method === 'POST') {
                return handlePostConfig(req, res);
            } else {
                return handleGetConfig(res);
            }
        }
        
        // API: Switch resume (POST only for state-changing operation)
        if (pathname.startsWith('/api/switch/')) {
            if (req.method !== 'GET' && req.method !== 'POST') {
                res.writeHead(405, { 'Content-Type': 'text/plain', 'Allow': 'GET, POST' });
                res.end('Method Not Allowed');
                return;
            }
            const newResume = decodeURIComponent(pathname.replace('/api/switch/', ''));
            return handleSwitchResume(res, newResume);
        }
        
        // API: Shutdown server with cleanup (POST preferred)
        if (pathname === '/api/shutdown') {
            return handleShutdown(res);
        }
        
        // API: Fast shutdown without cleanup
        if (pathname === '/api/shutdown-fast') {
            return handleShutdownFast(res);
        }
        
        // API: Check for updates
        if (pathname === '/api/update-status') {
            return handleGetUpdateStatus(res);
        }
        
        // API: Sync with remote
        if (pathname === '/api/sync' && req.method === 'POST') {
            return handleSync(res);
        }
        
        // API: Live reload SSE endpoint
        if (pathname === '/api/live-reload') {
            return handleSSEConnection(res);
        }
        
        // Loading page for PDF generation
        if (pathname === '/pdf') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getLoadingPage('Generating PDF', 'Please wait, this may take a few seconds...', '/api/pdf'));
            return;
        }
        
        // Loading page for ATS test
        if (pathname === '/ats-test') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getLoadingPage('Running ATS Test', 'Analyzing PDF for ATS compatibility...', '/api/ats-test'));
            return;
        }
        
        // API: Generate and serve PDF
        if (pathname === '/api/pdf') {
            return handlePdfGeneration(res, resumeDir, currentResume);
        }
        
        // API: Run ATS test and return results
        if (pathname === '/api/ats-test') {
            return handleAtsTest(res, resumeDir, currentResume);
        }
        
        // Serve preview page with embedded resume at root
        if (pathname === '/') {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(getPreviewPage());
            return;
        }
        
        // Serve raw resume HTML (unchanged) at /resume
        if (pathname === '/resume' || pathname === '/resume.html') {
            if (serveResumeHtml(res, resumeDir)) {
                return;
            }
        }
        
        // Serve static files from current resume directory
        return serveStaticFile(res, pathname, resumeDir);
        
    } catch (error) {
        console.error('[SERVER] Error:', error.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error: ' + error.message);
    }
}

module.exports = { handleRequest };
