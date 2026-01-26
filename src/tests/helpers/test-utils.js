/**
 * Test Utilities
 * Re-exports all test helpers from split modules
 */

const fixtures = require('./fixtures');
const assertions = require('./assertions');
const http = require('./http');

module.exports = {
    // Directories (from fixtures)
    ...fixtures,
    // Alias for backwards compatibility in tests
    SRC_DIR: fixtures.SRC_DIR,
    
    // HTTP helpers
    ...http,
    
    // Assertions
    ...assertions
};
