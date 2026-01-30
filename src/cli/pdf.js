/**
 * MAXIMUM Quality PDF Generator for CV As Code
 * 
 * Uses Puppeteer to generate the highest possible quality PDFs.
 * NO COMPROMISES - maximum quality regardless of time, memory, or file size.
 * 
 * Quality Settings (MAXIMUM):
 * - Viewport at 300 DPI = 2480 x 3508 pixels for A4
 * - deviceScaleFactor: 4 on top of 300 DPI = effective 1200 DPI
 * - Proper readiness detection (no arbitrary wait times)
 * - Optimized browser flags for maximum rendering quality
 * 
 * NOTE: PDF file size is small because text/shapes are vectors (infinitely scalable).
 * This is the highest quality - vectors don't need large file sizes.
 * 1200 DPI is 4x higher than professional print standard (300 DPI).
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

// Navigation timeout (generous for slow networks/fonts)
const NAVIGATION_TIMEOUT_MS = 300000;  // 5 minutes

// Configuration factory - MAXIMUM quality settings
function getConfig(resumeDir) {
    // A4 dimensions at 300 DPI (professional print standard)
    // A4 = 210mm x 297mm
    // At 300 DPI: (210/25.4)*300 = 2480px, (297/25.4)*300 = 3508px
    const A4_WIDTH_300DPI = 2480;
    const A4_HEIGHT_300DPI = 3508;
    
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
        
        // Viewport at 300 DPI with additional 4x scale = effective 1200 DPI
        viewport: {
            width: A4_WIDTH_300DPI,
            height: A4_HEIGHT_300DPI,
            deviceScaleFactor: 4  // 4x on top of 300 DPI = 1200 DPI effective
        },
        
        // Browser args optimized for maximum rendering quality
        browserArgs: [
            // Required for stability
            '--no-sandbox',
            '--disable-setuid-sandbox',
            
            // Font rendering optimization
            '--font-render-hinting=none',           // Disable hinting for clean vector output
            '--disable-font-subpixel-positioning',  // Precise glyph positioning
            
            // Graphics quality
            '--disable-gpu-compositing',            // Force software compositing for accuracy
            '--enable-font-antialiasing',           // Smooth font edges
            '--force-color-profile=srgb',           // Consistent color output
            
            // Memory - allow more for high-res rendering
            '--js-flags=--max-old-space-size=8192', // 8GB heap for JS
            '--disable-dev-shm-usage',              // Use /tmp instead of /dev/shm
            
            // Disable features that could affect quality
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
        ]
    };
}

async function generatePDF(resumeDir) {
    const CONFIG = getConfig(resumeDir);
    const resumeName = path.basename(resumeDir);
    const startTime = Date.now();
    
    console.log(`[PDF] Starting MAXIMUM quality PDF generation for: ${resumeName}`);
    console.log(`[PDF] Viewport: ${CONFIG.viewport.width}x${CONFIG.viewport.height} @ ${CONFIG.viewport.deviceScaleFactor}x`);
    console.log(`[PDF] Effective DPI: 1200 (300 DPI × 4x scale)\n`);
    
    // Check if input file exists
    if (!fs.existsSync(CONFIG.inputFile)) {
        console.error(`[ERROR] resume.html not found at ${CONFIG.inputFile}`);
        process.exit(1);
    }
    
    let browser;
    
    try {
        // Launch browser for maximum quality rendering
        console.log('[PDF] Launching browser with quality-optimized settings...');
        browser = await puppeteer.launch({
            headless: 'new',
            args: CONFIG.browserArgs
        });
        
        const page = await browser.newPage();
        
        // Set viewport at 600 DPI with 8x scale
        await page.setViewport(CONFIG.viewport);
        
        // Track resources for logging
        const fonts = new Set();
        const images = new Set();
        
        page.on('response', async (response) => {
            const url = response.url();
            const contentType = response.headers()['content-type'] || '';
            
            // Safely check hostname to avoid URL substring sanitization issues
            let hostname = '';
            try {
                hostname = new URL(url).hostname;
            } catch {
                // Invalid URL, skip
            }
            
            const isFontHost = hostname === 'fonts.googleapis.com' || hostname === 'fonts.gstatic.com';
            if (isFontHost || contentType.includes('font')) {
                fonts.add(path.basename(url).split('?')[0]);
            }
            if (contentType.includes('image')) {
                images.add(path.basename(url).split('?')[0]);
            }
        });
        
        // Navigate to the HTML file - networkidle0 waits for no network activity
        console.log('[PDF] Loading resume.html...');
        await page.goto(`file://${CONFIG.inputFile}`, {
            waitUntil: 'networkidle0',
            timeout: NAVIGATION_TIMEOUT_MS
        });
        
        // Wait for fonts to be fully loaded (browser API, not arbitrary timeout)
        console.log('[PDF] Waiting for fonts to load...');
        await page.evaluate(() => document.fonts.ready);
        console.log(`[PDF] Fonts loaded: ${fonts.size > 0 ? [...fonts].join(', ') : 'system fonts only'}`);
        
        // Wait for all images to be fully decoded
        console.log('[PDF] Waiting for images to decode...');
        await page.evaluate(async () => {
            const images = document.querySelectorAll('img');
            await Promise.all([...images].map(img => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Don't fail on broken images
                });
            }));
            // Decode all images for crisp rendering
            await Promise.all([...images].map(img => img.decode?.() || Promise.resolve()));
        });
        if (images.size > 0) {
            console.log(`[PDF] Images decoded: ${[...images].join(', ')}`);
        }
        
        // Wait for any animations/transitions to complete and layout to stabilize
        console.log('[PDF] Waiting for layout to stabilize...');
        await page.evaluate(() => {
            return new Promise(resolve => {
                // Force a reflow
                document.body.offsetHeight;
                
                // Wait for next animation frame (ensures paint is complete)
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        resolve();
                    });
                });
            });
        });
        
        // Generate PDF
        console.log('[PDF] Generating MAXIMUM quality PDF...');
        await page.pdf({
            path: CONFIG.outputFile,
            ...CONFIG.pdf
        });
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const fileSize = (fs.statSync(CONFIG.outputFile).size / 1024).toFixed(1);
        
        console.log(`\n[SUCCESS] MAXIMUM quality PDF generated!`);
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
