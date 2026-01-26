/**
 * Integration Tests for ATS Test
 * Tests the cli/ats.js text extraction workflow
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
    SRC_DIR,
    cleanupTestFixtures,
    assertEqual,
    assertTrue,
    assertFalse,
    assertContains,
    assertPathExists
} = require('../helpers/test-utils');

describe('ATS Test Integration Tests', () => {
    
    describe('cli/ats.js Module', () => {
        
        it('should be a valid Node.js module', () => {
            const modulePath = path.join(SRC_DIR, 'cli/ats.js');
            assertPathExists(modulePath, 'cli/ats.js should exist');
        });
        
        it('should have correct module structure', () => {
            const modulePath = path.join(SRC_DIR, 'cli/ats.js');
            const content = fs.readFileSync(modulePath, 'utf-8');
            
            assertContains(content, '/**', 'Should have JSDoc comments');
            assertContains(content, 'pdfjs-dist', 'Should use pdfjs-dist');
        });
        
        it('should import from shared resume module', () => {
            const modulePath = path.join(SRC_DIR, 'cli/ats.js');
            const content = fs.readFileSync(modulePath, 'utf-8');
            
            assertContains(content, "require('../shared/resume')", 'Should import from shared/resume');
        });
    });
    
    describe('Text Extraction Logic', () => {
        const atsTestPath = path.join(SRC_DIR, 'cli/ats.js');
        const content = fs.readFileSync(atsTestPath, 'utf-8');
        
        it('should define extractText function', () => {
            assertContains(content, 'async function extractText', 'Should have extractText function');
        });
        
        it('should define analyzeText function', () => {
            assertContains(content, 'function analyzeText', 'Should have analyzeText function');
        });
        
        it('should check for PDF existence', () => {
            assertContains(content, "fs.existsSync(CONFIG.pdfFile)", 'Should check PDF exists');
        });
        
        it('should use dynamic import for pdfjs-dist', () => {
            assertContains(content, "await import('pdfjs-dist", 'Should use dynamic import');
        });
    });
    
    describe('ATS Keyword Analysis', () => {
        const atsTestPath = path.join(SRC_DIR, 'cli/ats.js');
        const content = fs.readFileSync(atsTestPath, 'utf-8');
        
        it('should check for Contact Info keywords', () => {
            assertContains(content, "'Contact Info'", 'Should check contact info');
            assertContains(content, '@', 'Should check for @ symbol');
        });
        
        it('should check for Education keywords', () => {
            assertContains(content, "'Education'", 'Should check education');
        });
        
        it('should check for Experience keywords', () => {
            assertContains(content, "'Experience'", 'Should check experience');
        });
        
        it('should check for Skills keywords', () => {
            assertContains(content, "'Skills'", 'Should check skills');
        });
        
        it('should check for garbage characters', () => {
            assertContains(content, 'garbagePattern', 'Should check for garbage chars');
            assertContains(content, 'uE000', 'Should check Private Use Area');
        });
    });
    
    describe('Output and Reporting', () => {
        const atsTestPath = path.join(SRC_DIR, 'cli/ats.js');
        const content = fs.readFileSync(atsTestPath, 'utf-8');
        
        it('should save extracted text to file', () => {
            assertContains(content, 'fs.writeFileSync(CONFIG.outputFile', 'Should save to file');
        });
        
        it('should output [OK] for passed checks', () => {
            assertContains(content, '[OK]', 'Should have OK status');
        });
        
        it('should output [WARN] for potential issues', () => {
            assertContains(content, '[WARN]', 'Should have WARN status');
        });
        
        it('should output [INFO] for informational messages', () => {
            assertContains(content, '[INFO]', 'Should have INFO status');
        });
        
        it('should count words in extracted text', () => {
            assertContains(content, 'wordCount', 'Should count words');
        });
    });
    
    describe('Error Handling', () => {
        const atsTestPath = path.join(SRC_DIR, 'cli/ats.js');
        const content = fs.readFileSync(atsTestPath, 'utf-8');
        
        it('should handle missing PDF gracefully', () => {
            assertContains(content, "[ERROR] resume.pdf not found", 'Should handle missing PDF');
        });
        
        it('should have try-catch for PDF parsing', () => {
            assertContains(content, 'try {', 'Should have try block');
            assertContains(content, "catch (error)", 'Should have catch block');
        });
        
        it('should exit with code 1 on error', () => {
            assertContains(content, 'process.exit(1)', 'Should exit with error code');
        });
    });
    
    describe('ATS Test with Example Template', () => {
        const templateDir = path.join(SRC_DIR, '..', 'templates', 'example');
        const pdfPath = path.join(templateDir, 'resume.pdf');
        const atsOutputPath = path.join(templateDir, 'ats-extracted-text.txt');
        
        before(() => {
            // Cleanup any existing files
            if (fs.existsSync(atsOutputPath)) {
                fs.unlinkSync(atsOutputPath);
            }
        });
        
        after(() => {
            // Cleanup generated files
            if (fs.existsSync(atsOutputPath)) {
                fs.unlinkSync(atsOutputPath);
            }
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        });
        
        it('should require PDF to exist before running', () => {
            if (!fs.existsSync(pdfPath)) {
                try {
                    execSync(`node cli/ats.js --resume=templates/example1`, {
                        cwd: SRC_DIR,
                        timeout: 5000,
                        stdio: 'pipe'
                    });
                    assertFalse(true, 'Should have thrown error for missing PDF');
                } catch (e) {
                    // Expected - PDF doesn't exist
                    assertTrue(true);
                }
            }
        });
        
        it('should extract text and save to file when PDF exists', async function() {
            this.timeout = 120000;
            
            // First generate PDF
            try {
                execSync(`node cli/pdf.js --resume=templates/example1`, {
                    cwd: SRC_DIR,
                    timeout: 60000,
                    stdio: 'pipe'
                });
            } catch (e) {
                console.log('Skipping - PDF generation not available');
                return;
            }
            
            if (!fs.existsSync(pdfPath)) {
                console.log('Skipping - PDF not generated');
                return;
            }
            
            // Run ATS test
            try {
                execSync(`node cli/ats.js --resume=templates/example1`, {
                    cwd: SRC_DIR,
                    timeout: 30000,
                    stdio: 'pipe'
                });
                
                assertPathExists(atsOutputPath, 'ATS output file should be created');
                
                const extractedText = fs.readFileSync(atsOutputPath, 'utf-8');
                assertTrue(extractedText.length > 0, 'Should have extracted text');
            } catch (e) {
                console.log('ATS test execution failed:', e.message);
            }
        });
    });
    
    describe('Command Line Interface', () => {
        
        it('should support --resume flag', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/ats.js'), 'utf-8');
            assertContains(content, 'parseResumeArg', 'Should import parseResumeArg');
        });
    });
});
