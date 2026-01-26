/**
 * Toolbar Functions
 * Controls for toolbar visibility and actions
 */

function toggleToolbar() {
    const toolbar = document.getElementById('toolbar');
    const toggle = document.getElementById('toolbarToggle');
    toolbar.classList.toggle('toolbar--hidden');
    toggle.style.display = toolbar.classList.contains('toolbar--hidden') ? 'flex' : 'none';
}

function openPDF() { window.open('/pdf', '_blank'); }
function openATS() { window.open('/ats-test', '_blank'); }

function switchResume(name) {
    fetch('/api/switch/' + encodeURIComponent(name))
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('resumeFrame').src = '/resume?t=' + Date.now();
                document.title = 'CV Preview - ' + name;
            }
        });
}
