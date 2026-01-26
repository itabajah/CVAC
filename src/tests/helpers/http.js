/**
 * HTTP Test Helpers
 * Utilities for making HTTP requests in tests
 */

const http = require('http');

/**
 * Make an HTTP request to the test server
 */
function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        req.on('error', reject);
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    });
}

/**
 * Wait for a server to be ready
 */
async function waitForServer(url, maxRetries = 10, delay = 200) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await httpRequest(url);
            return true;
        } catch (e) {
            await new Promise(r => setTimeout(r, delay));
        }
    }
    return false;
}

module.exports = {
    httpRequest,
    waitForServer
};
