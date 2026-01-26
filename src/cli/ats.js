/**
 * ATS Text Extraction Test
 * 
 * Extracts all text from the generated PDF to show exactly what
 * ATS (Applicant Tracking Systems) parsers will read.
 * 
 * Uses Y-coordinate detection to preserve line breaks and paragraph structure
 * for readable output.
 * 
 * Usage:
 *   npm run ats                      - Test first resume
 *   npm run ats -- --resume=example  - Test specific resume
 */

const fs = require('fs');
const path = require('path');

const { 
    SRC_DIR, 
    getResumeDir, 
    parseResumeArg 
} = require('../shared/resume');

// Configuration for text extraction
const LINE_HEIGHT_THRESHOLD = 5; // Minimum Y difference to consider a new line
const PARAGRAPH_THRESHOLD = 15;  // Minimum Y difference to consider a new paragraph

// Get config for specific resume
function getConfig(resumeDir) {
    return {
        pdfFile: path.join(resumeDir, 'resume.pdf'),
        outputFile: path.join(resumeDir, 'ats-extracted-text.txt')
    };
}

/**
 * Extract text from PDF preserving line breaks using Y-coordinate detection
 * @param {object} page - PDF.js page object
 * @returns {string} Extracted text with preserved line structure
 */
async function extractPageText(page) {
    const textContent = await page.getTextContent();
    const items = textContent.items;
    
    if (items.length === 0) return '';
    
    let result = '';
    let lastY = null;
    let lastX = null;
    
    // Sort items by Y position (top to bottom), then X (left to right)
    items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5]; // Invert Y (PDF coordinates are bottom-up)
        if (Math.abs(yDiff) > LINE_HEIGHT_THRESHOLD) return yDiff;
        return a.transform[4] - b.transform[4]; // Sort by X for same line
    });
    
    for (const item of items) {
        const text = item.str;
        if (!text.trim()) continue; // Skip empty strings
        
        const currentY = item.transform[5];
        const currentX = item.transform[4];
        
        if (lastY !== null) {
            const yDiff = Math.abs(lastY - currentY);
            
            if (yDiff > PARAGRAPH_THRESHOLD) {
                // New paragraph - add double line break
                result += '\n\n';
            } else if (yDiff > LINE_HEIGHT_THRESHOLD) {
                // New line - add single line break
                result += '\n';
            } else if (lastX !== null && currentX > lastX + 5) {
                // Same line but gap - add space
                result += ' ';
            } else if (result && !result.endsWith(' ') && !result.endsWith('\n')) {
                // Add space between words on same line
                result += ' ';
            }
        }
        
        result += text;
        lastY = currentY;
        lastX = currentX + (item.width || 0);
    }
    
    return result.trim();
}

async function extractText(resumeDir) {
    const CONFIG = getConfig(resumeDir);
    const resumeName = path.basename(resumeDir);
    
    console.log(`[ATS] Starting text extraction for: ${resumeName}\n`);
    
    // Check if PDF exists
    if (!fs.existsSync(CONFIG.pdfFile)) {
        console.error(`[ERROR] resume.pdf not found. Run 'npm run pdf -- --resume=${resumeName}' first.`);
        process.exit(1);
    }
    
    try {
        // Dynamic import for ES module
        const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
        
        const dataBuffer = new Uint8Array(fs.readFileSync(CONFIG.pdfFile));
        const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
        
        let fullText = '';
        
        console.log('='.repeat(60));
        console.log(`ATS EXTRACTED TEXT: ${resumeName}`);
        console.log('='.repeat(60));
        console.log(`Pages: ${pdf.numPages}`);
        console.log('='.repeat(60));
        console.log('\n');
        
        // Extract text from each page with line break preservation
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const pageText = await extractPageText(page);
            
            if (i > 1) {
                fullText += '\n\n--- Page ' + i + ' ---\n\n';
            }
            fullText += pageText;
        }
        
        // Display extracted text
        console.log(fullText);
        
        console.log('\n');
        console.log('='.repeat(60));
        console.log('END OF EXTRACTED TEXT');
        console.log('='.repeat(60));
        
        // Save to file
        fs.writeFileSync(CONFIG.outputFile, fullText);
        console.log(`\n[ATS] Text saved to: ${path.relative(SRC_DIR, CONFIG.outputFile)}`);
        console.log(`[ATS] Characters: ${fullText.length}`);
        console.log(`[ATS] Lines: ${fullText.split('\n').length}`);
        
        // Analyze for common issues
        console.log('\n[ATS] Analysis:');
        analyzeText(fullText);
        
    } catch (error) {
        console.error('[ERROR] Failed to parse PDF:', error.message);
        process.exit(1);
    }
}

function analyzeText(text) {
    const issues = [];
    const successes = [];
    
    // Check for common ATS keywords (generic checks)
    const keywords = {
        'Contact Info': ['@', 'phone', 'linkedin', 'email'],
        'Education': ['university', 'gpa', 'degree', 'b.sc', 'b.a', 'm.sc'],
        'Experience': ['experience', 'intern', 'engineer', 'developer'],
        'Skills': ['python', 'java', 'javascript', 'git', 'sql'],
        'Sections': ['education', 'experience', 'skills', 'projects']
    };
    
    const textLower = text.toLowerCase();
    
    for (const [category, words] of Object.entries(keywords)) {
        const found = words.filter(w => textLower.includes(w));
        if (found.length > 0) {
            successes.push(`  [OK] ${category}: Found "${found.join('", "')}"`);
        } else {
            issues.push(`  [WARN] ${category}: No keywords found`);
        }
    }
    
    // Check for garbage characters (common with icon fonts)
    // Font Awesome uses Private Use Area: U+F000 to U+F8FF
    const garbagePattern = /[\uE000-\uF8FF]/g;
    const garbageMatches = text.match(garbagePattern);
    if (garbageMatches && garbageMatches.length > 0) {
        issues.push(`  [WARN] Found ${garbageMatches.length} icon characters (Font Awesome symbols in text layer)`);
    } else {
        successes.push('  [OK] No garbage icon characters detected');
    }
    
    // Check text density
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    successes.push(`  [INFO] Word count: ${wordCount}`);
    
    // Output results
    if (successes.length > 0) {
        console.log('\n  Passed checks:');
        successes.forEach(s => console.log(s));
    }
    
    if (issues.length > 0) {
        console.log('\n  Potential issues:');
        issues.forEach(i => console.log(i));
    }
}

// Main execution
const resumeName = parseResumeArg();
const resumeDir = getResumeDir(resumeName);
extractText(resumeDir);
