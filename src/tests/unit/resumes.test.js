/**
 * Unit Tests for resumes.js
 * Tests resume discovery and management for the server
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const fs = require('fs');
const path = require('path');

const {
    FIXTURES_DIR,
    cleanupTestFixtures,
    assertEqual,
    assertTrue,
    assertFalse,
    assertIncludes,
    assertDeepEqual,
    assertArrayLength
} = require('../helpers/test-utils');

describe('resumes.js', () => {
    const resumesModule = require('../../server/resumes');
    
    describe('Module Exports', () => {
        
        it('should export getAvailableResumes function', () => {
            assertEqual(typeof resumesModule.getAvailableResumes, 'function');
        });
        
        it('should export getVisibleResumes function', () => {
            assertEqual(typeof resumesModule.getVisibleResumes, 'function');
        });
        
        it('should export getResumeDirByName function', () => {
            assertEqual(typeof resumesModule.getResumeDirByName, 'function');
        });
        
        it('should export getCurrentResumeDir function', () => {
            assertEqual(typeof resumesModule.getCurrentResumeDir, 'function');
        });
        
        it('should export getCurrentResume function', () => {
            assertEqual(typeof resumesModule.getCurrentResume, 'function');
        });
        
        it('should export setCurrentResume function', () => {
            assertEqual(typeof resumesModule.setCurrentResume, 'function');
        });
        
        it('should export parseResumeArg function', () => {
            assertEqual(typeof resumesModule.parseResumeArg, 'function');
        });
        
        it('should export RESUMES_DIR constant', () => {
            assertEqual(typeof resumesModule.RESUMES_DIR, 'string');
        });
        
        it('should export TEMPLATES_DIR constant', () => {
            assertEqual(typeof resumesModule.TEMPLATES_DIR, 'string');
        });
    });
    
    describe('getAvailableResumes()', () => {
        
        it('should return an array', () => {
            const result = resumesModule.getAvailableResumes();
            assertTrue(Array.isArray(result), 'Should return array');
        });
        
        it('should include templates/example1', () => {
            const result = resumesModule.getAvailableResumes();
            assertIncludes(result, 'templates/example1', 'Should include example template');
        });
        
        it('should return consistent results on multiple calls', () => {
            const result1 = resumesModule.getAvailableResumes();
            const result2 = resumesModule.getAvailableResumes();
            assertDeepEqual(result1, result2, 'Should return same results');
        });
    });
    
    describe('getVisibleResumes()', () => {
        
        it('should return an array', () => {
            const result = resumesModule.getVisibleResumes();
            assertTrue(Array.isArray(result), 'Should return array');
        });
        
        it('should be subset of getAvailableResumes()', () => {
            const all = resumesModule.getAvailableResumes();
            const visible = resumesModule.getVisibleResumes();
            
            visible.forEach(r => {
                assertIncludes(all, r, `Visible resume ${r} should be in all resumes`);
            });
        });
    });
    
    describe('getResumeDirByName()', () => {
        
        it('should return absolute path', () => {
            const result = resumesModule.getResumeDirByName('test');
            assertTrue(path.isAbsolute(result), 'Should return absolute path');
        });
        
        it('should handle regular resume names', () => {
            const result = resumesModule.getResumeDirByName('my-resume');
            assertTrue(result.includes('resumes'), 'Should be in resumes directory');
            assertTrue(result.includes('my-resume'), 'Should include resume name');
        });
        
        it('should handle template resume names', () => {
            const result = resumesModule.getResumeDirByName('templates/example1');
            assertTrue(result.includes('templates'), 'Should be in templates directory');
            assertTrue(result.includes('example'), 'Should include template name');
        });
    });
    
    describe('getCurrentResume() and setCurrentResume()', () => {
        let originalResume;
        
        before(() => {
            originalResume = resumesModule.getCurrentResume();
        });
        
        after(() => {
            if (originalResume) {
                resumesModule.setCurrentResume(originalResume);
            }
        });
        
        it('should set and get current resume', () => {
            resumesModule.setCurrentResume('test-resume');
            assertEqual(resumesModule.getCurrentResume(), 'test-resume');
        });
        
        it('should handle template names', () => {
            resumesModule.setCurrentResume('templates/example1');
            assertEqual(resumesModule.getCurrentResume(), 'templates/example1');
        });
        
        it('should handle null values', () => {
            resumesModule.setCurrentResume(null);
            assertEqual(resumesModule.getCurrentResume(), null);
        });
    });
    
    describe('getCurrentResumeDir()', () => {
        
        it('should return a valid directory path', () => {
            const result = resumesModule.getCurrentResumeDir();
            assertTrue(path.isAbsolute(result), 'Should return absolute path');
        });
        
        it('should return existing directory when valid resume set', () => {
            resumesModule.setCurrentResume('templates/example1');
            const result = resumesModule.getCurrentResumeDir();
            assertTrue(fs.existsSync(result), 'Should return existing directory');
        });
        
        it('should contain resume.html', () => {
            resumesModule.setCurrentResume('templates/example1');
            const dir = resumesModule.getCurrentResumeDir();
            const htmlPath = path.join(dir, 'resume.html');
            assertTrue(fs.existsSync(htmlPath), 'Should contain resume.html');
        });
    });
    
    describe('parseResumeArg()', () => {
        
        it('should be a function', () => {
            assertEqual(typeof resumesModule.parseResumeArg, 'function');
        });
        
        // Note: This function modifies internal state (currentResume)
        // Testing it thoroughly would require mocking process.argv
    });
    
    describe('Directory Constants', () => {
        
        it('RESUMES_DIR should be absolute path', () => {
            assertTrue(path.isAbsolute(resumesModule.RESUMES_DIR));
        });
        
        it('TEMPLATES_DIR should be absolute path', () => {
            assertTrue(path.isAbsolute(resumesModule.TEMPLATES_DIR));
        });
        
        it('TEMPLATES_DIR should exist', () => {
            assertTrue(fs.existsSync(resumesModule.TEMPLATES_DIR));
        });
        
        it('TEMPLATES_DIR should contain example1 folder', () => {
            const examplePath = path.join(resumesModule.TEMPLATES_DIR, 'example1');
            assertTrue(fs.existsSync(examplePath));
        });
    });
    
    describe('Edge Cases', () => {
        
        it('should handle rapid resume switching', () => {
            const resumes = ['r1', 'r2', 'r3', 'r4', 'r5'];
            
            resumes.forEach(r => {
                resumesModule.setCurrentResume(r);
                assertEqual(resumesModule.getCurrentResume(), r);
            });
        });
        
        it('should handle empty string resume name', () => {
            resumesModule.setCurrentResume('');
            assertEqual(resumesModule.getCurrentResume(), '');
        });
        
        it('should handle special characters in resume name', () => {
            resumesModule.setCurrentResume('resume-with-dashes_and_underscores');
            assertEqual(resumesModule.getCurrentResume(), 'resume-with-dashes_and_underscores');
        });
    });
});
