/**
 * Shared Banner Module
 * Centralized banner system for notifications (live reload, updates, etc.)
 */

const BANNER_CONTAINER_ID = 'bannerContainer';
const BANNER_AUTO_DISMISS_MS = 3000;

/**
 * Ensure banner container exists
 */
function ensureBannerContainer() {
    let container = document.getElementById(BANNER_CONTAINER_ID);
    if (!container) {
        container = document.createElement('div');
        container.id = BANNER_CONTAINER_ID;
        container.className = 'banner-container';
        document.body.insertBefore(container, document.body.firstChild);
    }
    return container;
}

/**
 * Show a banner notification
 * @param {string} id - Unique banner ID
 * @param {Object} options - Banner options
 * @param {string} options.type - 'info' | 'success' | 'warning' | 'error'
 * @param {string} options.message - Main message text
 * @param {string} [options.icon] - FontAwesome icon class (e.g., 'fa-sync-alt')
 * @param {boolean} [options.autoDismiss] - Auto-dismiss after timeout
 * @param {number} [options.dismissTimeout] - Custom dismiss timeout in ms
 * @param {boolean} [options.showClose] - Show close button
 * @param {string} [options.actionText] - Action button text
 * @param {string} [options.actionIcon] - Action button icon
 * @param {Function} [options.onAction] - Action button callback
 * @param {string} [options.warningText] - Additional warning text
 * @param {string} [options.warningIcon] - Warning icon
 * @param {Object} [options.customContent] - Custom HTML content to append
 */
function showBanner(id, options = {}) {
    const {
        type = 'info',
        message = '',
        icon = 'fa-info-circle',
        autoDismiss = false,
        dismissTimeout = BANNER_AUTO_DISMISS_MS,
        showClose = true,
        actionText = null,
        actionIcon = null,
        onAction = null,
        warningText = null,
        warningIcon = 'fa-exclamation-triangle',
        customContent = null
    } = options;
    
    // Remove existing banner with same ID
    hideBanner(id);
    
    const container = ensureBannerContainer();
    const banner = document.createElement('div');
    banner.id = id;
    banner.className = `banner banner--${type}`;
    banner.setAttribute('role', 'alert');
    
    // Build banner content
    let html = `
        <span class="banner__text">
            <i class="fas ${icon}"></i>
            ${message}
        </span>
    `;
    
    // Add warning text if provided
    if (warningText) {
        html += `
            <span class="banner__warning">
                <i class="fas ${warningIcon}"></i>
                ${warningText}
            </span>
        `;
    }
    
    // Add action button if provided
    if (actionText && onAction) {
        const actionId = `${id}_action`;
        html += `
            <button class="banner__btn" id="${actionId}">
                ${actionIcon ? `<i class="fas ${actionIcon}"></i>` : ''}
                ${actionText}
            </button>
        `;
    }
    
    // Add close button
    if (showClose) {
        html += `
            <button class="banner__close" onclick="hideBanner('${id}')" aria-label="Dismiss">
                <i class="fas fa-times"></i>
            </button>
        `;
    }
    
    banner.innerHTML = html;
    
    // Add custom content if provided
    if (customContent) {
        banner.appendChild(customContent);
    }
    
    container.appendChild(banner);
    
    // Attach action handler after DOM insertion
    if (actionText && onAction) {
        const actionBtn = document.getElementById(`${id}_action`);
        if (actionBtn) {
            actionBtn.addEventListener('click', onAction);
        }
    }
    
    // Auto-dismiss
    if (autoDismiss) {
        setTimeout(() => hideBanner(id), dismissTimeout);
    }
    
    return banner;
}

/**
 * Hide/remove a banner by ID
 * @param {string} id - Banner ID to remove
 */
function hideBanner(id) {
    const banner = document.getElementById(id);
    if (banner) {
        banner.classList.add('banner--hiding');
        setTimeout(() => banner.remove(), 200);
    }
}

/**
 * Update an existing banner's content
 * @param {string} id - Banner ID
 * @param {Object} options - New options (same as showBanner)
 */
function updateBanner(id, options) {
    const existing = document.getElementById(id);
    if (existing) {
        hideBanner(id);
    }
    return showBanner(id, options);
}

// Make functions globally available
window.showBanner = showBanner;
window.hideBanner = hideBanner;
window.updateBanner = updateBanner;
