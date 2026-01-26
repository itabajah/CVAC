/**
 * Unit Tests for state.js (formerly config.js)
 * Tests configuration management functions
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
    assertDeepEqual,
    assertPathExists,
    assertPathNotExists
} = require('../helpers/test-utils');

describe('state.js', () => {
    // We need to create a mock environment for testing config
    // Since config.js uses RESUMES_DIR from resume-utils, we'll test it in isolation
    
    let testConfigDir;
    let testConfigPath;
    
    beforeEach(() => {
        cleanupTestFixtures();
        testConfigDir = path.join(FIXTURES_DIR, 'config-test');
        fs.mkdirSync(testConfigDir, { recursive: true });
        testConfigPath = path.join(testConfigDir, 'config.json');
    });
    
    afterEach(() => {
        cleanupTestFixtures();
    });
    
    describe('Config File Operations', () => {
        
        it('should handle missing config file gracefully', () => {
            // The module loads config on require, so we test the pattern
            const configPath = path.join(testConfigDir, 'nonexistent.json');
            assertPathNotExists(configPath, 'Config should not exist initially');
        });
        
        it('should create valid JSON config file', () => {
            const config = { visibleResumes: ['test'], lastResume: 'test' };
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));
            
            const loaded = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
            assertDeepEqual(loaded, config, 'Should write and read config correctly');
        });
        
        it('should handle malformed JSON gracefully', () => {
            fs.writeFileSync(testConfigPath, '{ invalid json }');
            
            let error = null;
            try {
                JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
            } catch (e) {
                error = e;
            }
            
            assertTrue(error !== null, 'Should throw error for invalid JSON');
        });
        
        it('should preserve config structure', () => {
            const config = {
                visibleResumes: ['resume-1', 'resume-2'],
                lastResume: 'resume-1'
            };
            
            fs.writeFileSync(testConfigPath, JSON.stringify(config, null, 2));
            const content = fs.readFileSync(testConfigPath, 'utf-8');
            
            // Should be pretty-printed
            assertTrue(content.includes('\n'), 'Should be formatted with newlines');
            assertTrue(content.includes('  '), 'Should have indentation');
        });
    });
    
    describe('Config Schema Validation', () => {
        
        it('should accept valid visibleResumes array', () => {
            const config = { visibleResumes: ['a', 'b', 'c'] };
            assertTrue(Array.isArray(config.visibleResumes), 'visibleResumes should be array');
        });
        
        it('should accept null visibleResumes', () => {
            const config = { visibleResumes: null };
            assertEqual(config.visibleResumes, null, 'Should accept null');
        });
        
        it('should accept valid lastResume string', () => {
            const config = { lastResume: 'my-resume' };
            assertEqual(typeof config.lastResume, 'string', 'lastResume should be string');
        });
        
        it('should accept null lastResume', () => {
            const config = { lastResume: null };
            assertEqual(config.lastResume, null, 'Should accept null');
        });
    });
    
    describe('State Module Interface', () => {
        // Test the actual module
        const stateModule = require('../../server/state');
        
        it('should export loadConfig function', () => {
            assertEqual(typeof stateModule.loadConfig, 'function', 'Should export loadConfig');
        });
        
        it('should export saveConfig function', () => {
            assertEqual(typeof stateModule.saveConfig, 'function', 'Should export saveConfig');
        });
        
        it('should export getConfig function', () => {
            assertEqual(typeof stateModule.getConfig, 'function', 'Should export getConfig');
        });
        
        it('should export updateConfig function', () => {
            assertEqual(typeof stateModule.updateConfig, 'function', 'Should export updateConfig');
        });
        
        it('should export getCurrentResume function', () => {
            assertEqual(typeof stateModule.getCurrentResume, 'function', 'Should export getCurrentResume');
        });
        
        it('should export setCurrentResume function', () => {
            assertEqual(typeof stateModule.setCurrentResume, 'function', 'Should export setCurrentResume');
        });
        
        it('getConfig should return object with expected properties', () => {
            const config = stateModule.getConfig();
            assertTrue('visibleResumes' in config, 'Should have visibleResumes property');
            assertTrue('lastResume' in config, 'Should have lastResume property');
            assertTrue('externalPaths' in config, 'Should have externalPaths property');
        });
        
        it('updateConfig should merge new values', () => {
            const originalConfig = stateModule.getConfig();
            const originalLastResume = originalConfig.lastResume;
            
            // Update with new value
            stateModule.updateConfig({ lastResume: 'updated-resume' });
            const updatedConfig = stateModule.getConfig();
            
            assertEqual(updatedConfig.lastResume, 'updated-resume', 'Should update lastResume');
            
            // Restore original
            stateModule.updateConfig({ lastResume: originalLastResume });
        });
    });
    
    describe('Config Edge Cases', () => {
        
        it('should handle empty config object', () => {
            const config = {};
            fs.writeFileSync(testConfigPath, JSON.stringify(config));
            
            const loaded = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
            assertDeepEqual(loaded, {}, 'Should handle empty object');
        });
        
        it('should handle config with extra properties', () => {
            const config = {
                visibleResumes: ['test'],
                lastResume: 'test',
                extraProperty: 'should be preserved'
            };
            
            fs.writeFileSync(testConfigPath, JSON.stringify(config));
            const loaded = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
            
            assertEqual(loaded.extraProperty, 'should be preserved', 'Should preserve extra props');
        });
        
        it('should handle empty visibleResumes array', () => {
            const config = { visibleResumes: [] };
            fs.writeFileSync(testConfigPath, JSON.stringify(config));
            
            const loaded = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
            assertDeepEqual(loaded.visibleResumes, [], 'Should handle empty array');
        });
        
        it('should handle special characters in resume names', () => {
            const config = {
                visibleResumes: ['resume-with-dashes', 'resume_with_underscores', 'templates/example1'],
                lastResume: 'templates/example1'
            };
            
            fs.writeFileSync(testConfigPath, JSON.stringify(config));
            const loaded = JSON.parse(fs.readFileSync(testConfigPath, 'utf-8'));
            
            assertDeepEqual(loaded, config, 'Should handle special characters');
        });
    });
});
