/**
 * Static file handler
 * Serves static files from resume directories
 */

const fs = require('fs');
const path = require('path');

// MIME types for serving files
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
};

/**
 * Get MIME type for a file extension
 */
function getMimeType(ext) {
    return MIME_TYPES[ext] || 'application/octet-stream';
}

/**
 * Validate that a path is safe (no directory traversal)
 * @param {string} fullPath - Resolved full path
 * @param {string} baseDir - Base directory that must contain the path
 * @returns {boolean} True if path is safe
 */
function isPathSafe(fullPath, baseDir) {
    const resolvedBase = path.resolve(baseDir);
    const resolvedPath = path.resolve(fullPath);
    return resolvedPath.startsWith(resolvedBase + path.sep) || resolvedPath === resolvedBase;
}

/**
 * Serve static file from resume directory
 */
function serveStaticFile(res, pathname, resumeDir) {
    const fullPath = path.join(resumeDir, pathname);
    
    // Security: Prevent directory traversal attacks
    if (!isPathSafe(fullPath, resumeDir)) {
        console.warn(`[SECURITY] Path traversal attempt blocked: ${pathname}`);
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }
    
    try {
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
            const ext = path.extname(fullPath);
            const contentType = getMimeType(ext);
            const content = fs.readFileSync(fullPath);
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (error) {
        console.error('[SERVER] Static file error:', error.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

/**
 * Serve resume HTML file
 */
function serveResumeHtml(res, resumeDir) {
    const resumePath = path.join(resumeDir, 'resume.html');
    if (fs.existsSync(resumePath)) {
        const html = fs.readFileSync(resumePath, 'utf-8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return true;
    }
    return false;
}

module.exports = {
    MIME_TYPES,
    getMimeType,
    serveStaticFile,
    serveResumeHtml
};
