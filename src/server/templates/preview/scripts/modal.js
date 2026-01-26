/**
 * Modal System
 * Reusable modal dialog functionality
 */

const Modal = {
    overlay: null,
    
    open(content, options = {}) {
        this.close();
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';
        this.overlay.innerHTML = content;
        document.body.appendChild(this.overlay);
        
        // Close on backdrop click (unless disabled)
        if (options.closeOnBackdrop !== false) {
            this.overlay.onclick = (e) => { if (e.target === this.overlay) this.close(); };
        }
        
        // Close on Escape key
        this.escHandler = (e) => { if (e.key === 'Escape') this.close(); };
        document.addEventListener('keydown', this.escHandler);
    },
    
    close() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        if (this.escHandler) {
            document.removeEventListener('keydown', this.escHandler);
            this.escHandler = null;
        }
    },
    
    // Alert modal (info, warning, error)
    alert(title, message, type = 'info', onClose = null) {
        const icons = {
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle',
            success: 'fa-check-circle'
        };
        const icon = icons[type] || icons.info;
        
        this.open(`
            <div class="modal">
                <div class="modal__alert-icon"><i class="fas ${icon}"></i></div>
                <h2 class="modal__title">${title}</h2>
                <p class="modal__text">${message}</p>
                <div class="modal__actions">
                    <button class="modal__btn modal__btn--primary" id="modal-alert-ok">OK</button>
                </div>
            </div>
        `);
        
        document.getElementById('modal-alert-ok').onclick = () => {
            this.close();
            if (onClose) onClose();
        };
    }
};
