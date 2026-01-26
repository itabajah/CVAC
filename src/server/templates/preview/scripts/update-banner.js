/**
 * Update Banner
 * Shows notification when updates are available
 * Uses the shared banner system
 */

let _updateStatus = {};

// Check for updates on page load
(function checkForUpdates() {
    fetch('/api/update-status')
        .then(res => res.json())
        .then(data => {
            _updateStatus = data;
            if (data.updateAvailable) {
                showUpdateBanner(data);
            }
        })
        .catch(() => {});
})();

function showUpdateBanner(status) {
    // Different states: normal, warning (has changes), or blocked (can't sync)
    const isBlocked = !status.canSync;
    const hasWarning = status.warning && status.canSync;
    
    const type = isBlocked ? 'error' : (hasWarning ? 'warning' : 'info');
    const warningIcon = isBlocked ? 'fa-ban' : 'fa-exclamation-triangle';
    
    showBanner('updateBanner', {
        type: type,
        message: 'A new version is available',
        icon: 'fa-info-circle',
        warningText: status.warning || null,
        warningIcon: warningIcon,
        actionText: status.canSync ? 'Sync Now' : null,
        actionIcon: 'fa-sync-alt',
        onAction: status.canSync ? syncNow : null,
        showClose: true,
        autoDismiss: false
    });
}

function dismissBanner() {
    hideBanner('updateBanner');
}

function waitForServerAndReload() {
    // Poll until server is back up, then reload
    const checkServer = () => {
        fetch('/api/update-status')
            .then(() => {
                // Server is back, reload the page
                window.location.reload();
            })
            .catch(() => {
                // Server still restarting, try again in 500ms
                setTimeout(checkServer, 500);
            });
    };
    // Start checking after a short delay to let server shut down
    setTimeout(checkServer, 1000);
}

function syncNow() {
    // Confirm if there's a warning (uncommitted changes)
    if (_updateStatus.warning && _updateStatus.canSync) {
        Modal.confirm(
            'Warning',
            _updateStatus.warning + '\n\nAre you sure you want to sync?',
            'warning'
        ).then(confirmed => {
            if (confirmed) doSync();
        });
    } else {
        doSync();
    }
}

function doSync() {
    // Show syncing state
    showBanner('updateBanner', {
        type: 'info',
        message: 'Syncing...',
        icon: 'fa-spinner fa-spin',
        showClose: false,
        autoDismiss: false
    });
    
    fetch('/api/sync', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showBanner('updateBanner', {
                    type: 'success',
                    message: 'Synced! Restarting server...',
                    icon: 'fa-check',
                    showClose: false,
                    autoDismiss: false
                });
                // Wait for server to restart, then reload page
                waitForServerAndReload();
            } else {
                Modal.alert('Sync Failed', data.error || 'Unknown error', 'error');
                dismissBanner();
            }
        })
        .catch(err => {
            Modal.alert('Sync Failed', err.message, 'error');
            dismissBanner();
        });
}
