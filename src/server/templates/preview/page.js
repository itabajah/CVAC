/**
 * Preview page HTML template
 * Main page with toolbar, resume selector, and embedded resume iframe
 * 
 * This module provides two functions:
 * - getPreviewPage(): Convenience function that gathers data from state/resumes
 * - renderPreviewPage(data): Pure function for rendering (testable, no dependencies)
 */

const fs = require('fs');
const path = require('path');
const { FAVICON_LINK, FAVICON_SVG, getPageTitle } = require('../shared');

const PREVIEW_DIR = __dirname;
const SCRIPTS_DIR = path.join(PREVIEW_DIR, 'scripts');

/**
 * Read a file from the preview directory
 */
function readFile(filename) {
    return fs.readFileSync(path.join(PREVIEW_DIR, filename), 'utf-8');
}

/**
 * Read a script file from the scripts directory
 */
function readScript(filename) {
    return fs.readFileSync(path.join(SCRIPTS_DIR, filename), 'utf-8');
}

/**
 * Combine all client scripts into one
 * Injects server-side constants into client scripts
 */
function getClientScripts(resumeCheckboxes, externalPathsJson) {
    const scripts = [
        readScript('banner.js'),
        readScript('modal.js'),
        readScript('toolbar.js'),
        readScript('stop-modal.js')
            .replace('__FAVICON_SVG_PLACEHOLDER__', FAVICON_SVG)
            .replace("'__FAVICON_SVG_PLACEHOLDER__'", `\`${FAVICON_SVG}\``),
        readScript('config-modal.js')
            .replace('${resumeCheckboxes}', resumeCheckboxes)
            .replace('${externalPathsJson}', externalPathsJson),
        readScript('update-banner.js'),
        readScript('live-reload.js')
    ];
    return scripts.join('\n\n');
}

// ============================================================================
// Helper Functions (pure, no side effects)
// ============================================================================

/**
 * Get display name for a resume
 * @param {string} r - Resume name
 * @returns {string} Display name
 */
function getDisplayName(r) {
    if (r.startsWith('external:')) {
        // Format: external:displayName|path - show just displayName
        const parts = r.replace('external:', '').split('|');
        return parts[0];
    }
    return r;
}

/**
 * Escape HTML attribute values (especially Windows paths with backslashes)
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeHtmlAttr(str) {
    return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\\/g, '&#92;');
}

/**
 * Build checkbox HTML for a resume
 * @param {string} r - Resume name
 * @param {string} icon - FontAwesome icon class
 * @param {string[]|null} visibleFilter - Visible resumes filter
 * @returns {string} HTML string
 */
function buildCheckbox(r, icon, visibleFilter) {
    const isVisible = !visibleFilter || visibleFilter.length === 0 || visibleFilter.includes(r);
    const displayName = getDisplayName(r);
    const escapedValue = escapeHtmlAttr(r);
    const escapedTitle = escapeHtmlAttr(r);
    return `<label class="config-item"><input type="checkbox" value="${escapedValue}" ${isVisible ? 'checked' : ''}/><i class="fas ${icon}"></i><span title="${escapedTitle}">${displayName}</span></label>`;
}

/**
 * Build sectioned checkboxes HTML for config modal
 * @param {Object} categorized - Categorized resumes
 * @param {string[]} externalPaths - External paths
 * @param {string[]|null} visibleFilter - Visible resumes filter
 * @returns {string} HTML string
 */
function buildResumeCheckboxes(categorized, externalPaths, visibleFilter) {
    let html = '';
    
    // Templates section
    if (categorized.templates.length > 0) {
        html += `
            <div class="config-section">
                <div class="config-section__header">
                    <i class="fas fa-file-code config-section__icon"></i>
                    <span>Templates</span>
                    <span class="config-section__count">${categorized.templates.length}</span>
                </div>
                <div class="config-section__items">
                    ${categorized.templates.map(r => buildCheckbox(r, 'fa-file-code', visibleFilter)).join('')}
                </div>
            </div>`;
    }
    
    // Resumes section
    if (categorized.resumes.length > 0) {
        html += `
            <div class="config-section">
                <div class="config-section__header">
                    <i class="fas fa-file-alt config-section__icon"></i>
                    <span>Resumes</span>
                    <span class="config-section__count">${categorized.resumes.length}</span>
                </div>
                <div class="config-section__items">
                    ${categorized.resumes.map(r => buildCheckbox(r, 'fa-file-alt', visibleFilter)).join('')}
                </div>
            </div>`;
    }
    
    // Externals section
    html += `
        <div class="config-section config-section--externals" onclick="toggleExternalsSection(event)">
            <div class="config-section__header">
                <i class="fas fa-folder-open config-section__icon"></i>
                <span>External Paths</span>
                <span class="config-section__hint">(optional)</span>
                <span class="config-section__count">${externalPaths.length}</span>
            </div>
            <div class="config-section__add-path" onclick="event.stopPropagation()">
                <div class="external-paths-list" id="externalPathsList"></div>
                <div class="add-path-row">
                    <input type="text" id="newExternalPath" placeholder="Enter folder path..." class="add-path-input" />
                    <button class="add-path-btn" onclick="addExternalPath()" title="Add path">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
            </div>
        </div>`;
    
    return html;
}

// ============================================================================
// Template Rendering (Pure Function)
// ============================================================================

/**
 * @typedef {Object} PreviewPageData
 * @property {string|null} currentResume - Current resume name
 * @property {string[]} visibleResumes - List of visible resumes
 * @property {{templates: string[], resumes: string[], externals: string[]}} categorized - Categorized resumes
 * @property {string[]} externalPaths - External folder paths
 * @property {string[]|null} visibleFilter - Visible resumes filter from config
 */

/**
 * Render the preview page HTML (pure function - no module dependencies)
 * @param {PreviewPageData} data - Page data
 * @returns {string} HTML string
 */
function renderPreviewPage(data) {
    const { currentResume, visibleResumes, categorized, externalPaths, visibleFilter } = data;
    
    const resumeOptions = visibleResumes.map(r => 
        `<option value="${r}" ${r === currentResume ? 'selected' : ''}>${getDisplayName(r)}</option>`
    ).join('');
    
    const resumeCheckboxes = buildResumeCheckboxes(categorized, externalPaths, visibleFilter);
    const externalPathsJson = JSON.stringify(externalPaths);
    
    // Read template files
    const toolbarCSS = readFile('toolbar.css');
    const modalCSS = readFile('modal.css');
    const clientJS = getClientScripts(resumeCheckboxes, externalPathsJson);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${getPageTitle(currentResume)}</title>
    ${FAVICON_LINK}
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
${toolbarCSS}
${modalCSS}
    </style>
</head>
<body>
    <div class="toolbar" id="toolbar" role="toolbar" aria-label="Resume tools">
        <div class="toolbar__header">
            <span class="toolbar__title">CV Preview</span>
            <button class="toolbar__hide-btn" onclick="toggleToolbar()" title="Hide toolbar">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="toolbar__select-row">
            <div class="toolbar__select-wrapper">
                <select class="toolbar__select" onchange="switchResume(this.value)" title="Select Resume">
                    ${resumeOptions}
                </select>
            </div>
            <button class="toolbar__config-btn" onclick="openConfigModal()" title="Configure visible resumes">
                <i class="fas fa-cog"></i>
            </button>
        </div>
        <div class="toolbar__divider"></div>
        <button class="toolbar__btn toolbar__btn--pdf" onclick="openPDF()" title="Preview PDF">
            <i class="fas fa-file-pdf"></i> Preview PDF
        </button>
        <button class="toolbar__btn toolbar__btn--ats" onclick="openATS()" title="Run ATS Test">
            <i class="fas fa-microscope"></i> ATS Test
        </button>
        <button class="toolbar__btn toolbar__btn--stop" onclick="openStopModal()" title="Stop Server">
            <i class="fas fa-power-off"></i> Stop
        </button>
    </div>
    <button class="toolbar__toggle" id="toolbarToggle" onclick="toggleToolbar()" title="Show toolbar">
        <i class="fas fa-cog"></i>
    </button>
    
    <iframe id="resumeFrame" src="/resume" class="resume-frame" title="Resume Preview"></iframe>
    
    <script>
${clientJS}
    </script>
</body>
</html>`;
}

// ============================================================================
// Convenience Function (gathers data from modules)
// ============================================================================

/**
 * Generate the preview page HTML
 * Convenience function that gathers data from state/resumes modules
 * @returns {string} HTML string
 */
function getPreviewPage() {
    // Lazy-load to avoid circular dependencies
    const state = require('../../state');
    const { getVisibleResumes, getCurrentResume, getCategorizedResumes } = require('../../resumes');
    
    return renderPreviewPage({
        currentResume: getCurrentResume(),
        visibleResumes: getVisibleResumes(),
        categorized: getCategorizedResumes(),
        externalPaths: state.getExternalPaths(),
        visibleFilter: state.getVisibleResumesFilter()
    });
}

module.exports = { 
    getPreviewPage,
    renderPreviewPage,
    // Export helpers for testing
    getDisplayName,
    escapeHtmlAttr,
    buildCheckbox,
    buildResumeCheckboxes
};
