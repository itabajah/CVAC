/**
 * ATS test handler
 * Handles ATS compatibility testing
 * 
 * Uses async child process spawning to avoid blocking the server
 */

const { spawn } = require('child_process');
const { SRC_DIR } = require('../../shared/resume');
const { getAtsResultsPage } = require('../templates/ats-results');
const { needsPdfRegeneration, generatePdfAsync } = require('./pdf');

/**
 * Run ATS test for a resume asynchronously
 * @param {string} currentResume - Resume name
 * @returns {Promise<string>} Resolves to test output
 */
function runAtsTestAsync(currentResume) {
    return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';
        
        const child = spawn('node', ['cli/ats.js', `--resume=${currentResume}`], {
            cwd: SRC_DIR
        });
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        child.on('error', (err) => {
            resolve(`[ERROR] Failed to run ATS test: ${err.message}`);
        });
        
        child.on('close', () => {
            // Include stderr in output if there's no stdout
            if (!output && errorOutput) {
                resolve(errorOutput);
            } else {
                resolve(output || '[ERROR] No output from ATS test');
            }
        });
    });
}

/**
 * Handle ATS test request
 * @param {http.ServerResponse} res - HTTP response
 * @param {string} resumeDir - Path to resume directory
 * @param {string} currentResume - Resume name
 */
async function handleAtsTest(res, resumeDir, currentResume) {
    console.log(`[SERVER] Running ATS test for: ${currentResume}`);
    
    try {
        // Regenerate PDF if missing or stale
        if (needsPdfRegeneration(resumeDir)) {
            console.log('[SERVER] PDF is stale or missing, regenerating...');
            await generatePdfAsync(currentResume);
        }
        
        // Run ATS test and capture output
        const output = await runAtsTestAsync(currentResume);
        
        res.writeHead(200, { 
            'Content-Type': 'text/html',
            'Cache-Control': 'no-cache'
        });
        res.end(getAtsResultsPage(currentResume, output));
    } catch (err) {
        console.error('[SERVER] ATS test error:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('ATS test failed: ' + err.message);
    }
}

module.exports = {
    runAtsTestAsync,
    handleAtsTest
};
