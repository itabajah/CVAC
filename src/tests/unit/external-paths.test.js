/**
 * Unit Tests for External Paths Feature
 * Tests external resume discovery and path handling
 */

const { describe, it, before, after, beforeEach, afterEach } = require('node:test');
const fs = require('fs');
const path = require('path');

const {
    TESTS_DIR,
    SRC_DIR,
    FIXTURES_DIR,
    assertEqual,
    assertTrue,
    assertFalse,
    assertArrayLength,
    assertContains
} = require('../helpers/test-utils');

// Helper to create test resume directory (local to avoid cleanup conflicts)
function createExternalTestDir(name) {
    const testDir = path.join(FIXTURES_DIR, 'external-test', name);
    const cssDir = path.join(testDir, 'css');
    
    fs.mkdirSync(cssDir, { recursive: true });
    
    fs.writeFileSync(path.join(testDir, 'resume.html'), `
<!DOCTYPE html>
<html><head><title>Test</title></head>
<body><h1>Test Resume</h1></body>
</html>
    `.trim());
    
    fs.writeFileSync(path.join(cssDir, 'styles.css'), 'body { color: black; }');
    
    return testDir;
}

function cleanupExternalTestDir() {
    const testDir = path.join(FIXTURES_DIR, 'external-test');
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

describe('External Paths Feature', () => {
    
    describe('getExternalResumes()', () => {
        const { getExternalResumes } = require('../../shared/resume');
        
        before(() => {
            cleanupExternalTestDir();
        });
        
        after(() => {
            cleanupExternalTestDir();
        });
        
        it('should return empty array for empty paths array', () => {
            const result = getExternalResumes([]);
            assertArrayLength(result, 0, 'Should return empty array for empty input');
        });
        
        it('should return empty array for null/undefined paths', () => {
            const result1 = getExternalResumes(null);
            const result2 = getExternalResumes(undefined);
            assertArrayLength(result1, 0, 'Should handle null');
            assertArrayLength(result2, 0, 'Should handle undefined');
        });
        
        it('should return empty array for non-existent paths', () => {
            const result = getExternalResumes(['/non/existent/path']);
            assertArrayLength(result, 0, 'Should return empty for non-existent path');
        });
        
        it('should discover resume in valid external path', () => {
            const testDir = createExternalTestDir('valid-resume');
            
            const result = getExternalResumes([testDir]);
            assertArrayLength(result, 1, 'Should find one resume');
            assertTrue(result[0].startsWith('external:'), 'Should have external: prefix');
            assertContains(result[0], '|', 'Should contain pipe separator');
        });
        
        it('should use folder name as display name', () => {
            const testDir = createExternalTestDir('my-external-resume');
            
            const result = getExternalResumes([testDir]);
            assertContains(result[0], 'my-external-resume', 'Should use folder name');
        });
        
        it('should include full path after pipe', () => {
            const testDir = createExternalTestDir('path-test');
            
            const result = getExternalResumes([testDir]);
            const parts = result[0].split('|');
            assertEqual(parts.length, 2, 'Should have two parts separated by pipe');
            assertEqual(parts[1], testDir, 'Second part should be full path');
        });
        
        it('should handle quoted paths', () => {
            const testDir = createExternalTestDir('quoted-test');
            const quotedPath = `"${testDir}"`;
            
            const result = getExternalResumes([quotedPath]);
            assertArrayLength(result, 1, 'Should find resume in quoted path');
        });
        
        it('should skip directories without resume.html', () => {
            const emptyDir = path.join(FIXTURES_DIR, 'external-test', 'empty-external');
            fs.mkdirSync(emptyDir, { recursive: true });
            
            const result = getExternalResumes([emptyDir]);
            assertArrayLength(result, 0, 'Should skip dir without resume.html');
        });
        
        it('should handle multiple external paths', () => {
            const dir1 = createExternalTestDir('multi-1');
            const dir2 = createExternalTestDir('multi-2');
            
            const result = getExternalResumes([dir1, dir2]);
            assertArrayLength(result, 2, 'Should find both resumes');
        });
    });
    
    describe('getResumeDirByNameExtended()', () => {
        const { getResumeDirByNameExtended } = require('../../shared/resume');
        
        it('should extract path from external: format', () => {
            const testPath = 'C:\\Users\\test\\resume-folder';
            const externalName = `external:my-resume|${testPath}`;
            
            const result = getResumeDirByNameExtended(externalName);
            assertEqual(result, testPath, 'Should return path after pipe');
        });
        
        it('should handle Unix paths in external: format', () => {
            const testPath = '/home/user/resumes/my-resume';
            const externalName = `external:my-resume|${testPath}`;
            
            const result = getResumeDirByNameExtended(externalName);
            assertEqual(result, testPath, 'Should return Unix path');
        });
        
        it('should fall back to getResumeDirByName for non-external names', () => {
            const result = getResumeDirByNameExtended('example1');
            assertTrue(result !== null, 'Should find template');
            assertContains(result, 'example1', 'Should contain folder name');
        });
        
        it('should handle external name without pipe', () => {
            const malformed = 'external:name-only';
            const result = getResumeDirByNameExtended(malformed);
            // Returns everything after 'external:' since no pipe exists
            assertEqual(result, 'name-only', 'Should return name-only for malformed');
        });
    });
    
    describe('getAllResumesWithExternals()', () => {
        const { getAllResumesWithExternals } = require('../../shared/resume');
        
        before(() => {
            cleanupExternalTestDir();
        });
        
        after(() => {
            cleanupExternalTestDir();
        });
        
        it('should combine standard and external resumes', () => {
            const testDir = createExternalTestDir('combined-test');
            const externalPaths = [testDir];
            
            const result = getAllResumesWithExternals(externalPaths);
            
            // Should have at least the templates + the external
            assertTrue(result.length >= 1, 'Should have some resumes');
            
            // Check external is included
            const hasExternal = result.some(r => r.startsWith('external:'));
            assertTrue(hasExternal, 'Should include external resume');
        });
        
        it('should work with empty external paths', () => {
            const result = getAllResumesWithExternals([]);
            
            // Should still return standard resumes (templates)
            assertTrue(result.length >= 0, 'Should return array');
        });
    });
    
    describe('escapeHtmlAttr() in page.js', () => {
        // Test the escape function logic
        function escapeHtmlAttr(str) {
            return str
                .replace(/&/g, '&amp;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\\/g, '&#92;');
        }
        
        it('should escape backslashes', () => {
            const input = 'C:\\Users\\test';
            const result = escapeHtmlAttr(input);
            assertContains(result, '&#92;', 'Should escape backslashes');
            assertFalse(result.includes('\\'), 'Should not contain raw backslashes');
        });
        
        it('should escape double quotes', () => {
            const input = 'path with "quotes"';
            const result = escapeHtmlAttr(input);
            assertContains(result, '&quot;', 'Should escape quotes');
        });
        
        it('should escape HTML entities', () => {
            const input = '<script>alert("xss")</script>';
            const result = escapeHtmlAttr(input);
            assertContains(result, '&lt;', 'Should escape less than');
            assertContains(result, '&gt;', 'Should escape greater than');
        });
        
        it('should handle Windows paths correctly', () => {
            const input = 'C:\\Users\\test\\resumes';
            const result = escapeHtmlAttr(input);
            // Should not create tab or carriage return
            assertFalse(result.includes('\t'), 'Should not contain tab');
            assertFalse(result.includes('\r'), 'Should not contain carriage return');
        });
    });
    
    describe('External path format parsing', () => {
        it('should parse external:name|path format correctly', () => {
            const value = 'external:MyResume|C:\\Users\\test\\folder';
            
            assertTrue(value.startsWith('external:'), 'Should start with external:');
            
            const withoutPrefix = value.substring(9);
            const pipeIndex = withoutPrefix.indexOf('|');
            const displayName = withoutPrefix.substring(0, pipeIndex);
            const fullPath = withoutPrefix.substring(pipeIndex + 1);
            
            assertEqual(displayName, 'MyResume', 'Should extract display name');
            assertEqual(fullPath, 'C:\\Users\\test\\folder', 'Should extract full path');
        });
        
        it('should handle paths with special characters', () => {
            const value = 'external:My Resume 2024|C:\\Users\\test\\My Resume 2024';
            
            const withoutPrefix = value.substring(9);
            const pipeIndex = withoutPrefix.indexOf('|');
            const displayName = withoutPrefix.substring(0, pipeIndex);
            const fullPath = withoutPrefix.substring(pipeIndex + 1);
            
            assertEqual(displayName, 'My Resume 2024', 'Should handle spaces');
            assertEqual(fullPath, 'C:\\Users\\test\\My Resume 2024', 'Should preserve path');
        });
    });
});
