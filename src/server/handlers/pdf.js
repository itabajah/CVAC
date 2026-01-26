/**
 * PDF generation handler
 * Handles PDF generation and serving
 * 
 * Uses async child process spawning to avoid blocking the server
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { SRC_DIR } = require('../../shared/resume');

/**
 * Check if PDF needs regeneration (stale or missing)
 * @param {string} resumeDir - Path to resume directory
 * @returns {boolean} True if PDF needs to be regenerated
 */
function needsPdfRegeneration(resumeDir) {
    const pdfPath = path.join(resumeDir, 'resume.pdf');
    const htmlPath = path.join(resumeDir, 'resume.html');
    
    if (!fs.existsSync(pdfPath)) {
        return true;
    }
    
    // Check if HTML is newer than PDF (stale PDF)
    const pdfMtime = fs.statSync(pdfPath).mtime;
    const htmlMtime = fs.statSync(htmlPath).mtime;
    
    // Also check CSS files for staleness
    const cssDir = path.join(resumeDir, 'css');
    if (fs.existsSync(cssDir)) {
        const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
        for (const cssFile of cssFiles) {
            const cssMtime = fs.statSync(path.join(cssDir, cssFile)).mtime;
            if (cssMtime > pdfMtime) {
                return true;
            }
        }
    }
    
    return htmlMtime > pdfMtime;
}

/**
 * Generate PDF for a resume asynchronously
 * @param {string} currentResume - Resume name
 * @returns {Promise<boolean>} Resolves to true if successful
 */
function generatePdfAsync(currentResume) {
    return new Promise((resolve, reject) => {
        const child = spawn('node', ['cli/pdf.js', `--resume=${currentResume}`], {
            cwd: SRC_DIR,
            stdio: 'inherit'
        });
        
        child.on('error', (err) => {
            reject(new Error(`Failed to start PDF generation: ${err.message}`));
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                resolve(true);
            } else {
                reject(new Error(`PDF generation exited with code ${code}`));
            }
        });
    });
}

/**
 * Serve PDF file
 * @param {http.ServerResponse} res - HTTP response
 * @param {string} pdfPath - Path to PDF file
 * @param {string} currentResume - Resume name for filename
 */
function servePdf(res, pdfPath, currentResume) {
    const pdf = fs.readFileSync(pdfPath);
    res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${currentResume.replace(/[^a-zA-Z0-9-_]/g, '-')}-resume.pdf"`,
        'Content-Length': pdf.length,
        'Cache-Control': 'no-cache'
    });
    res.end(pdf);
}

/**
 * Handle PDF generation request
 * Uses caching: serves existing PDF if up-to-date, regenerates if stale
 * 
 * @param {http.ServerResponse} res - HTTP response
 * @param {string} resumeDir - Path to resume directory
 * @param {string} currentResume - Resume name
 */
async function handlePdfGeneration(res, resumeDir, currentResume) {
    const pdfPath = path.join(resumeDir, 'resume.pdf');
    
    // Check if we can serve cached PDF
    if (!needsPdfRegeneration(resumeDir) && fs.existsSync(pdfPath)) {
        console.log(`[SERVER] Serving cached PDF for: ${currentResume}`);
        return servePdf(res, pdfPath, currentResume);
    }
    
    console.log(`[SERVER] Generating PDF for: ${currentResume}`);
    
    try {
        await generatePdfAsync(currentResume);
        
        if (fs.existsSync(pdfPath)) {
            servePdf(res, pdfPath, currentResume);
        } else {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('PDF generation failed - output file not created');
        }
    } catch (err) {
        console.error('[SERVER] PDF generation error:', err.message);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('PDF generation failed: ' + err.message);
    }
}

module.exports = {
    needsPdfRegeneration,
    generatePdfAsync,
    handlePdfGeneration
};
