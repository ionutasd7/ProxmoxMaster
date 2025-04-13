/**
 * Dashboard View Component
 * Renders the main dashboard with sidebar and content area
 */

const DashboardView = {
  /**
   * Render the dashboard view
   * @param {HTMLElement} container - The container element
   * @param {Object} params - View parameters including auth, nodes, and selectedNode
   */
  render(container, params = {}) {
    const { auth, nodes = [], selectedNode } = params;
    
    // Create dashboard container
    const dashboardContainer = createElement('div', { className: 'dashboard-container' });
    
    // Add sidebar
    dashboardContainer.appendChild(this.renderSidebar(auth, selectedNode));
    
    // Add main content area
    dashboardContainer.appendChild(this.renderMainContent(nodes, selectedNode));
    
    // Add the dashboard container to the main container
    container.appendChild(dashboardContainer);
    
    // Load nodes if not already loaded
    if (nodes.length === 0) {
      this.loadNodesData();
    }
  },
  
  /**
   * Render the sidebar
   * @param {Object} auth - Authentication data
   * @param {Object} selectedNode - The selected node
   * @returns {HTMLElement} The sidebar element
   */
  renderSidebar(auth, selectedNode) {
    // Create sidebar element
    const sidebar = createElement('div', { className: 'sidebar' });
    
    // Add sidebar header
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <h4 class="text-center mb-0 gradient-text">Proxmox Manager</h4>
      </div>
      
      <div class="sidebar-menu">
        <!-- User info section -->
        <div class="sidebar-section">
          <h6>User</h6>
          <div class="p-3 mb-3">
            <div class="d-flex align-items-center mb-2">
              <i class="fas fa-user-circle fa-2x me-3" style="color: var(--primary);"></i>
              <div>
                <div class="fw-bold">${auth?.username || 'Unknown'}</div>
                <div class="text-muted small">${auth?.is_admin ? 'Administrator' : 'User'}</div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline-primary w-100 mt-2" data-action="logout">
              <i class="fas fa-sign-out-alt me-2"></i> Log Out
            </button>
          </div>
        </div>
        
        <!-- Navigation section -->
        <div class="sidebar-section">
          <h6>Navigation</h6>
          <div class="nav flex-column">
            <button class="nav-link active" data-action="navigate:dashboard">
              <i class="fas fa-tachometer-alt me-3"></i> Dashboard
            </button>
            <button class="nav-link" data-action="navigate:nodes">
              <i class="fas fa-server me-3"></i> Nodes Overview
            </button>
          </div>
        </div>
        
        <!-- Virtual machines section -->
        <div class="sidebar-section">
          <h6>Virtual Machines</h6>
          <div class="nav flex-column">
            <button class="nav-link" data-action="navigate:vm-list">
              <i class="fas fa-desktop me-3"></i> List VMs
            </button>
            <button class="nav-link" data-action="navigate:vm-create">
              <i class="fas fa-plus-circle me-3"></i> Create VM
            </button>
          </div>
        </div>
        
        <!-- Containers section -->
        <div class="sidebar-section">
          <h6>Containers</h6>
          <div class="nav flex-column">
            <button class="nav-link" data-action="navigate:lxc-list">
              <i class="fas fa-cube me-3"></i> List Containers
            </button>
            <button class="nav-link" data-action="navigate:lxc-create">
              <i class="fas fa-plus-circle me-3"></i> Create Container
            </button>
          </div>
        </div>
        
        <!-- Templates section -->
        <div class="sidebar-section">
          <h6>Templates</h6>
          <div class="nav flex-column">
            <button class="nav-link" data-action="navigate:templates">
              <i class="fas fa-copy me-3"></i> Manage Templates
            </button>
          </div>
        </div>
        
        <!-- Monitoring section -->
        <div class="sidebar-section">
          <h6>Monitoring</h6>
          <div class="nav flex-column">
            <button class="nav-link" data-action="navigate:monitoring">
              <i class="fas fa-chart-line me-3"></i> Resource Monitoring
            </button>
          </div>
        </div>
        
        <!-- Settings section -->
        <div class="sidebar-section">
          <h6>Settings</h6>
          <div class="nav flex-column">
            <button class="nav-link" data-action="navigate:settings">
              <i class="fas fa-cog me-3"></i> Settings
            </button>
          </div>
        </div>
      </div>
    `;
    
    return sidebar;
  },
  
  /**
   * Render the main content area
   * @param {Array} nodes - The list of nodes
   * @param {Object} selectedNode - The selected node
   * @returns {HTMLElement} The main content element
   */
  renderMainContent(nodes, selectedNode) {
    // Create main content element
    const mainContent = createElement('div', { className: 'main-content' });
    
    // Add grid background
    mainContent.appendChild(createElement('div', { className: 'grid-bg' }));
    
    // Check if nodes are available
    if (nodes.length === 0) {
      mainContent.innerHTML += this.renderNoNodesContent();
    } else {
      mainContent.innerHTML += this.renderDashboardContent(nodes, selectedNode);
    }
    
    return mainContent;
  },
  
  /**
   * Render content for when no nodes are available
   * @returns {string} HTML string for no nodes content
   */
  renderNoNodesContent() {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text">DASHBOARD</h1>
        <div class="d-flex align-items-center">
          <div class="me-3">
            <span class="badge bg-primary">
              <i class="fas fa-sitemap me-1"></i> Nodes: 0
            </span>
          </div>
          <button class="btn btn-primary btn-sm" data-action="navigate:nodes">
            <i class="fas fa-plus me-2"></i> Add Node
          </button>
        </div>
      </div>
      
      <div class="alert alert-info">
        <h4 class="alert-heading"><i class="fas fa-info-circle me-2"></i> Welcome to Proxmox Manager!</h4>
        <p>No Proxmox nodes have been added yet. To get started, add your first Proxmox node:</p>
        <button class="btn btn-primary" data-action="navigate:nodes">
          <i class="fas fa-server me-2"></i> Add Proxmox Node
        </button>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-question-circle me-2"></i> Getting Started</h5>
        </div>
        <div class="card-body">
          <p>Proxmox Manager allows you to manage your Proxmox infrastructure including:</p>
          <ul>
            <li>Managing virtual machines and containers</li>
            <li>Monitoring resource usage</li>
            <li>Creating and using templates</li>
            <li>Managing network configuration</li>
            <li>Applying updates</li>
          </ul>
          <p>Start by adding a Proxmox node to connect to your infrastructure.</p>
        </div>
      </div>
    `;
  },
  
  /**
   * Render dashboard content
   * @param {Array} nodes - The list of nodes
   * @param {Object} selectedNode - The selected node
   * @returns {string} HTML string for dashboard content
   */
  renderDashboardContent(nodes, selectedNode) {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text">DASHBOARD</h1>
        <div class="d-flex align-items-center">
          <div class="me-3">
            <span class="badge bg-primary">
              <i class="fas fa-sitemap me-1"></i> Nodes: ${nodes.length}
            </span>
          </div>
          <div class="dropdown">
            <button class="btn btn-outline-primary btn-sm dropdown-toggle" type="button" id="nodeSelector" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="fas fa-server me-2"></i>
              <span id="selected-node">${selectedNode?.name || 'Select Node'}</span>
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="nodeSelector">
              ${nodes.map(node => `
                <li>
                  <button class="dropdown-item ${selectedNode?.id === node.id ? 'active' : ''}" 
                          data-action="select-node" 
                          data-node-id="${node.id}">
                    ${node.name}
                  </button>
                </li>
              `).join('')}
              <li><hr class="dropdown-divider"></li>
              <li>
                <button class="dropdown-item" data-action="navigate:nodes">
                  <i class="fas fa-cog me-2"></i> Manage Nodes
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Quick Stats -->
      <div class="row mb-4">
        <div class="col-md-3">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-server fa-2x mb-3" style="color: var(--primary);"></i>
              <h5 class="display-4 mb-0" id="stats-nodes">${nodes.length}</h5>
              <p class="text-muted">Nodes</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-desktop fa-2x mb-3" style="color: var(--primary);"></i>
              <h5 class="display-4 mb-0" id="stats-vms">-</h5>
              <p class="text-muted">Virtual Machines</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-cube fa-2x mb-3" style="color: var(--primary);"></i>
              <h5 class="display-4 mb-0" id="stats-lxc">-</h5>
              <p class="text-muted">Containers</p>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="card">
            <div class="card-body text-center">
              <i class="fas fa-hdd fa-2x mb-3" style="color: var(--primary);"></i>
              <h5 class="display-4 mb-0" id="stats-storage">-</h5>
              <p class="text-muted">Storage Used</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-bolt me-2"></i> Quick Actions</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-3 mb-3">
              <button class="btn btn-outline-primary w-100" data-action="navigate:vm-create">
                <i class="fas fa-plus-circle me-2"></i> Create VM
              </button>
            </div>
            <div class="col-md-3 mb-3">
              <button class="btn btn-outline-primary w-100" data-action="navigate:lxc-create">
                <i class="fas fa-plus-circle me-2"></i> Create Container
              </button>
            </div>
            <div class="col-md-3 mb-3">
              <button class="btn btn-outline-primary w-100" data-action="navigate:templates">
                <i class="fas fa-copy me-2"></i> Templates
              </button>
            </div>
            <div class="col-md-3 mb-3">
              <button class="btn btn-outline-primary w-100" data-action="navigate:monitoring">
                <i class="fas fa-chart-line me-2"></i> Monitoring
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Nodes Status -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-server me-2"></i> Nodes Status</h5>
          <button class="btn btn-sm btn-outline-primary" id="refresh-nodes">
            <i class="fas fa-sync"></i>
          </button>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Host</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="nodes-table-body">
                ${nodes.map(node => `
                  <tr>
                    <td>${node.name}</td>
                    <td>${node.api_host}</td>
                    <td id="node-status-${node.id}">
                      <div class="spinner-border spinner-border-sm text-primary" role="status">
                        <span class="visually-hidden">Loading...</span>
                      </div>
                    </td>
                    <td id="node-cpu-${node.id}">-</td>
                    <td id="node-memory-${node.id}">-</td>
                    <td>
                      <button class="btn btn-sm btn-outline-primary" data-action="select-node" data-node-id="${node.id}">
                        Select
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="card">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-history me-2"></i> Recent Activity</h5>
        </div>
        <div class="card-body">
          <p class="text-muted text-center mt-3 mb-3">
            <i class="fas fa-info-circle me-2"></i> Recent activity data will be shown here once available.
          </p>
        </div>
      </div>
    `;
  },
  
  /**
   * Load nodes data
   */
  async loadNodesData() {
    try {
      // This uses the global App object to load nodes
      await App.loadNodes();
      
      // Refresh the view
      App.navigateTo(VIEWS.DASHBOARD);
    } catch (error) {
      console.error('Error loading nodes data:', error);
      showNotification('Failed to load nodes data', 'danger');
    }
  }
};