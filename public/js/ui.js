/**
 * UI Helper
 * Handles common UI operations
 */
export class UI {
  constructor(app) {
    this.app = app;
    this.rootElement = document.getElementById('app-root');
  }
  
  /**
   * Create main application layout
   * @returns {HTMLElement} Layout container
   */
  createLayout() {
    // Clear root element
    this.rootElement.innerHTML = '';
    
    // Create app container
    const appContainer = document.createElement('div');
    appContainer.className = 'app-container';
    
    // Create sidebar
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar';
    sidebar.innerHTML = this.getSidebarHTML();
    
    // Create main content
    const mainContent = document.createElement('div');
    mainContent.className = 'main-content';
    mainContent.id = 'main-content';
    
    // Append elements
    appContainer.appendChild(sidebar);
    appContainer.appendChild(mainContent);
    this.rootElement.appendChild(appContainer);
    
    return mainContent;
  }
  
  /**
   * Get sidebar HTML
   * @returns {string} Sidebar HTML
   */
  getSidebarHTML() {
    const { user } = this.app.state.getState();
    
    return `
      <div class="sidebar-header">
        <div class="logo">
          <i class="fas fa-cube logo-icon"></i>
          <span>Proxmox Manager</span>
        </div>
      </div>
      
      <div class="p-3 mb-2 border-bottom" style="border-color: var(--divider) !important;">
        <div class="d-flex align-items-center">
          <div class="rounded-circle bg-gradient" style="width: 40px; height: 40px; background: linear-gradient(45deg, var(--accent-primary), var(--accent-tertiary)); display: flex; align-items: center; justify-content: center;">
            <i class="fas fa-user text-white"></i>
          </div>
          <div class="ms-3">
            <div class="fw-medium">${user?.username || 'User'}</div>
            <small class="text-muted">${user?.email || 'Administrator'}</small>
          </div>
        </div>
      </div>
      
      <div class="sidebar-nav">
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="dashboard">
            <i class="fas fa-chart-line"></i>
            Dashboard
          </a>
        </div>
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="nodes">
            <i class="fas fa-server"></i>
            Nodes
          </a>
        </div>
        
        <div class="px-4 mt-4 mb-2">
          <span class="text-muted text-uppercase" style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em;">Virtualization</span>
        </div>
        
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="vms">
            <i class="fas fa-desktop"></i>
            Virtual Machines
          </a>
        </div>
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="containers">
            <i class="fas fa-box"></i>
            Containers
          </a>
        </div>
        
        <div class="px-4 mt-4 mb-2">
          <span class="text-muted text-uppercase" style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em;">Management</span>
        </div>
        
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="storage">
            <i class="fas fa-hdd"></i>
            Storage
          </a>
        </div>
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="network">
            <i class="fas fa-network-wired"></i>
            Network
          </a>
        </div>
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="updates">
            <i class="fas fa-sync"></i>
            Updates
          </a>
        </div>
        
        <div class="px-4 mt-4 mb-2">
          <span class="text-muted text-uppercase" style="font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em;">System</span>
        </div>
        
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="settings">
            <i class="fas fa-cog"></i>
            Settings
          </a>
        </div>
        <div class="nav-item">
          <a href="#" class="nav-link" id="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </a>
        </div>
      </div>
    `;
  }
  
  /**
   * Show loading overlay
   * @param {string} message - Loading message
   */
  showLoading(message = 'Loading...') {
    // Hide any existing loading overlay
    this.hideLoading();
    
    // Create loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loader-overlay';
    loadingOverlay.innerHTML = `
      <div class="text-center">
        <div class="loader"></div>
        <div class="loader-message">${message}</div>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(loadingOverlay);
    
    // Update app state
    this.app.state.setLoading(true);
  }
  
  /**
   * Hide loading overlay
   */
  hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
      loadingOverlay.remove();
    }
    
    // Update app state
    this.app.state.setLoading(false);
  }
  
  /**
   * Show error message
   * @param {string} message - Error message
   * @param {string} title - Error title
   */
  showError(message, title = 'Error') {
    this.showNotification(message, 'danger', title);
  }
  
  /**
   * Show success message
   * @param {string} message - Success message
   * @param {string} title - Success title
   */
  showSuccess(message, title = 'Success') {
    this.showNotification(message, 'success', title);
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, danger, warning, info)
   * @param {string} title - Notification title
   */
  showNotification(message, type = 'info', title = '') {
    // Hide any existing notification
    this.hideNotification();
    
    // Create notification
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = `notification ${type}`;
    
    // Icon based on type
    let iconClass = 'info-circle';
    if (type === 'success') iconClass = 'check-circle';
    if (type === 'danger') iconClass = 'exclamation-circle';
    if (type === 'warning') iconClass = 'exclamation-triangle';
    
    notification.innerHTML = `
      <div class="notification-icon">
        <i class="fas fa-${iconClass}"></i>
      </div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ''}
        <div class="notification-message">${message}</div>
      </div>
      <div class="notification-close">
        <i class="fas fa-times"></i>
      </div>
    `;
    
    // Add event listener to close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.hideNotification();
    });
    
    // Append to body
    document.body.appendChild(notification);
    
    // Add show class after a slight delay (for animation)
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideNotification();
    }, 5000);
  }
  
  /**
   * Hide notification
   */
  hideNotification() {
    const notification = document.getElementById('notification');
    if (notification) {
      notification.remove();
    }
  }
  
  /**
   * Create page header
   * @param {string} title - Page title
   * @param {string} icon - Font Awesome icon class
   * @returns {string} Header HTML
   */
  createPageHeader(title, icon = 'cube') {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4 fade-in">
        <div>
          <h2 class="mb-0 fw-bold"><i class="fas fa-${icon} me-2 text-primary"></i> ${title}</h2>
          <p class="text-muted mb-0 mt-1">Manage your Proxmox infrastructure</p>
        </div>
        <div class="d-flex align-items-center">
          <button id="refresh-btn" class="btn btn-primary rounded-pill shadow-sm" title="Refresh data">
            <i class="fas fa-sync-alt me-2"></i> Refresh
          </button>
        </div>
      </div>
    `;
  }
  
  /**
   * Create a card
   * @param {string} title - Card title
   * @param {string} content - Card content
   * @param {string} icon - Font Awesome icon class
   * @returns {string} Card HTML
   */
  createCard(title, content, icon = null) {
    return `
      <div class="card mb-4 slide-in">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">
            ${icon ? `<i class="fas fa-${icon} me-2 text-primary"></i>` : ''}
            ${title}
          </h5>
        </div>
        <div class="card-body">
          ${content}
        </div>
      </div>
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
   * Format date to human-readable format
   * @param {string} dateStr - Date string
   * @returns {string} Formatted date
   */
  formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }
  
  /**
   * Get status badge HTML
   * @param {string} status - Status
   * @returns {string} Badge HTML
   */
  getStatusBadge(status) {
    let badgeClass = 'bg-secondary';
    let icon = 'question-circle';
    
    // Determine badge type based on status
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();
      
      if (lowerStatus.includes('running') || lowerStatus === 'up' || lowerStatus === 'online') {
        badgeClass = 'bg-success';
        icon = 'check-circle';
      } else if (lowerStatus.includes('stopped') || lowerStatus === 'down' || lowerStatus === 'offline') {
        badgeClass = 'bg-danger';
        icon = 'times-circle';
      } else if (lowerStatus.includes('pause') || lowerStatus.includes('suspend')) {
        badgeClass = 'bg-warning';
        icon = 'pause-circle';
      }
    }
    
    return `<span class="badge ${badgeClass} rounded-pill"><i class="fas fa-${icon} me-1"></i> ${status}</span>`;
  }
  
  /**
   * Create resource usage meter
   * @param {number} usedPercent - Used percentage (0-100)
   * @param {string} label - Resource label
   * @param {string} value - Current value text
   * @returns {string} Resource meter HTML
   */
  createResourceMeter(usedPercent, label, value) {
    let meterClass = 'resource-meter-low';
    
    if (usedPercent > 80) {
      meterClass = 'resource-meter-high';
    } else if (usedPercent > 60) {
      meterClass = 'resource-meter-medium';
    }
    
    return `
      <div class="mb-3">
        <div class="resource-label mb-1">
          <span>${label}</span>
          <span>${value}</span>
        </div>
        <div class="resource-meter">
          <div class="resource-meter-fill ${meterClass}" style="width: ${usedPercent}%"></div>
        </div>
      </div>
    `;
  }
}