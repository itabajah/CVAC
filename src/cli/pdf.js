/**
 * High-Quality PDF Generator for CV As Code
 * 
 * Uses Puppeteer to generate ATS-optimized, print-quality PDFs
 * with proper font embedding and text extraction support.
 * 
 * Quality Settings:
 * - deviceScaleFactor: 8 (maximum quality rendering)
 * - scale: 1 (native rendering, no scaling artifacts)
 * - printBackground: true (preserve all colors and backgrounds)
 * - tagged: true (accessibility and ATS compatibility)
 * - Font rendering optimized for print quality
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

// Timing constants - increased for maximum quality
const NAVIGATION_TIMEOUT_MS = 60000;
const RENDER_WAIT_MS = 3000;
const FONT_LOAD_WAIT_MS = 1000;

// Configuration factory - Maximum quality settings
function getConfig(resumeDir) {
    return {
        inputFile: path.join(resumeDir, 'resume.html'),
        outputFile: path.join(resumeDir, 'resume.pdf'),
        
        // PDF Settings optimized for maximum quality, ATS and print
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
        
        // Viewport for consistent rendering - Maximum quality
        viewport: {
            width: 794,   // A4 width at 96 DPI
            height: 1123, // A4 height at 96 DPI
            deviceScaleFactor: 8  // 8x for maximum quality rendering (print-grade)
        },
        
        // Browser launch args for best rendering quality
        browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--font-render-hinting=none',        // Better font rendering
            '--disable-gpu-driver-bug-workarounds',
            '--enable-font-antialiasing',        // Smooth fonts
            '--force-color-profile=srgb',        // Consistent colors
            '--disable-accelerated-2d-canvas'    // Software rendering for consistency
        ]
    };
}

async function generatePDF(resumeDir) {
    const CONFIG = getConfig(resumeDir);
    const resumeName = path.basename(resumeDir);
    const startTime = Date.now();
    
    console.log(`[PDF] Starting PDF generation for: ${resumeName}\n`);
    
    // Check if input file exists
    if (!fs.existsSync(CONFIG.inputFile)) {
        console.error(`[ERROR] resume.html not found at ${CONFIG.inputFile}`);
        process.exit(1);
    }
    
    let browser;
    
    try {
        // Launch browser with optimized settings for maximum quality
        console.log('[PDF] Launching browser with high-quality settings...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: CONFIG.browserArgs
        });
        
        const page = await browser.newPage();
        
        // Set viewport for consistent rendering at maximum quality
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
        console.log('[PDF] Waiting for fonts to load...');
        await page.evaluateHandle('document.fonts.ready');
        await new Promise(resolve => setTimeout(resolve, FONT_LOAD_WAIT_MS));
        console.log(`[PDF] Fonts loaded: ${fonts.size > 0 ? [...fonts].join(', ') : 'system fonts'}`);
        
        // Extended wait for complete rendering (fonts, icons, styles)
        console.log('[PDF] Waiting for complete render...');
        await new Promise(resolve => setTimeout(resolve, RENDER_WAIT_MS));
        
        // Force layout recalculation for best quality
        await page.evaluate(() => {
            document.body.style.transform = 'translateZ(0)';
            return document.body.offsetHeight;
        });
        
        // Generate PDF with maximum quality
        console.log('[PDF] Generating high-quality PDF...');
        await page.pdf({
            path: CONFIG.outputFile,
            ...CONFIG.pdf
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const fileSize = (fs.statSync(CONFIG.outputFile).size / 1024).toFixed(1);
        
        console.log(`\n[SUCCESS] High-quality PDF generated successfully!`);
        console.log(`  Resume: ${resumeName}`);
        console.log(`  Output: ${path.relative(SRC_DIR, CONFIG.outputFile)}`);
        console.log(`  Size: ${fileSize} KB`);
        console.log(`  Quality: Maximum (8x device scale)`);
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
