/**
 * Cleanup Functions
 */

const fs = require('fs');
const path = require('path');
const { log } = require('./utils');

/**
 * Safely remove a file
 */
function removeFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            return true;
        }
    } catch {
        // Ignore errors (file may be locked)
    }
    return false;
}

/**
 * Safely remove a directory recursively
 */
function removeDir(dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            fs.rmSync(dirPath, { recursive: true, force: true });
            return true;
        }
    } catch {
        // Ignore errors
    }
    return false;
}

/**
 * Clean up generated files and dependencies
 */
function cleanup(toolsDir, resumesDir, templatesDir) {
    console.log('');
    log('3/3', 'Cleaning up...');

    // Remove node_modules
    if (removeDir(path.join(toolsDir, 'node_modules'))) {
        console.log('  - Removed node_modules');
    }

    // Remove package-lock.json
    if (removeFile(path.join(toolsDir, 'package-lock.json'))) {
        console.log('  - Removed package-lock.json');
    }

    // Clean generated files in resume and template folders
    const dirs = [
        { path: resumesDir, prefix: '' },
        { path: templatesDir, prefix: 'templates/' }
    ];

    for (const { path: dir, prefix } of dirs) {
        if (!fs.existsSync(dir)) continue;
        
        let entries;
        try {
            entries = fs.readdirSync(dir);
        } catch {
            continue;
        }

        for (const name of entries) {
            const folder = path.join(dir, name);
            
            try {
                if (!fs.statSync(folder).isDirectory()) continue;
            } catch {
                continue;
            }

            if (removeFile(path.join(folder, 'resume.pdf'))) {
                console.log(`  - Removed ${prefix}${name}/resume.pdf`);
            }
            if (removeFile(path.join(folder, 'ats-extracted-text.txt'))) {
                console.log(`  - Removed ${prefix}${name}/ats-extracted-text.txt`);
            }
        }
    }

    console.log('');
    console.log('Done! Repo is clean.');
    console.log('');
}

module.exports = { cleanup };
