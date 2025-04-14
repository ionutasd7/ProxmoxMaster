/**
 * UI Helper
 * Handles common UI operations
 */
export class UI {
  constructor(app) {
    this.app = app;
    
    // Initialize Bootstrap tooltips and popovers
    document.addEventListener('DOMContentLoaded', () => {
      this.initializeBootstrapComponents();
    });
  }
  
  /**
   * Initialize Bootstrap components
   */
  initializeBootstrapComponents() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
      return new bootstrap.Popover(popoverTriggerEl);
    });
  }
  
  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    const loadingOverlay = document.getElementById('loading-overlay');
    const loadingMessage = document.getElementById('loading-message');
    
    if (loadingOverlay && loadingMessage) {
      loadingMessage.textContent = message;
      loadingOverlay.classList.remove('d-none');
    }
    
    this.app.state.setLoading(true);
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    
    if (loadingOverlay) {
      loadingOverlay.classList.add('d-none');
    }
    
    this.app.state.setLoading(false);
  }
  
  /**
   * Show a success notification
   * @param {string} message - Success message
   */
  showSuccess(message) {
    this.showNotification('Success', message, 'success');
  }
  
  /**
   * Show an error notification
   * @param {string} message - Error message
   */
  showError(message) {
    this.showNotification('Error', message, 'danger');
    this.app.state.setError(message);
  }
  
  /**
   * Show a warning notification
   * @param {string} message - Warning message
   */
  showWarning(message) {
    this.showNotification('Warning', message, 'warning');
  }
  
  /**
   * Show an info notification
   * @param {string} message - Info message
   */
  showInfo(message) {
    this.showNotification('Info', message, 'info');
  }
  
  /**
   * Show a notification toast
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, danger, warning, info)
   */
  showNotification(title, message, type = 'info') {
    const toastEl = document.getElementById('notification-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (toastEl && toastTitle && toastMessage && toastIcon) {
      // Set toast content
      toastTitle.textContent = title;
      toastMessage.textContent = message;
      
      // Set toast icon
      toastIcon.className = 'me-2 fas';
      
      switch (type) {
        case 'success':
          toastIcon.classList.add('fa-check-circle', 'text-success');
          break;
        case 'danger':
          toastIcon.classList.add('fa-exclamation-circle', 'text-danger');
          break;
        case 'warning':
          toastIcon.classList.add('fa-exclamation-triangle', 'text-warning');
          break;
        case 'info':
        default:
          toastIcon.classList.add('fa-info-circle', 'text-info');
          break;
      }
      
      // Show toast
      const toast = new bootstrap.Toast(toastEl, { delay: 5000 });
      toast.show();
    }
  }
  
  /**
   * Create a card with header and body
   * @param {string} title - Card title
   * @param {string} content - Card content (HTML)
   * @param {string} icon - Card icon (Font Awesome class)
   * @returns {string} Card HTML
   */
  createCard(title, content, icon = null) {
    let iconHTML = '';
    
    if (icon) {
      iconHTML = `<i class="fas fa-${icon} me-2"></i>`;
    }
    
    return `
      <div class="custom-card">
        <div class="card-header">
          <h5>${iconHTML}${title}</h5>
          <div class="card-header-actions">
            <button type="button" class="btn btn-sm btn-outline-secondary refresh-card-btn">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
        <div class="card-body">
          ${content}
        </div>
      </div>
    `;
  }
  
  /**
   * Create a resource usage card
   * @param {string} title - Resource title
   * @param {number} percentage - Percentage value
   * @param {string} label - Resource label
   * @param {string} type - Resource type (cpu, memory, disk)
   * @returns {string} Resource card HTML
   */
  createResourceCard(title, percentage, label, type = 'cpu') {
    let colorClass = 'cpu-bar';
    
    if (type === 'memory') {
      colorClass = 'memory-bar';
    } else if (type === 'disk') {
      colorClass = 'disk-bar';
    }
    
    return `
      <div class="resource-card">
        <div class="resource-header">
          <div class="resource-title">${title}</div>
          <div class="resource-value" id="${type}-usage-percentage">${percentage}%</div>
        </div>
        <div class="resource-bar">
          <div class="resource-progress ${colorClass}" style="width: ${percentage}%;"></div>
        </div>
        <div class="mt-2 text-muted small text-end" id="${type}-usage-label">${label}</div>
      </div>
    `;
  }
  
  /**
   * Get status badge HTML
   * @param {string} status - Status (online, offline, warning, unknown)
   * @returns {string} Status badge HTML
   */
  getStatusBadge(status) {
    status = status ? status.toLowerCase() : 'unknown';
    
    let badgeClass = 'status-unknown';
    let badgeText = 'Unknown';
    let badgeIcon = 'question-circle';
    
    switch (status) {
      case 'online':
        badgeClass = 'status-online';
        badgeText = 'Online';
        badgeIcon = 'check-circle';
        break;
      case 'offline':
        badgeClass = 'status-offline';
        badgeText = 'Offline';
        badgeIcon = 'times-circle';
        break;
      case 'warning':
        badgeClass = 'status-warning';
        badgeText = 'Warning';
        badgeIcon = 'exclamation-triangle';
        break;
    }
    
    return `
      <span class="status-badge ${badgeClass}">
        <i class="fas fa-${badgeIcon} me-1"></i> ${badgeText}
      </span>
    `;
  }
  
  /**
   * Format bytes to human-readable size
   * @param {number} bytes - Bytes
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted size
   */
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  /**
   * Format uptime to human-readable time
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    if (!seconds || seconds <= 0) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  /**
   * Format a date to a human-readable string
   * @param {string} dateString - Date string
   * @returns {string} Formatted date
   */
  formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  }
  
  /**
   * Show a confirm dialog
   * @param {string} title - Dialog title
   * @param {string} message - Dialog message
   * @param {string} confirmText - Confirm button text
   * @param {string} cancelText - Cancel button text
   * @returns {Promise<boolean>} User confirmation
   */
  confirm(title, message, confirmText = 'Confirm', cancelText = 'Cancel') {
    return new Promise((resolve) => {
      // Create modal element
      const modalId = 'confirm-modal-' + Date.now();
      const modalHTML = `
        <div class="modal fade" id="${modalId}" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">${title}</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                ${message}
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${cancelText}</button>
                <button type="button" class="btn btn-primary confirm-btn">${confirmText}</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Append modal to body
      document.body.insertAdjacentHTML('beforeend', modalHTML);
      
      const modalEl = document.getElementById(modalId);
      const modal = new bootstrap.Modal(modalEl);
      
      // Add event listeners
      modalEl.querySelector('.confirm-btn').addEventListener('click', () => {
        modal.hide();
        resolve(true);
      });
      
      modalEl.addEventListener('hidden.bs.modal', () => {
        modalEl.remove();
        resolve(false);
      });
      
      // Show modal
      modal.show();
    });
  }
}