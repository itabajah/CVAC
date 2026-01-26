/**
 * Unit Tests for resume-utils.js
 * Tests all utility functions for resume discovery and management
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const fs = require('fs');
const path = require('path');

const {
    TESTS_DIR,
    SRC_DIR,
    FIXTURES_DIR,
    createTestResumeDir,
    cleanupTestFixtures,
    assertEqual,
    assertTrue,
    assertFalse,
    assertIncludes,
    assertPathExists,
    assertArrayLength,
    assertContains
} = require('../helpers/test-utils');

// Module under test - we need to test with fixture directories
// So we'll test the functions directly

describe('resume-utils.js', () => {
    
    describe('Directory Constants', () => {
        const { SRC_DIR: MODULE_SRC_DIR, RESUMES_DIR, TEMPLATES_DIR } = require('../../shared/resume');
        
        it('should export SRC_DIR as absolute path', () => {
            assertTrue(path.isAbsolute(MODULE_SRC_DIR), 'SRC_DIR should be absolute path');
            assertContains(MODULE_SRC_DIR, 'src', 'SRC_DIR should contain "src"');
        });
        
        it('should export RESUMES_DIR as absolute path', () => {
            assertTrue(path.isAbsolute(RESUMES_DIR), 'RESUMES_DIR should be absolute path');
            assertContains(RESUMES_DIR, 'resumes', 'RESUMES_DIR should contain "resumes"');
        });
        
        it('should export TEMPLATES_DIR as absolute path', () => {
            assertTrue(path.isAbsolute(TEMPLATES_DIR), 'TEMPLATES_DIR should be absolute path');
            assertContains(TEMPLATES_DIR, 'templates', 'TEMPLATES_DIR should contain "templates"');
        });
        
        it('should have RESUMES_DIR and TEMPLATES_DIR at same level', () => {
            const resumesParent = path.dirname(RESUMES_DIR);
            const templatesParent = path.dirname(TEMPLATES_DIR);
            assertEqual(resumesParent, templatesParent, 'RESUMES_DIR and TEMPLATES_DIR should have same parent');
        });
    });
    
    describe('getResumesFromDir()', () => {
        const { getResumesFromDir } = require('../../shared/resume');
        
        before(() => {
            cleanupTestFixtures();
        });
        
        after(() => {
            cleanupTestFixtures();
        });
        
        it('should return empty array for non-existent directory', () => {
            const result = getResumesFromDir('/non/existent/path');
            assertArrayLength(result, 0, 'Should return empty array for non-existent dir');
        });
        
        it('should return empty array for empty directory', () => {
            const emptyDir = path.join(FIXTURES_DIR, 'empty-dir');
            fs.mkdirSync(emptyDir, { recursive: true });
            
            const result = getResumesFromDir(emptyDir);
            assertArrayLength(result, 0, 'Should return empty array for empty dir');
            
            fs.rmSync(emptyDir, { recursive: true });
        });
        
        it('should find resume folders with resume.html', () => {
            const testResumesDir = path.join(FIXTURES_DIR, 'test-resumes');
            fs.mkdirSync(testResumesDir, { recursive: true });
            
            // Create valid resume folder
            const validResume = path.join(testResumesDir, 'valid-resume');
            fs.mkdirSync(validResume, { recursive: true });
            fs.writeFileSync(path.join(validResume, 'resume.html'), '<html></html>');
            
            const result = getResumesFromDir(testResumesDir);
            assertArrayLength(result, 1, 'Should find one resume');
            assertEqual(result[0], 'valid-resume', 'Should return folder name');
            
            fs.rmSync(testResumesDir, { recursive: true });
        });
        
        it('should ignore folders without resume.html', () => {
            const testResumesDir = path.join(FIXTURES_DIR, 'test-resumes');
            fs.mkdirSync(testResumesDir, { recursive: true });
            
            // Create folder without resume.html
            const invalidResume = path.join(testResumesDir, 'invalid-resume');
            fs.mkdirSync(invalidResume, { recursive: true });
            fs.writeFileSync(path.join(invalidResume, 'other.html'), '<html></html>');
            
            const result = getResumesFromDir(testResumesDir);
            assertArrayLength(result, 0, 'Should not find folders without resume.html');
            
            fs.rmSync(testResumesDir, { recursive: true });
        });
        
        it('should ignore files (only find directories)', () => {
            const testResumesDir = path.join(FIXTURES_DIR, 'test-resumes');
            fs.mkdirSync(testResumesDir, { recursive: true });
            
            // Create a file instead of directory
            fs.writeFileSync(path.join(testResumesDir, 'not-a-folder.html'), '<html></html>');
            
            const result = getResumesFromDir(testResumesDir);
            assertArrayLength(result, 0, 'Should ignore files');
            
            fs.rmSync(testResumesDir, { recursive: true });
        });
        
        it('should find multiple resume folders', () => {
            const testResumesDir = path.join(FIXTURES_DIR, 'test-resumes');
            fs.mkdirSync(testResumesDir, { recursive: true });
            
            // Create multiple valid resume folders
            ['resume-1', 'resume-2', 'resume-3'].forEach(name => {
                const resumeDir = path.join(testResumesDir, name);
                fs.mkdirSync(resumeDir, { recursive: true });
                fs.writeFileSync(path.join(resumeDir, 'resume.html'), '<html></html>');
            });
            
            const result = getResumesFromDir(testResumesDir);
            assertArrayLength(result, 3, 'Should find all three resumes');
            
            fs.rmSync(testResumesDir, { recursive: true });
        });
    });
    
    describe('getAvailableResumes()', () => {
        const { getAvailableResumes, TEMPLATES_DIR } = require('../../shared/resume');
        
        it('should return array of resumes', () => {
            const result = getAvailableResumes();
            assertTrue(Array.isArray(result), 'Should return an array');
        });
        
        it('should include templates with templates/ prefix', () => {
            const result = getAvailableResumes();
            // Should have at least the example template
            const templateResumes = result.filter(r => r.startsWith('templates/'));
            assertTrue(templateResumes.length >= 1, 'Should have at least one template');
            assertIncludes(result, 'templates/example1', 'Should include templates/example1');
        });
    });
    
    describe('getResumeDirByName()', () => {
        const { getResumeDirByName, RESUMES_DIR, TEMPLATES_DIR } = require('../../shared/resume');
        
        it('should return path in RESUMES_DIR for regular names', () => {
            const result = getResumeDirByName('my-resume');
            assertEqual(result, path.join(RESUMES_DIR, 'my-resume'), 'Should be in RESUMES_DIR');
        });
        
        it('should return path in TEMPLATES_DIR for template names', () => {
            const result = getResumeDirByName('templates/example1');
            assertEqual(result, path.join(TEMPLATES_DIR, 'example1'), 'Should be in TEMPLATES_DIR');
        });
        
        it('should strip templates/ prefix correctly', () => {
            const result = getResumeDirByName('templates/my-template');
            // Result should be in TEMPLATES_DIR, not have 'templates/templates' or 'templates/my-template' prefix preserved
            assertTrue(result.endsWith('my-template'), 'Should end with template name');
            assertTrue(result.includes(path.sep + 'templates' + path.sep) || result.includes(path.sep + 'templates'), 'Should have templates in path');
            // Should not have the prefix 'templates/' still in the result after the TEMPLATES_DIR
            const afterTemplatesDir = result.replace(TEMPLATES_DIR, '');
            assertTrue(!afterTemplatesDir.includes('templates/'), 'Should not have templates/ prefix after TEMPLATES_DIR');
        });
    });
    
    describe('getResumeDir()', () => {
        const { getResumeDir, getAvailableResumes } = require('../../shared/resume');
        
        it('should return a valid path', () => {
            const result = getResumeDir(null);
            assertTrue(path.isAbsolute(result), 'Should return absolute path');
        });
        
        it('should return specific resume when name provided', () => {
            const result = getResumeDir('templates/example1');
            assertContains(result, 'example', 'Should return the requested resume');
        });
        
        it('should fall back to first resume when invalid name provided', () => {
            const result = getResumeDir('non-existent-resume');
            assertTrue(fs.existsSync(result), 'Should return an existing directory');
        });
    });
    
    describe('parseResumeArg()', () => {
        const { parseResumeArg } = require('../../shared/resume');
        
        it('should return null when no --resume arg', () => {
            // Save original argv
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js'];
            
            const result = parseResumeArg();
            assertEqual(result, null, 'Should return null when no arg');
            
            // Restore
            process.argv = originalArgv;
        });
        
        it('should parse --resume=value correctly', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--resume=my-resume'];
            
            const result = parseResumeArg();
            assertEqual(result, 'my-resume', 'Should parse resume name');
            
            process.argv = originalArgv;
        });
        
        it('should handle templates/name format', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--resume=templates/example1'];
            
            const result = parseResumeArg();
            assertEqual(result, 'templates/example1', 'Should parse template name');
            
            process.argv = originalArgv;
        });
    });
    
    describe('parseWatchArg()', () => {
        const { parseWatchArg } = require('../../shared/resume');
        
        it('should return false when no watch arg', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js'];
            
            const result = parseWatchArg();
            assertFalse(result, 'Should return false when no arg');
            
            process.argv = originalArgv;
        });
        
        it('should return true for --watch', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '--watch'];
            
            const result = parseWatchArg();
            assertTrue(result, 'Should return true for --watch');
            
            process.argv = originalArgv;
        });
        
        it('should return true for -w', () => {
            const originalArgv = process.argv;
            process.argv = ['node', 'script.js', '-w'];
            
            const result = parseWatchArg();
            assertTrue(result, 'Should return true for -w');
            
            process.argv = originalArgv;
        });
    });
    
    describe('Module exports', () => {
        const resumeUtils = require('../../shared/resume');
        
        it('should export all required functions', () => {
            const requiredExports = [
                'SRC_DIR',
                'RESUMES_DIR',
                'TEMPLATES_DIR',
                'getResumesFromDir',
                'getAvailableResumes',
                'getResumeDirByName',
                'getResumeDir',
                'parseResumeArg',
                'parseWatchArg'
            ];
            
            requiredExports.forEach(name => {
                assertTrue(name in resumeUtils, `Should export ${name}`);
            });
        });
        
        it('should export functions as functions', () => {
            const functionExports = [
                'getResumesFromDir',
                'getAvailableResumes',
                'getResumeDirByName',
                'getResumeDir',
                'parseResumeArg',
                'parseWatchArg'
            ];
            
            functionExports.forEach(name => {
                assertEqual(typeof resumeUtils[name], 'function', `${name} should be a function`);
            });
        });
        
        it('should export directories as strings', () => {
            const dirExports = ['SRC_DIR', 'RESUMES_DIR', 'TEMPLATES_DIR'];
            
            dirExports.forEach(name => {
                assertEqual(typeof resumeUtils[name], 'string', `${name} should be a string`);
            });
        });
    });
});
