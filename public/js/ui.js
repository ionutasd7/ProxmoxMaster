/**
 * UI Helper
 * Common UI functions and components
 */
export class UI {
  constructor(app) {
    this.app = app;
    this.toastContainer = null;
    this.loadingOverlay = null;
    
    this.initToastContainer();
    this.initLoadingOverlay();
  }
  
  /**
   * Initialize toast container
   */
  initToastContainer() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      const toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      document.body.appendChild(toastContainer);
      this.toastContainer = toastContainer;
    } else {
      this.toastContainer = document.getElementById('toast-container');
    }
  }
  
  /**
   * Initialize loading overlay
   */
  initLoadingOverlay() {
    // Create loading overlay if it doesn't exist
    if (!document.getElementById('loading-overlay')) {
      const loadingOverlay = document.createElement('div');
      loadingOverlay.id = 'loading-overlay';
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.innerHTML = `
        <div class="loading-spinner">
          <div class="spinner-border text-light" role="status"></div>
          <p class="mt-2 text-light" id="loading-message">Loading...</p>
        </div>
      `;
      document.body.appendChild(loadingOverlay);
      this.loadingOverlay = loadingOverlay;
    } else {
      this.loadingOverlay = document.getElementById('loading-overlay');
    }
  }
  
  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
      loadingMessage.textContent = message;
    }
    
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.add('show');
    }
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    if (this.loadingOverlay) {
      this.loadingOverlay.classList.remove('show');
    }
  }
  
  /**
   * Show a toast notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, danger, warning, info)
   * @param {number} duration - Duration in milliseconds
   */
  showToast(message, type = 'primary', duration = 3000) {
    const id = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.id = id;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    let icon = 'info-circle';
    switch (type) {
      case 'success':
        icon = 'check-circle';
        break;
      case 'danger':
        icon = 'exclamation-circle';
        break;
      case 'warning':
        icon = 'exclamation-triangle';
        break;
    }
    
    toast.innerHTML = `
      <div class="toast-header">
        <i class="fas fa-${icon} me-2 text-${type}"></i>
        <strong class="me-auto">Proxmox Manager</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    this.toastContainer.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast, {
      autohide: true,
      delay: duration
    });
    
    bsToast.show();
    
    // Remove toast after it's hidden
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }
  
  /**
   * Show a success toast notification
   * @param {string} message - Notification message
   */
  showSuccess(message) {
    this.showToast(message, 'success');
  }
  
  /**
   * Show an error toast notification
   * @param {string} message - Notification message
   */
  showError(message) {
    this.showToast(message, 'danger');
  }
  
  /**
   * Show a warning toast notification
   * @param {string} message - Notification message
   */
  showWarning(message) {
    this.showToast(message, 'warning');
  }
  
  /**
   * Show an info toast notification
   * @param {string} message - Notification message
   */
  showInfo(message) {
    this.showToast(message, 'info');
  }
  
  /**
   * Show a confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @returns {Promise<boolean>} Whether confirmed
   */
  confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const id = 'confirm-modal-' + Date.now();
      
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = id;
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('aria-hidden', 'true');
      
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
              <button type="button" class="btn btn-primary" id="${id}-confirm">${confirmText}</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to document
      document.body.appendChild(modal);
      
      // Initialize Bootstrap modal
      const bsModal = new bootstrap.Modal(modal);
      
      // Add event listeners
      const confirmButton = document.getElementById(`${id}-confirm`);
      confirmButton.addEventListener('click', () => {
        bsModal.hide();
        resolve(true);
      });
      
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
        resolve(false);
      });
      
      // Show modal
      bsModal.show();
    });
  }
  
  /**
   * Show a prompt dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {string} defaultValue - Default input value
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @returns {Promise<string|null>} User input or null if cancelled
   */
  prompt(title, message, defaultValue = '', confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      const id = 'prompt-modal-' + Date.now();
      
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'modal fade';
      modal.id = id;
      modal.setAttribute('tabindex', '-1');
      modal.setAttribute('aria-hidden', 'true');
      
      modal.innerHTML = `
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
              <input type="text" class="form-control" id="${id}-input" value="${defaultValue}">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
              <button type="button" class="btn btn-primary" id="${id}-confirm">${confirmText}</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to document
      document.body.appendChild(modal);
      
      // Initialize Bootstrap modal
      const bsModal = new bootstrap.Modal(modal);
      
      // Add event listeners
      const confirmButton = document.getElementById(`${id}-confirm`);
      const input = document.getElementById(`${id}-input`);
      
      confirmButton.addEventListener('click', () => {
        bsModal.hide();
        resolve(input.value);
      });
      
      modal.addEventListener('hidden.bs.modal', () => {
        modal.remove();
        resolve(null);
      });
      
      // Show modal
      bsModal.show();
      
      // Focus input
      input.focus();
    });
  }
  
  /**
   * Get status badge
   * @param {string} status - Status
   * @returns {string} HTML
   */
  getStatusBadge(status) {
    let badgeClass = 'badge text-bg-secondary';
    let icon = 'question-circle';
    
    switch (status) {
      case 'online':
      case 'running':
        badgeClass = 'badge text-bg-success';
        icon = 'check-circle';
        break;
      case 'offline':
      case 'stopped':
        badgeClass = 'badge text-bg-danger';
        icon = 'stop-circle';
        break;
      case 'warning':
      case 'paused':
        badgeClass = 'badge text-bg-warning';
        icon = 'exclamation-triangle';
        break;
    }
    
    return `<span class="${badgeClass}"><i class="fas fa-${icon} me-1"></i> ${status}</span>`;
  }
}