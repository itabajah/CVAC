/**
 * Config Modal
 * Modal for configuring visible resumes and external paths
 */

// Store external paths for management
let currentExternalPaths = ${externalPathsJson};

/**
 * Toggle the externals section expanded/collapsed state
 */
function toggleExternalsSection(event) {
    // Don't toggle if clicking on inputs, buttons, or checkboxes
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON' || event.target.type === 'checkbox') {
        return;
    }
    const section = event.currentTarget;
    section.classList.toggle('expanded');
}

function openConfigModal() {
    Modal.open(`
        <div class="modal modal--config">
            <div class="config-header">
                <h2 class="modal__title">Visible Resumes</h2>
                <div class="config-header__actions">
                    <button class="config-link" onclick="selectAllResumes(true)">All</button>
                    <span class="config-link-sep">|</span>
                    <button class="config-link" onclick="selectAllResumes(false)">None</button>
                </div>
            </div>
            <div class="config-list" id="configList">
                ${resumeCheckboxes}
            </div>
            <div class="config-footer">
                <button class="modal__btn modal__btn--secondary" onclick="Modal.close()">Cancel</button>
                <button class="modal__btn modal__btn--primary" onclick="saveConfig()">Save</button>
            </div>
        </div>
    `);
    // Render external paths list
    renderExternalPathsList();
}

function selectAllResumes(checked) {
    document.querySelectorAll('#configList input[type="checkbox"]').forEach(cb => cb.checked = checked);
}

function renderExternalPathsList() {
    const list = document.getElementById('externalPathsList');
    if (!list) return;
    
    if (currentExternalPaths.length === 0) {
        list.innerHTML = '<div class="external-paths-empty">No external paths added. Add a folder path below.</div>';
        return;
    }
    
    list.innerHTML = currentExternalPaths.map((p, i) => {
        // Create a simplified display name from path
        const displayName = p.split(/[\\/]/).pop() || p;
        return `
        <div class="external-path-item">
            <input type="checkbox" class="external-path-checkbox" data-path="${p.replace(/"/g, '&quot;')}" checked />
            <span class="external-path-text" title="${p}">${displayName}</span>
            <span class="external-path-full">${p}</span>
            <button class="external-path-remove" onclick="removeExternalPath(${i})" title="Remove path">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `}).join('');
}

function addExternalPath() {
    const input = document.getElementById('newExternalPath');
    let path = input.value.trim();
    
    if (!path) {
        return;
    }
    
    // Strip surrounding quotes if present
    path = path.replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
    
    // Check for duplicates
    if (currentExternalPaths.includes(path)) {
        Modal.alert('Duplicate Path', 'This path is already in the list.', 'warning', openConfigModal);
        return;
    }
    
    currentExternalPaths.push(path);
    input.value = '';
    renderExternalPathsList();
}

function removeExternalPath(index) {
    currentExternalPaths.splice(index, 1);
    renderExternalPathsList();
}

function saveConfig() {
    // Get checked resumes from Templates and Resumes sections
    const checked = Array.from(document.querySelectorAll('#configList .config-section:not(.config-section--externals) input[type="checkbox"]:checked')).map(cb => cb.value);
    
    // Get checked external paths and convert to resume format
    const checkedExternals = Array.from(document.querySelectorAll('.external-path-checkbox:checked')).map(cb => {
        const path = cb.dataset.path;
        const name = path.split(/[\\\\/]/).pop() || 'external';
        return 'external:' + name + '|' + path;
    });
    
    const allChecked = [...checked, ...checkedExternals];
    
    if (allChecked.length === 0) {
        Modal.alert('No Selection', 'Please select at least one resume to show in the dropdown.', 'warning', openConfigModal);
        return;
    }
    
    fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            visibleResumes: allChecked,
            externalPaths: currentExternalPaths
        })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            Modal.close();
            location.reload();
        } else {
            Modal.alert('Error', 'Failed to save configuration: ' + (data.error || 'Unknown error'), 'error', openConfigModal);
        }
    }).catch(err => Modal.alert('Error', 'Failed to save configuration: ' + err.message, 'error', openConfigModal));
}
