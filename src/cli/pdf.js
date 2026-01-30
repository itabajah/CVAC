/**
 * EXTREME Quality PDF Generator for CV As Code
 * 
 * Uses Puppeteer to generate the highest possible quality PDFs.
 * NO COMPROMISES - maximum quality regardless of time, memory, or file size.
 * 
 * Quality Settings (EXTREME):
 * - Viewport at 300 DPI (print standard) = 2480 x 3508 pixels for A4
 * - deviceScaleFactor: 4 on top of 300 DPI = effective 1200 DPI
 * - Extended wait times for perfect rendering
 * 
 * WARNING: This will use significant memory (2-4GB) and take longer to generate.
 * 
 * Usage:
 *   npm run pdf                      - Generate PDF for first resume
 *   npm run pdf -- --resume=example  - Generate PDF for specific resume
 *   npm run pdf -- --watch           - Watch for changes and regenerate
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const { 
    SRC_DIR, 
    getResumeDir, 
    parseResumeArg, 
    parseWatchArg 
} = require('../shared/resume');

// Timing constants - extended for extreme quality rendering
const NAVIGATION_TIMEOUT_MS = 300000;  // 5 minutes for complex pages
const RENDER_WAIT_MS = 10000;          // 10 seconds for complete style application
const FONT_LOAD_WAIT_MS = 5000;        // 5 seconds for all fonts to fully load

// Configuration factory - EXTREME quality settings
function getConfig(resumeDir) {
    // A4 dimensions at 300 DPI (print standard)
    // A4 = 210mm x 297mm
    // At 300 DPI: (210/25.4)*300 = 2480px, (297/25.4)*300 = 3508px
    const A4_WIDTH_300DPI = 2480;
    const A4_HEIGHT_300DPI = 3508;
    
    return {
        inputFile: path.join(resumeDir, 'resume.html'),
        outputFile: path.join(resumeDir, 'resume.pdf'),
        
        // PDF Settings optimized for extreme quality, ATS and print
        pdf: {
            format: 'A4',
            printBackground: true,
            preferCSSPageSize: true,
            displayHeaderFooter: false,
            
            // Margins in inches (set to 0 since CSS handles margins via @page)
            margin: {
                top: '0',
                right: '0',
                bottom: '0',
                left: '0'
            },
            
            // Enable tagged PDF for better accessibility and ATS parsing
            tagged: true,
            
            // Outline for document structure
            outline: true,
            
            // Scale: 1 = 100% (native rendering, no artifacts)
            scale: 1
        },
        
        // Viewport at 300 DPI with additional 4x scale = effective 1200 DPI
        viewport: {
            width: A4_WIDTH_300DPI,
            height: A4_HEIGHT_300DPI,
            deviceScaleFactor: 4  // 4x on top of 300 DPI = 1200 DPI effective
        },
        
        // Minimal browser args - only essential ones for stability
        browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    };
}

async function generatePDF(resumeDir) {
    const CONFIG = getConfig(resumeDir);
    const resumeName = path.basename(resumeDir);
    const startTime = Date.now();
    
    console.log(`[PDF] Starting EXTREME quality PDF generation for: ${resumeName}`);
    console.log(`[PDF] Viewport: ${CONFIG.viewport.width}x${CONFIG.viewport.height} @ ${CONFIG.viewport.deviceScaleFactor}x`);
    console.log(`[PDF] Effective DPI: ${300 * CONFIG.viewport.deviceScaleFactor} (1200 DPI)\n`);
    
    // Check if input file exists
    if (!fs.existsSync(CONFIG.inputFile)) {
        console.error(`[ERROR] resume.html not found at ${CONFIG.inputFile}`);
        process.exit(1);
    }
    
    let browser;
    
    try {
        // Launch browser for extreme quality rendering
        console.log('[PDF] Launching browser...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: CONFIG.browserArgs
        });
        
        const page = await browser.newPage();
        
        // Set viewport at 300 DPI with 4x scale
        await page.setViewport(CONFIG.viewport);
        
        // Enable request interception to ensure all resources load
        await page.setRequestInterception(true);
        page.on('request', request => request.continue());
        
        // Track font loading
        const fonts = new Set();
        page.on('response', async (response) => {
            const url = response.url();
            if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
                fonts.add(url.split('/').pop().split('?')[0]);
            }
        });
        
        // Navigate to the HTML file with extended timeout
        console.log('[PDF] Loading resume.html...');
        await page.goto(`file://${CONFIG.inputFile}`, {
            waitUntil: 'networkidle0', // Wait for all resources to load
            timeout: NAVIGATION_TIMEOUT_MS
        });
        
        // Wait for fonts to load completely
        console.log('[PDF] Waiting for fonts to load (5 seconds)...');
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, FONT_LOAD_WAIT_MS));
        console.log(`[PDF] Fonts loaded: ${fonts.size > 0 ? [...fonts].join(', ') : 'system fonts'}`);
        
        // Extended wait for complete rendering (fonts, icons, styles)
        console.log('[PDF] Waiting for complete render (10 seconds)...');
        await new Promise(resolve => setTimeout(resolve, RENDER_WAIT_MS));
        
        // Force layout recalculation
        await page.evaluate(() => {
            document.body.style.transform = 'translateZ(0)';
            return document.body.offsetHeight;
        });
        
        // Generate PDF
        console.log('[PDF] Generating EXTREME quality PDF...');
        await page.pdf({
            path: CONFIG.outputFile,
            ...CONFIG.pdf
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const fileSize = (fs.statSync(CONFIG.outputFile).size / 1024).toFixed(1);
        
        console.log(`\n[SUCCESS] EXTREME quality PDF generated!`);
        console.log(`  Resume: ${resumeName}`);
        console.log(`  Output: ${path.relative(SRC_DIR, CONFIG.outputFile)}`);
        console.log(`  Size: ${fileSize} KB`);
        console.log(`  Quality: 1200 DPI (300 DPI × 4x scale)`);
        console.log(`  Time: ${duration}s\n`);
        
    } catch (error) {
        console.error('[ERROR] Error generating PDF:', error.message);
        process.exit(1);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Watch mode
async function runWatchMode(resumeDir) {
    console.log('[WATCH] Watch mode enabled. Watching for changes...\n');
    
    const filesToWatch = [
        path.join(resumeDir, 'resume.html'),
        path.join(resumeDir, 'css/styles.css'),
        path.join(resumeDir, 'css/variables.css'),
        path.join(resumeDir, 'css/base.css'),
        path.join(resumeDir, 'css/layout.css'),
        path.join(resumeDir, 'css/main-content.css'),
        path.join(resumeDir, 'css/print.css')
    ];
    
    // Generate initial PDF
    await generatePDF(resumeDir);
    
    // Watch for changes
    filesToWatch.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            fs.watch(filePath, async (eventType) => {
                if (eventType === 'change') {
                    console.log(`\n[WATCH] ${path.basename(filePath)} changed, regenerating PDF...`);
                    await generatePDF(resumeDir);
                }
            });
        }
    });
    
    console.log('Press Ctrl+C to stop watching.\n');
}

// Main execution
const resumeName = parseResumeArg();
const watchMode = parseWatchArg();
const resumeDir = getResumeDir(resumeName);

if (watchMode) {
    runWatchMode(resumeDir);
} else {
    generatePDF(resumeDir);
}
