/**
 * Shared Resume Utilities
 * Common functions for resume discovery and management
 * Used by cli/pdf.js, cli/ats.js, and server/resumes.js
 */

const fs = require('fs');
const path = require('path');

// Directory paths (relative to src/shared folder)
const SRC_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(SRC_DIR, '..');
const RESUMES_DIR = path.join(ROOT_DIR, 'resumes');
const TEMPLATES_DIR = path.join(ROOT_DIR, 'templates');

// Ensure resumes directory exists on first run
if (!fs.existsSync(RESUMES_DIR)) {
    fs.mkdirSync(RESUMES_DIR, { recursive: true });
}

/**
 * Get list of resume folders from a directory
 * @param {string} dir - Directory to scan
 * @returns {string[]} Array of folder names containing resume.html
 */
function getResumesFromDir(dir) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    
    return fs.readdirSync(dir)
        .filter(name => {
            const resumePath = path.join(dir, name);
            const htmlPath = path.join(resumePath, 'resume.html');
            return fs.statSync(resumePath).isDirectory() && fs.existsSync(htmlPath);
        });
}

/**
 * Get list of all available resumes (from resumes/ and templates/)
 * @returns {string[]} Array of resume names (templates prefixed with 'templates/')
 */
function getAvailableResumes() {
    const userResumes = getResumesFromDir(RESUMES_DIR);
    const templateResumes = getResumesFromDir(TEMPLATES_DIR).map(t => `templates/${t}`);
    return [...userResumes, ...templateResumes];
}

/**
 * Get resume directory path by name
 * @param {string} name - Resume name (e.g., 'my-resume' or 'templates/example')
 * @returns {string} Absolute path to the resume directory
 */
function getResumeDirByName(name) {
    if (name.startsWith('templates/')) {
        return path.join(TEMPLATES_DIR, name.replace('templates/', ''));
    }
    return path.join(RESUMES_DIR, name);
}

/**
 * Get resume directory, with fallback logic
 * @param {string|null} resumeName - Specific resume name, or null to auto-select
 * @returns {string} Absolute path to the resume directory
 */
function getResumeDir(resumeName) {
    const resumes = getAvailableResumes();
    
    if (resumes.length === 0) {
        console.error('[ERROR] No resumes found in resumes/ or templates/ folder');
        process.exit(1);
    }
    
    if (resumeName && resumes.includes(resumeName)) {
        return getResumeDirByName(resumeName);
    }
    
    // Prefer user resumes over templates
    const userResumes = resumes.filter(r => !r.startsWith('templates/'));
    const selected = userResumes[0] || resumes[0];
    return getResumeDirByName(selected);
}

/**
 * Parse --resume= argument from command line
 * @returns {string|null} Resume name or null if not specified
 */
function parseResumeArg() {
    const args = process.argv.slice(2);
    for (const arg of args) {
        if (arg.startsWith('--resume=')) {
            return arg.split('=')[1];
        }
    }
    return null;
}

/**
 * Parse --watch or -w argument from command line
 * @returns {boolean} True if watch mode requested
 */
function parseWatchArg() {
    const args = process.argv.slice(2);
    return args.includes('--watch') || args.includes('-w');
}

/**
 * Get resumes from external paths
 * @param {string[]} externalPaths - Array of external folder paths
 * @returns {string[]} Array of resume names with 'external:' prefix
 */
function getExternalResumes(externalPaths) {
    if (!Array.isArray(externalPaths)) return [];
    
    const results = [];
    for (let extPath of externalPaths) {
        if (!extPath || typeof extPath !== 'string') continue;
        
        // Strip quotes from path if present
        extPath = extPath.replace(/^"|"$/g, '').trim();
        
        try {
            // Check if the path exists and is a directory
            if (!fs.existsSync(extPath) || !fs.statSync(extPath).isDirectory()) {
                console.warn(`[RESUME] External path does not exist or is not a directory: ${extPath}`);
                continue;
            }
            
            // First check if this path itself contains resume.html
            const directHtmlPath = path.join(extPath, 'resume.html');
            if (fs.existsSync(directHtmlPath)) {
                // The path itself is a resume folder
                const folderName = path.basename(extPath);
                results.push(`external:${folderName}|${extPath}`);
            }
            
            // Also scan for subdirectories containing resume.html
            const resumeFolders = getResumesFromDir(extPath);
            for (const folder of resumeFolders) {
                const fullPath = path.join(extPath, folder);
                results.push(`external:${folder}|${fullPath}`);
            }
        } catch (e) {
            console.warn(`[RESUME] Could not scan external path ${extPath}:`, e.message);
        }
    }
    return results;
}

/**
 * Get all resumes including externals
 * @param {string[]} externalPaths - Array of external folder paths
 * @returns {string[]} Combined array of all resumes
 */
function getAllResumesWithExternals(externalPaths) {
    const standardResumes = getAvailableResumes();
    const externalResumes = getExternalResumes(externalPaths);
    return [...standardResumes, ...externalResumes];
}

/**
 * Get resume directory by name (handles external paths)
 * @param {string} name - Resume name (e.g., 'my-resume', 'templates/example', or 'external:name|path')
 * @returns {string} Absolute path to the resume directory
 */
function getResumeDirByNameExtended(name) {
    if (name.startsWith('external:')) {
        // Format: external:displayName|actualPath
        const parts = name.replace('external:', '').split('|');
        return parts.length > 1 ? parts[1] : parts[0];
    }
    return getResumeDirByName(name);
}

module.exports = {
    SRC_DIR,
    ROOT_DIR,
    RESUMES_DIR,
    TEMPLATES_DIR,
    getResumesFromDir,
    getAvailableResumes,
    getResumeDirByName,
    getResumeDirByNameExtended,
    getResumeDir,
    parseResumeArg,
    parseWatchArg,
    getExternalResumes,
    getAllResumesWithExternals
};
