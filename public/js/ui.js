/**
 * UI Helper
 * Manages UI components and provides helper methods
 */
export class UI {
  constructor(app) {
    this.app = app;
    
    // Create loading overlay
    this.loadingOverlay = document.createElement('div');
    this.loadingOverlay.className = 'loading-overlay hidden';
    this.loadingOverlay.innerHTML = `
      <div class="loading-spinner">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="loading-message mt-3 text-light">Loading...</p>
      </div>
    `;
    
    // Create toast container
    this.toastContainer = document.createElement('div');
    this.toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    this.toastContainer.setAttribute('aria-live', 'polite');
    this.toastContainer.setAttribute('aria-atomic', 'true');
    
    // Add elements to body when DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      document.body.appendChild(this.loadingOverlay);
      document.body.appendChild(this.toastContainer);
    });
  }
  
  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const messageEl = this.loadingOverlay.querySelector('.loading-message');
    if (messageEl) {
      messageEl.textContent = message;
    }
    
    this.loadingOverlay.classList.remove('hidden');
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    this.loadingOverlay.classList.add('hidden');
  }
  
  /**
   * Show a toast notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning, info)
   * @param {number} duration - Duration in milliseconds
   * @returns {HTMLElement} Toast element
   */
  showToast(message, type = 'info', duration = 3000) {
    // Create a unique ID for the toast
    const toastId = `toast-${Date.now()}`;
    
    // Get background and icon based on type
    let bgClass = 'bg-primary';
    let icon = 'info-circle';
    
    switch (type) {
      case 'success':
        bgClass = 'bg-success';
        icon = 'check-circle';
        break;
      case 'error':
        bgClass = 'bg-danger';
        icon = 'exclamation-circle';
        break;
      case 'warning':
        bgClass = 'bg-warning';
        icon = 'exclamation-triangle';
        break;
      case 'info':
      default:
        bgClass = 'bg-primary';
        icon = 'info-circle';
        break;
    }
    
    // Create toast element
    const toastEl = document.createElement('div');
    toastEl.className = `toast ${bgClass} text-white`;
    toastEl.id = toastId;
    toastEl.setAttribute('role', 'alert');
    toastEl.setAttribute('aria-live', 'assertive');
    toastEl.setAttribute('aria-atomic', 'true');
    
    toastEl.innerHTML = `
      <div class="toast-header ${bgClass} text-white">
        <i class="fas fa-${icon} me-2"></i>
        <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `;
    
    // Add toast to container
    this.toastContainer.appendChild(toastEl);
    
    // Initialize Bootstrap toast
    const toast = new bootstrap.Toast(toastEl, {
      autohide: true,
      delay: duration
    });
    
    // Show toast
    toast.show();
    
    // Remove toast from DOM after it's hidden
    toastEl.addEventListener('hidden.bs.toast', () => {
      toastEl.remove();
    });
    
    return toastEl;
  }
  
  /**
   * Show success toast
   * @param {string} message - Success message
   * @returns {HTMLElement} Toast element
   */
  showSuccess(message) {
    return this.showToast(message, 'success');
  }
  
  /**
   * Show error toast
   * @param {string} message - Error message
   * @returns {HTMLElement} Toast element
   */
  showError(message) {
    return this.showToast(message, 'error');
  }
  
  /**
   * Show warning toast
   * @param {string} message - Warning message
   * @returns {HTMLElement} Toast element
   */
  showWarning(message) {
    return this.showToast(message, 'warning');
  }
  
  /**
   * Show info toast
   * @param {string} message - Info message
   * @returns {HTMLElement} Toast element
   */
  showInfo(message) {
    return this.showToast(message, 'info');
  }
  
  /**
   * Show a confirmation dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @param {string} confirmButtonClass - Confirm button class
   * @returns {Promise<boolean>} Result of the confirmation
   */
  confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel', confirmButtonClass = 'btn-primary') {
    return new Promise((resolve) => {
      // Create modal element
      const modalEl = document.createElement('div');
      modalEl.className = 'modal fade';
      modalEl.id = `confirm-modal-${Date.now()}`;
      modalEl.setAttribute('tabindex', '-1');
      modalEl.setAttribute('aria-hidden', 'true');
      
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancel-btn">${cancelText}</button>
              <button type="button" class="btn ${confirmButtonClass}" id="confirm-btn">${confirmText}</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to body
      document.body.appendChild(modalEl);
      
      // Initialize Bootstrap modal
      const modal = new bootstrap.Modal(modalEl);
      
      // Add event listeners
      const confirmBtn = modalEl.querySelector('#confirm-btn');
      const cancelBtn = modalEl.querySelector('#cancel-btn');
      
      confirmBtn.addEventListener('click', () => {
        modal.hide();
        resolve(true);
      });
      
      cancelBtn.addEventListener('click', () => {
        modal.hide();
        resolve(false);
      });
      
      // Handle modal hidden event
      modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
      });
      
      // Show modal
      modal.show();
    });
  }
  
  /**
   * Show an alert dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {string} buttonText - Button text
   * @returns {Promise<void>} Promise that resolves when the dialog is closed
   */
  alert(title, message, buttonText = 'OK') {
    return new Promise((resolve) => {
      // Create modal element
      const modalEl = document.createElement('div');
      modalEl.className = 'modal fade';
      modalEl.id = `alert-modal-${Date.now()}`;
      modalEl.setAttribute('tabindex', '-1');
      modalEl.setAttribute('aria-hidden', 'true');
      
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-primary" data-bs-dismiss="modal" id="ok-btn">${buttonText}</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to body
      document.body.appendChild(modalEl);
      
      // Initialize Bootstrap modal
      const modal = new bootstrap.Modal(modalEl);
      
      // Add event listener
      const okBtn = modalEl.querySelector('#ok-btn');
      
      okBtn.addEventListener('click', () => {
        modal.hide();
        resolve();
      });
      
      // Handle modal hidden event
      modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
        resolve();
      });
      
      // Show modal
      modal.show();
    });
  }
  
  /**
   * Create a prompt dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {string} defaultValue - Default input value
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @returns {Promise<string|null>} Result of the prompt (string or null if canceled)
   */
  prompt(title, message, defaultValue = '', confirmText = 'OK', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      // Create modal element
      const modalEl = document.createElement('div');
      modalEl.className = 'modal fade';
      modalEl.id = `prompt-modal-${Date.now()}`;
      modalEl.setAttribute('tabindex', '-1');
      modalEl.setAttribute('aria-hidden', 'true');
      
      modalEl.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">${title}</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>${message}</p>
              <input type="text" class="form-control" id="prompt-input" value="${defaultValue}">
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="cancel-btn">${cancelText}</button>
              <button type="button" class="btn btn-primary" id="confirm-btn">${confirmText}</button>
            </div>
          </div>
        </div>
      `;
      
      // Add modal to body
      document.body.appendChild(modalEl);
      
      // Initialize Bootstrap modal
      const modal = new bootstrap.Modal(modalEl);
      
      // Add event listeners
      const confirmBtn = modalEl.querySelector('#confirm-btn');
      const cancelBtn = modalEl.querySelector('#cancel-btn');
      const input = modalEl.querySelector('#prompt-input');
      
      confirmBtn.addEventListener('click', () => {
        modal.hide();
        resolve(input.value);
      });
      
      cancelBtn.addEventListener('click', () => {
        modal.hide();
        resolve(null);
      });
      
      // Handle modal shown event
      modalEl.addEventListener('shown.bs.modal', () => {
        input.focus();
        input.select();
      });
      
      // Handle modal hidden event
      modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
      });
      
      // Handle enter key press
      input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
          confirmBtn.click();
        }
      });
      
      // Show modal
      modal.show();
    });
  }
}