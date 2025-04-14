/**
 * Containers View
 * Displays container list and details
 */
import { formatBytes, formatUptime, cpuToPercentage } from '../utils.js';

export class ContainersView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the containers view
   * @param {Object} params - Route parameters
   */
  render(params = {}) {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    // Set app container with sidebar and content
    appElement.innerHTML = this.getLayoutHTML();
    
    // Render containers content
    this.renderContainersContent();
    
    // Add event listeners
    this.addEventListeners();
    
    // Set active navigation item
    this.setActiveNavItem('containers');
  }
  
  /**
   * Get the layout HTML with sidebar and content container
   * @returns {string} Layout HTML
   */
  getLayoutHTML() {
    const { user } = this.app.state.getState();
    
    return `
      <div class="app-container">
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-header">
            <h4>Proxmox Manager</h4>
            <p class="text-muted mb-0">${user ? user.username : 'Guest'}</p>
          </div>
          
          <div class="sidebar-sticky">
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="dashboard">
                  <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="nodes">
                  <i class="fas fa-server"></i> Nodes
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="vms">
                  <i class="fas fa-desktop"></i> Virtual Machines
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="containers">
                  <i class="fas fa-box"></i> Containers
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="storage">
                  <i class="fas fa-hdd"></i> Storage
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="network">
                  <i class="fas fa-network-wired"></i> Network
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="templates">
                  <i class="fas fa-copy"></i> Templates
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="settings">
                  <i class="fas fa-cog"></i> Settings
                </a>
              </li>
            </ul>
          </div>
          
          <div class="sidebar-footer">
            <button class="btn btn-outline-light w-100" id="logout-btn">
              <i class="fas fa-sign-out-alt me-2"></i> Logout
            </button>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <div class="container-fluid" id="main-content">
            <!-- Containers content will be rendered here -->
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render the containers content
   */
  async renderContainersContent() {
    const contentElement = document.getElementById('main-content');
    if (!contentElement) return;
    
    // Show loading state
    contentElement.innerHTML = `<div class="text-center py-5"><div class="spinner-border" role="status"></div><p class="mt-2">Loading containers...</p></div>`;
    
    try {
      // Get containers from state or fetch if needed
      let { containers } = this.app.state.getState();
      
      if (!containers || containers.length === 0) {
        // Fetch containers
        try {
          const containersResponse = await this.app.api.getContainers();
          containers = containersResponse.containers || [];
          this.app.state.setContainers(containers);
        } catch (error) {
          console.error('Error fetching containers:', error);
          containers = [];
        }
      }
      
      // Render content
      contentElement.innerHTML = `
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <h2 class="mb-0">Containers</h2>
          <div>
            <button id="refresh-btn" class="btn btn-outline-primary me-2">
              <i class="fas fa-sync-alt me-2"></i> Refresh
            </button>
          </div>
        </div>
        
        <!-- Containers List -->
        <div class="custom-card">
          <div class="card-header">
            <h5><i class="fas fa-box me-2"></i> LXC Containers</h5>
          </div>
          <div class="card-body">
            ${this.getContainersTableHTML(containers)}
          </div>
        </div>
      `;
      
      // Add event listeners for container actions
      const actionButtons = document.querySelectorAll('[data-action]');
      actionButtons.forEach(btn => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          
          const action = btn.getAttribute('data-action');
          const nodeId = btn.getAttribute('data-node-id');
          const containerId = btn.getAttribute('data-container-id');
          
          if (action && nodeId && containerId) {
            this.performContainerAction(nodeId, containerId, action);
          }
        });
      });
      
      // Add refresh button event listener
      const refreshBtn = document.getElementById('refresh-btn');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.refreshContainers();
        });
      }
      
    } catch (error) {
      console.error('Error rendering containers content:', error);
      contentElement.innerHTML = `
        <div class="alert alert-danger mt-4">
          <h4 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i> Error</h4>
          <p>Failed to load containers: ${error.message || 'Unknown error'}</p>
          <hr>
          <button id="retry-btn" class="btn btn-danger">Retry</button>
        </div>
      `;
      
      // Add retry button event listener
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.renderContainersContent();
        });
      }
    }
  }
  
  /**
   * Get containers table HTML
   * @param {Array} containers - Containers
   * @returns {string} HTML
   */
  getContainersTableHTML(containers) {
    if (!containers || containers.length === 0) {
      return `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i> No containers found.
        </div>
      `;
    }
    
    return `
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Node</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>Uptime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${containers.map(container => `
              <tr>
                <td>${container.vmid}</td>
                <td>${container.name || `CT ${container.vmid}`}</td>
                <td>${this.getStatusBadge(container.status)}</td>
                <td>${container.node_name}</td>
                <td>${cpuToPercentage(container.cpu)}% (${container.cpus} ${container.cpus > 1 ? 'cores' : 'core'})</td>
                <td>${formatBytes(container.mem)} / ${formatBytes(container.maxmem)}</td>
                <td>${formatUptime(container.uptime)}</td>
                <td>
                  <div class="btn-group">
                    ${container.status === 'running' ? `
                      <button class="btn btn-sm btn-warning" data-action="stop" data-node-id="${container.node_id}" data-container-id="${container.vmid}" title="Stop">
                        <i class="fas fa-stop"></i>
                      </button>
                      <button class="btn btn-sm btn-info" data-action="restart" data-node-id="${container.node_id}" data-container-id="${container.vmid}" title="Restart">
                        <i class="fas fa-redo"></i>
                      </button>
                    ` : `
                      <button class="btn btn-sm btn-success" data-action="start" data-node-id="${container.node_id}" data-container-id="${container.vmid}" title="Start">
                        <i class="fas fa-play"></i>
                      </button>
                    `}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
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
      case 'running':
        badgeClass = 'badge text-bg-success';
        icon = 'check-circle';
        break;
      case 'stopped':
        badgeClass = 'badge text-bg-danger';
        icon = 'stop-circle';
        break;
      case 'paused':
        badgeClass = 'badge text-bg-warning';
        icon = 'pause-circle';
        break;
    }
    
    return `<span class="${badgeClass}"><i class="fas fa-${icon} me-1"></i> ${status}</span>`;
  }
  
  /**
   * Perform container action
   * @param {number} nodeId - Node ID
   * @param {number} containerId - Container ID
   * @param {string} action - Action
   */
  async performContainerAction(nodeId, containerId, action) {
    // Confirm action
    const actionText = {
      start: 'start',
      stop: 'stop',
      restart: 'restart'
    }[action];
    
    const confirmed = await this.app.ui.confirm(
      `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} Container`,
      `Are you sure you want to ${actionText} this container?`,
      'Yes',
      'No'
    );
    
    if (!confirmed) return;
    
    // Show loading
    this.app.ui.showLoading(`${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ing container...`);
    
    try {
      // Perform action
      await this.app.api.performContainerAction(nodeId, containerId, action);
      
      // Refresh containers
      await this.refreshContainers();
      
      // Show success
      this.app.ui.showSuccess(`Container ${actionText}ed successfully`);
    } catch (error) {
      console.error(`Error ${actionText}ing container:`, error);
      this.app.ui.showError(`Failed to ${actionText} container: ${error.message || 'Unknown error'}`);
    } finally {
      this.app.ui.hideLoading();
    }
  }
  
  /**
   * Refresh containers
   */
  async refreshContainers() {
    try {
      // Fetch containers
      const containersResponse = await this.app.api.getContainers();
      const containers = containersResponse.containers || [];
      
      // Update state
      this.app.state.setContainers(containers);
      
      // Re-render
      this.renderContainersContent();
    } catch (error) {
      console.error('Error refreshing containers:', error);
      this.app.ui.showError(`Failed to refresh containers: ${error.message || 'Unknown error'}`);
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.app.logout();
      });
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('[data-route]');
    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const route = link.getAttribute('data-route');
        this.app.router.navigate(route);
      });
    });
  }
  
  /**
   * Set the active navigation item
   * @param {string} route - Route name
   */
  setActiveNavItem(route) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      
      const linkRoute = link.getAttribute('data-route');
      if (linkRoute === route) {
        link.classList.add('active');
      }
    });
  }
}