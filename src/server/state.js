/**
 * Unified Server State Module
 * 
 * Centralized state management for the CV As Code server.
 * Consolidates runtime state (currentResume) and persisted config (visibleResumes, lastResume, externalPaths).
 * 
 * This module provides:
 * - Single source of truth for server state
 * - Clear separation between runtime and persisted state
 * - Immutable state access patterns
 * - Testable state management
 */

const fs = require('fs');
const path = require('path');
const { RESUMES_DIR } = require('../shared/resume');

const CONFIG_FILE = path.join(RESUMES_DIR, 'config.json');

/**
 * @typedef {Object} PersistedConfig
 * @property {string[]|null} visibleResumes - List of visible resumes (null = show all)
 * @property {string|null} lastResume - Last active resume name
 * @property {string[]} externalPaths - External folder paths for resumes
 */

/**
 * @typedef {Object} ServerState
 * @property {string|null} currentResume - Currently active resume
 * @property {PersistedConfig} config - Persisted configuration
 */

/** @type {ServerState} */
const state = {
    currentResume: null,
    config: {
        visibleResumes: null,
        lastResume: null,
        externalPaths: []
    }
};

// ============================================================================
// Config File Operations (Persisted State)
// ============================================================================

/**
 * Load configuration from disk
 * @returns {PersistedConfig} The loaded configuration
 */
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
            state.config = {
                visibleResumes: Array.isArray(data.visibleResumes) ? data.visibleResumes : null,
                lastResume: typeof data.lastResume === 'string' ? data.lastResume : null,
                externalPaths: Array.isArray(data.externalPaths) ? data.externalPaths : []
            };
        }
    } catch (e) {
        console.warn('[STATE] Could not load config:', e.message);
        state.config = { visibleResumes: null, lastResume: null, externalPaths: [] };
    }
    return state.config;
}

/**
 * Save configuration to disk
 * @param {Partial<PersistedConfig>} [updates] - Optional updates to apply before saving
 * @returns {boolean} Success status
 */
function saveConfig(updates = {}) {
    try {
        // Ensure resumes directory exists
        if (!fs.existsSync(RESUMES_DIR)) {
            fs.mkdirSync(RESUMES_DIR, { recursive: true });
        }
        
        // Apply updates if provided
        if (Object.keys(updates).length > 0) {
            state.config = { ...state.config, ...updates };
        }
        
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(state.config, null, 2));
        return true;
    } catch (e) {
        console.error('[STATE] Could not save config:', e.message);
        return false;
    }
}

// ============================================================================
// Config Getters (Read-only access)
// ============================================================================

/**
 * Get current configuration (immutable copy)
 * @returns {PersistedConfig}
 */
function getConfig() {
    return { ...state.config };
}

/**
 * Get visible resumes filter
 * @returns {string[]|null}
 */
function getVisibleResumesFilter() {
    return state.config.visibleResumes ? [...state.config.visibleResumes] : null;
}

/**
 * Get last active resume from config
 * @returns {string|null}
 */
function getLastResume() {
    return state.config.lastResume;
}

/**
 * Get external paths
 * @returns {string[]}
 */
function getExternalPaths() {
    return [...(state.config.externalPaths || [])];
}

// ============================================================================
// Config Setters (Modify persisted config)
// ============================================================================

/**
 * Update configuration in memory (does not persist)
 * @param {Partial<PersistedConfig>} updates
 */
function updateConfig(updates) {
    state.config = { ...state.config, ...updates };
}

/**
 * Set visible resumes filter
 * @param {string[]|null} resumes
 */
function setVisibleResumesFilter(resumes) {
    state.config.visibleResumes = Array.isArray(resumes) ? [...resumes] : null;
}

/**
 * Set external paths
 * @param {string[]} paths
 */
function setExternalPaths(paths) {
    state.config.externalPaths = Array.isArray(paths) ? [...paths] : [];
}

// ============================================================================
// Runtime State (Current Resume)
// ============================================================================

/**
 * Get currently active resume
 * @returns {string|null}
 */
function getCurrentResume() {
    return state.currentResume;
}

/**
 * Set currently active resume
 * @param {string|null} name
 */
function setCurrentResume(name) {
    state.currentResume = name;
}

// ============================================================================
// Initialization
// ============================================================================

/**
 * Parse --resume= argument from command line and set current resume
 */
function parseResumeArg() {
    const args = process.argv.slice(2);
    for (const arg of args) {
        if (arg.startsWith('--resume=')) {
            state.currentResume = arg.split('=')[1];
            return;
        }
    }
}

// Initialize on module load
loadConfig();

module.exports = {
    // Config file operations
    loadConfig,
    saveConfig,
    
    // Config getters
    getConfig,
    getVisibleResumesFilter,
    getLastResume,
    getExternalPaths,
    
    // Config setters
    updateConfig,
    setVisibleResumesFilter,
    setExternalPaths,
    
    // Runtime state
    getCurrentResume,
    setCurrentResume,
    
    // Initialization
    parseResumeArg
};
