/**
 * Resume Discovery and Management
 * 
 * High-level resume operations that combine:
 * - shared/resume.js utilities (pure functions, no state)
 * - server/state.js (centralized state management)
 * 
 * This module provides the server-specific resume logic.
 */

const state = require('./state');
const shared = require('../shared/resume');

// Re-export constants for convenience
const { RESUMES_DIR, TEMPLATES_DIR } = shared;

// ============================================================================
// Resume Discovery
// ============================================================================

/**
 * Get all available resumes (standard locations only)
 * @returns {string[]} Array of resume names
 */
function getAvailableResumes() {
    return shared.getAvailableResumes();
}

/**
 * Get all resumes including external paths from config
 * @returns {string[]} Combined array of all resumes
 */
function getAllResumesWithExternals() {
    const externalPaths = state.getExternalPaths();
    return shared.getAllResumesWithExternals(externalPaths);
}

/**
 * Get categorized resumes for UI display
 * @returns {{templates: string[], resumes: string[], externals: string[]}}
 */
function getCategorizedResumes() {
    const all = getAllResumesWithExternals();
    return {
        templates: all.filter(r => r.startsWith('templates/')),
        resumes: all.filter(r => !r.startsWith('templates/') && !r.startsWith('external:')),
        externals: all.filter(r => r.startsWith('external:'))
    };
}

/**
 * Get visible resumes (filtered by config if set)
 * @returns {string[]}
 */
function getVisibleResumes() {
    const visibleFilter = state.getVisibleResumesFilter();
    const allResumes = getAllResumesWithExternals();
    
    if (visibleFilter && visibleFilter.length > 0) {
        return allResumes.filter(r => visibleFilter.includes(r));
    }
    return allResumes;
}

// ============================================================================
// Current Resume Management
// ============================================================================

/**
 * Get current resume name
 * @returns {string|null}
 */
function getCurrentResume() {
    return state.getCurrentResume();
}

/**
 * Set current resume name
 * @param {string} name
 */
function setCurrentResume(name) {
    state.setCurrentResume(name);
}

/**
 * Get current resume directory path with smart fallback logic
 * @returns {string|null} Absolute path or null if no resumes exist
 */
function getCurrentResumeDir() {
    const allResumes = getAllResumesWithExternals();
    const visibleResumes = getVisibleResumes();
    
    if (allResumes.length === 0) {
        console.error('[RESUMES] No resumes found in resumes/ or templates/ folder');
        return null;
    }
    
    const currentResume = state.getCurrentResume();
    
    // If currentResume is set and valid, use it
    if (currentResume && allResumes.includes(currentResume)) {
        return shared.getResumeDirByNameExtended(currentResume);
    }
    
    // Try to use lastResume from config if valid and visible
    const lastResume = state.getLastResume();
    const visibleFilter = state.getVisibleResumesFilter();
    
    if (lastResume && allResumes.includes(lastResume)) {
        const isVisible = !visibleFilter || visibleFilter.length === 0 || visibleFilter.includes(lastResume);
        if (isVisible) {
            state.setCurrentResume(lastResume);
            console.log(`[RESUMES] Restored last resume: ${lastResume}`);
            return shared.getResumeDirByNameExtended(lastResume);
        }
    }
    
    // Fallback: prefer visible user resumes over templates
    const userResumes = visibleResumes.filter(r => !r.startsWith('templates/') && !r.startsWith('external:'));
    const selected = userResumes[0] || visibleResumes[0] || allResumes[0];
    state.setCurrentResume(selected);
    return shared.getResumeDirByNameExtended(selected);
}

/**
 * Parse --resume= argument from command line
 */
function parseResumeArg() {
    state.parseResumeArg();
}

// ============================================================================
// Path Resolution (delegated to shared module)
// ============================================================================

const { getResumeDirByName, getResumeDirByNameExtended } = shared;

module.exports = {
    // Discovery
    getAvailableResumes,
    getAllResumesWithExternals,
    getCategorizedResumes,
    getVisibleResumes,
    
    // Current resume management
    getCurrentResume,
    setCurrentResume,
    getCurrentResumeDir,
    parseResumeArg,
    
    // Path resolution
    getResumeDirByName,
    getResumeDirByNameExtended,
    
    // Constants
    RESUMES_DIR,
    TEMPLATES_DIR
};
