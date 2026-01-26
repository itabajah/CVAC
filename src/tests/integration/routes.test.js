/**
 * Integration Tests for routes.js
 * Tests HTTP endpoints and request handling
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Skip if optional dependencies not installed
let chokidarAvailable = true;
try {
    require('chokidar');
} catch {
    chokidarAvailable = false;
    console.log('Skipping routes tests - chokidar not installed');
}

if (!chokidarAvailable) {
    describe('routes.js Integration Tests', () => {
        it('skipped - chokidar not available', () => {});
    });
    return;
}

const {
    httpRequest,
    waitForServer,
    assertEqual,
    assertTrue,
    assertFalse,
    assertContains,
    assertDeepEqual
} = require('../helpers/test-utils');

// Test server setup
const { handleRequest } = require('../../server/routes');
const { cleanup: cleanupLiveReload } = require('../../server/live-reload');
const PORT = 3099; // Use different port for testing

describe('routes.js Integration Tests', () => {
    let server;
    
    before(async () => {
        // Start test server
        server = http.createServer(async (req, res) => {
            await handleRequest(req, res, PORT);
        });
        
        await new Promise((resolve, reject) => {
            server.listen(PORT, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        await waitForServer(`http://localhost:${PORT}/`);
    });
    
    after(async () => {
        // Cleanup live-reload module (watchers, timers, clients)
        cleanupLiveReload();
        
        await new Promise((resolve) => {
            server.close(resolve);
        });
    });
    
    describe('GET /', () => {
        
        it('should return 200 status', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/`);
            assertEqual(res.statusCode, 200, 'Should return 200');
        });
        
        it('should return HTML content', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/`);
            assertContains(res.headers['content-type'], 'text/html');
        });
        
        it('should include CV Preview in title', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/`);
            assertContains(res.body, 'CV Preview');
        });
        
        it('should include toolbar HTML', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/`);
            assertContains(res.body, 'toolbar');
        });
        
        it('should include resume iframe', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/`);
            assertContains(res.body, 'iframe');
            assertContains(res.body, '/resume');
        });
    });
    
    describe('GET /resume', () => {
        
        it('should return 200 status', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/resume`);
            assertEqual(res.statusCode, 200, 'Should return 200');
        });
        
        it('should return HTML content', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/resume`);
            assertContains(res.headers['content-type'], 'text/html');
        });
        
        it('should contain resume HTML structure', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/resume`);
            assertContains(res.body, '<!DOCTYPE html>');
            assertContains(res.body, '<html');
        });
    });
    
    describe('GET /api/resumes', () => {
        
        it('should return 200 status', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/resumes`);
            assertEqual(res.statusCode, 200);
        });
        
        it('should return JSON content', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/resumes`);
            assertContains(res.headers['content-type'], 'application/json');
        });
        
        it('should return resumes array', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/resumes`);
            const data = JSON.parse(res.body);
            
            assertTrue(Array.isArray(data.resumes), 'Should have resumes array');
        });
        
        it('should return current resume', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/resumes`);
            const data = JSON.parse(res.body);
            
            assertTrue('current' in data, 'Should have current property');
        });
        
        it('should include templates/example1 in resumes', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/resumes`);
            const data = JSON.parse(res.body);
            
            assertTrue(data.resumes.includes('templates/example1'), 'Should include example template');
        });
    });
    
    describe('GET /api/config', () => {
        
        it('should return 200 status', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/config`);
            assertEqual(res.statusCode, 200);
        });
        
        it('should return JSON content', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/config`);
            assertContains(res.headers['content-type'], 'application/json');
        });
        
        it('should return allResumes array', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/config`);
            const data = JSON.parse(res.body);
            
            assertTrue(Array.isArray(data.allResumes), 'Should have allResumes array');
        });
    });
    
    describe('GET /api/switch/:name', () => {
        
        it('should return 200 for valid resume', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/switch/templates%2Fexample1`);
            assertEqual(res.statusCode, 200);
        });
        
        it('should return success true for valid resume', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/switch/templates%2Fexample1`);
            const data = JSON.parse(res.body);
            
            assertTrue(data.success, 'Should return success: true');
        });
        
        it('should return 404 for invalid resume', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/switch/nonexistent-resume`);
            assertEqual(res.statusCode, 404);
        });
        
        it('should return success false for invalid resume', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/switch/nonexistent-resume`);
            const data = JSON.parse(res.body);
            
            assertFalse(data.success, 'Should return success: false');
        });
    });
    
    describe('POST /api/config', () => {
        
        it('should return 200 for valid config', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibleResumes: ['templates/example1'] })
            });
            assertEqual(res.statusCode, 200);
        });
        
        it('should return 400 for empty visibleResumes', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ visibleResumes: [] })
            });
            // Empty array with no valid resumes should fail
            assertEqual(res.statusCode, 400);
        });
        
        it('should return 400 for invalid JSON', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/config`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{ invalid json }'
            });
            assertEqual(res.statusCode, 400);
        });
    });
    
    describe('GET /pdf', () => {
        
        it('should return 200 status (loading page)', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/pdf`);
            assertEqual(res.statusCode, 200);
        });
        
        it('should return HTML loading page', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/pdf`);
            assertContains(res.headers['content-type'], 'text/html');
            assertContains(res.body, 'Generating PDF');
        });
    });
    
    describe('GET /ats-test', () => {
        
        it('should return 200 status (loading page)', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/ats-test`);
            assertEqual(res.statusCode, 200);
        });
        
        it('should return HTML loading page', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/ats-test`);
            assertContains(res.headers['content-type'], 'text/html');
            assertContains(res.body, 'ATS');
        });
    });
    
    describe('Static File Serving', () => {
        
        it('should serve CSS files', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/css/styles.css`);
            assertEqual(res.statusCode, 200);
            assertContains(res.headers['content-type'], 'text/css');
        });
        
        it('should return 404 for non-existent files', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/nonexistent.file`);
            assertEqual(res.statusCode, 404);
        });
    });
    
    describe('MIME Types', () => {
        
        it('should serve HTML with correct MIME type', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/resume`);
            assertContains(res.headers['content-type'], 'text/html');
        });
        
        it('should serve CSS with correct MIME type', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/css/styles.css`);
            assertContains(res.headers['content-type'], 'text/css');
        });
        
        it('should serve JSON with correct MIME type', async () => {
            const res = await httpRequest(`http://localhost:${PORT}/api/resumes`);
            assertContains(res.headers['content-type'], 'application/json');
        });
    });
    
    describe('Error Handling', () => {
        
        it('should handle malformed URLs gracefully', async () => {
            // This should not crash the server
            const res = await httpRequest(`http://localhost:${PORT}/%invalid`);
            assertTrue(res.statusCode >= 400, 'Should return error status');
        });
    });
});
