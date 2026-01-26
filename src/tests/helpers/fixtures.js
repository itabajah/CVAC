/**
 * Test Fixtures
 * Helpers for creating and managing test data
 */

const fs = require('fs');
const path = require('path');

// Test directories
const TESTS_DIR = __dirname.replace(/[\\\/]helpers$/, '');
const SRC_DIR = path.join(TESTS_DIR, '..');
const ROOT_DIR = path.join(SRC_DIR, '..');
const FIXTURES_DIR = path.join(TESTS_DIR, 'fixtures');

/**
 * Create a temporary test directory with resume structure
 */
function createTestResumeDir(name = 'test-resume') {
    const testDir = path.join(FIXTURES_DIR, 'resumes', name);
    const cssDir = path.join(testDir, 'css');
    
    // Create directories
    fs.mkdirSync(cssDir, { recursive: true });
    
    // Create minimal resume.html
    fs.writeFileSync(path.join(testDir, 'resume.html'), `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Test Resume</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <h1>John Doe</h1>
    <p>Email: john@example.com</p>
    <h2>Experience</h2>
    <p>Software Engineer at Test Company</p>
    <h2>Education</h2>
    <p>B.Sc. Computer Science, University of Test</p>
    <h2>Skills</h2>
    <p>JavaScript, Python, Git</p>
</body>
</html>
    `.trim());
    
    // Create minimal CSS
    fs.writeFileSync(path.join(cssDir, 'styles.css'), `
body { font-family: sans-serif; }
h1 { color: #333; }
    `.trim());
    
    return testDir;
}

/**
 * Clean up test fixtures
 */
function cleanupTestFixtures() {
    const resumesFixtureDir = path.join(FIXTURES_DIR, 'resumes');
    if (fs.existsSync(resumesFixtureDir)) {
        fs.rmSync(resumesFixtureDir, { recursive: true, force: true });
    }
    
    const configFixtureDir = path.join(FIXTURES_DIR, 'config');
    if (fs.existsSync(configFixtureDir)) {
        fs.rmSync(configFixtureDir, { recursive: true, force: true });
    }
}

/**
 * Create a test config file
 */
function createTestConfig(config = {}) {
    const configDir = path.join(FIXTURES_DIR, 'config');
    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    return configPath;
}

module.exports = {
    // Directories
    TESTS_DIR,
    SRC_DIR,
    ROOT_DIR,
    FIXTURES_DIR,
    
    // Setup/Teardown
    createTestResumeDir,
    cleanupTestFixtures,
    createTestConfig
};
