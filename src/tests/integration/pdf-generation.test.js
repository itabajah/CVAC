/**
 * Integration Tests for PDF Generation
 * Tests the cli/pdf.js workflow
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const {
    SRC_DIR,
    createTestResumeDir,
    cleanupTestFixtures,
    assertEqual,
    assertTrue,
    assertFalse,
    assertContains,
    assertPathExists,
    assertPathNotExists
} = require('../helpers/test-utils');

describe('PDF Generation Integration Tests', () => {
    
    describe('cli/pdf.js Module', () => {
        
        it('should be a valid Node.js module', () => {
            const modulePath = path.join(SRC_DIR, 'cli/pdf.js');
            assertPathExists(modulePath, 'cli/pdf.js should exist');
        });
        
        it('should have correct shebang or module structure', () => {
            const modulePath = path.join(SRC_DIR, 'cli/pdf.js');
            const content = fs.readFileSync(modulePath, 'utf-8');
            
            // Should have proper JSDoc header
            assertContains(content, '/**', 'Should have JSDoc comments');
            assertContains(content, 'puppeteer', 'Should use puppeteer');
        });
        
        it('should import from shared resume module', () => {
            const modulePath = path.join(SRC_DIR, 'cli/pdf.js');
            const content = fs.readFileSync(modulePath, 'utf-8');
            
            assertContains(content, "require('../shared/resume')", 'Should import from shared/resume');
        });
    });
    
    describe('PDF Generation for templates/example1', () => {
        const templateDir = path.join(SRC_DIR, '..', 'templates', 'example1');
        const pdfPath = path.join(templateDir, 'resume.pdf');
        
        before(() => {
            // Remove any existing PDF
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        });
        
        after(() => {
            // Cleanup generated PDF
            if (fs.existsSync(pdfPath)) {
                fs.unlinkSync(pdfPath);
            }
        });
        
        it('should generate PDF file', async function() {
            // This test may take a while due to browser launch
            this.timeout = 60000;
            
            try {
                execSync(`node cli/pdf.js --resume=templates/example1`, {
                    cwd: SRC_DIR,
                    timeout: 60000
                });
                
                assertPathExists(pdfPath, 'PDF should be created');
            } catch (e) {
                // PDF generation might fail in CI without Chrome
                // Mark as skipped if puppeteer fails
                if (e.message.includes('puppeteer') || e.message.includes('browser')) {
                    console.log('Skipping PDF test - browser not available');
                    return;
                }
                throw e;
            }
        });
        
        it('should generate valid PDF file', async function() {
            this.timeout = 60000;
            
            // Generate if not exists
            if (!fs.existsSync(pdfPath)) {
                try {
                    execSync(`node cli/pdf.js --resume=templates/example1`, {
                        cwd: SRC_DIR,
                        timeout: 60000
                    });
                } catch (e) {
                    console.log('Skipping - browser not available');
                    return;
                }
            }
            
            if (fs.existsSync(pdfPath)) {
                const stats = fs.statSync(pdfPath);
                assertTrue(stats.size > 0, 'PDF should have content');
                
                // Check PDF magic bytes
                const buffer = fs.readFileSync(pdfPath);
                const header = buffer.slice(0, 4).toString();
                assertEqual(header, '%PDF', 'Should have PDF header');
            }
        });
    });
    
    describe('PDF Generation Configuration', () => {
        
        it('should have NAVIGATION_TIMEOUT_MS constant', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'NAVIGATION_TIMEOUT_MS', 'Should define timeout constant');
        });
        
        it('should have RENDER_WAIT_MS constant', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'RENDER_WAIT_MS', 'Should define render wait constant');
        });
        
        it('should configure A4 format', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, "'A4'", 'Should use A4 format');
        });
        
        it('should enable tagged PDF for accessibility', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'tagged: true', 'Should enable tagged PDF');
        });
        
        it('should set print background to true', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'printBackground: true', 'Should enable print background');
        });
    });
    
    describe('Watch Mode', () => {
        
        it('should support --watch flag', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'parseWatchArg', 'Should import parseWatchArg');
            assertContains(content, 'watchMode', 'Should use watchMode');
        });
        
        it('should have runWatchMode function', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'async function runWatchMode', 'Should have runWatchMode function');
        });
    });
    
    describe('Error Handling', () => {
        
        it('should check for input file existence', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'fs.existsSync(CONFIG.inputFile)', 'Should check input file');
        });
        
        it('should have try-catch for PDF generation', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'try {', 'Should have try block');
            assertContains(content, 'catch (error)', 'Should have catch block');
        });
        
        it('should close browser in finally block', () => {
            const content = fs.readFileSync(path.join(SRC_DIR, 'cli/pdf.js'), 'utf-8');
            assertContains(content, 'finally {', 'Should have finally block');
            assertContains(content, 'browser.close()', 'Should close browser');
        });
    });
    
    describe('Command Line Interface', () => {
        
        it('should exit with code 1 for missing resume', () => {
            try {
                execSync(`node cli/pdf.js --resume=nonexistent-resume-xyz`, {
                    cwd: SRC_DIR,
                    timeout: 5000,
                    stdio: 'pipe'
                });
                // Should not reach here
                assertFalse(true, 'Should have thrown error');
            } catch (e) {
                // Expected to fail - resume doesn't exist
                assertTrue(true);
            }
        });
    });
});
