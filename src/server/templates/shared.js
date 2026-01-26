/**
 * Shared template constants and utilities
 * Common elements used across multiple HTML templates
 */

/**
 * Application name for consistent branding
 */
const APP_NAME = 'CVAC';

/**
 * Inline SVG favicon - code brackets "<>" symbol
 * URL-encoded for use in data URI
 */
const FAVICON_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%23374151' rx='12' width='100' height='100'/><path d='M42 30 L22 50 L42 70' stroke='white' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' fill='none'/><path d='M58 30 L78 50 L58 70' stroke='white' stroke-width='8' stroke-linecap='round' stroke-linejoin='round' fill='none'/></svg>`;

/**
 * Complete favicon link tag for HTML head section
 */
const FAVICON_LINK = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${FAVICON_SVG}">`;

/**
 * Generate a page title with consistent branding
 * @param {string} subtitle - The page-specific subtitle
 * @returns {string} Formatted title like "CVAC | Subtitle"
 */
function getPageTitle(subtitle) {
    return `${APP_NAME} | ${subtitle}`;
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string safe for HTML insertion
 */
function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

module.exports = {
    APP_NAME,
    FAVICON_SVG,
    FAVICON_LINK,
    getPageTitle,
    escapeHtml
};
