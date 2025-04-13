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
        <h3>Proxmox Manager</h3>
      </div>
      
      <div class="sidebar-user py-2 px-3 border-bottom border-dark">
        <div class="d-flex align-items-center">
          <i class="fas fa-user-circle me-2 text-primary" style="font-size: 1.5rem;"></i>
          <div>
            <div class="text-white">${user?.username || 'User'}</div>
            <small class="text-muted">${user?.email || ''}</small>
          </div>
        </div>
      </div>
      
      <div class="sidebar-nav">
        <div class="nav-category">Overview</div>
        <div class="nav-item">
          <a href="#" class="nav-link active" data-route="dashboard">
            <i class="fas fa-tachometer-alt"></i>
            Dashboard
          </a>
        </div>
        <div class="nav-item">
          <a href="#" class="nav-link" data-route="nodes">
            <i class="fas fa-server"></i>
            Nodes
          </a>
        </div>
        
        <div class="nav-category">Virtualization</div>
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
        
        <div class="nav-category">Management</div>
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
        
        <div class="nav-category">Settings</div>
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
    loadingOverlay.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center';
    loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loadingOverlay.style.zIndex = '9999';
    loadingOverlay.innerHTML = `
      <div class="text-center">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div class="text-white">${message}</div>
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
    notification.className = `alert alert-${type} position-fixed`;
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.maxWidth = '400px';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
      <div class="d-flex align-items-center">
        <div class="me-3">
          <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-circle' : 'info-circle'} fa-2x"></i>
        </div>
        <div>
          ${title ? `<strong>${title}</strong><br>` : ''}
          ${message}
        </div>
        <button type="button" class="btn-close ms-auto" aria-label="Close"></button>
      </div>
    `;
    
    // Add event listener to close button
    notification.querySelector('.btn-close').addEventListener('click', () => {
      this.hideNotification();
    });
    
    // Append to body
    document.body.appendChild(notification);
    
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
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="mb-0"><i class="fas fa-${icon} me-2"></i> ${title}</h1>
        <div class="d-flex align-items-center">
          <button id="refresh-btn" class="btn btn-outline-primary me-2" title="Refresh data">
            <i class="fas fa-sync"></i> Refresh
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
      <div class="custom-card">
        <div class="card-header">
          ${icon ? `<i class="fas fa-${icon} me-2"></i>` : ''}
          ${title}
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
    let badgeClass = 'status-pending';
    let icon = 'question-circle';
    
    // Determine badge type based on status
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();
      
      if (lowerStatus.includes('running') || lowerStatus === 'up' || lowerStatus === 'online') {
        badgeClass = 'status-running';
        icon = 'check-circle';
      } else if (lowerStatus.includes('stopped') || lowerStatus === 'down' || lowerStatus === 'offline') {
        badgeClass = 'status-stopped';
        icon = 'times-circle';
      }
    }
    
    return `<span class="status-badge ${badgeClass}"><i class="fas fa-${icon} me-1"></i> ${status}</span>`;
  }
}