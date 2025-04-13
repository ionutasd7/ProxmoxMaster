/**
 * Dashboard View
 * Displays the main dashboard with overview of nodes, VMs, and containers
 */
export class DashboardView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the dashboard view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes, vms, containers } = this.app.state.getState();
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Dashboard', 'tachometer-alt')}
      
      <!-- Stats Overview -->
      <div class="stats-container">
        ${this.getStatsHTML(nodes, vms, containers)}
      </div>
      
      <!-- Node Management Card -->
      ${this.getNodeManagementHTML(nodes)}
      
      <!-- Recent Activity -->
      ${this.getRecentActivityHTML()}
    `;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Get stats overview HTML
   * @param {Array} nodes - Nodes
   * @param {Array} vms - VMs
   * @param {Array} containers - Containers
   * @returns {string} Stats HTML
   */
  getStatsHTML(nodes, vms, containers) {
    return `
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">Nodes</div>
          <div class="stat-icon">
            <i class="fas fa-server"></i>
          </div>
        </div>
        <div class="stat-value">${nodes.length}</div>
        <div class="stat-subtitle">Proxmox servers</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">Virtual Machines</div>
          <div class="stat-icon">
            <i class="fas fa-desktop"></i>
          </div>
        </div>
        <div class="stat-value">${vms.length}</div>
        <div class="stat-subtitle">QEMU/KVM VMs</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">Containers</div>
          <div class="stat-icon">
            <i class="fas fa-box"></i>
          </div>
        </div>
        <div class="stat-value">${containers.length}</div>
        <div class="stat-subtitle">LXC containers</div>
      </div>
      
      <div class="stat-card">
        <div class="stat-header">
          <div class="stat-title">System Status</div>
          <div class="stat-icon">
            <i class="fas fa-heart"></i>
          </div>
        </div>
        <div class="stat-value">
          <span class="text-success">Online</span>
        </div>
        <div class="stat-subtitle">API connection</div>
      </div>
    `;
  }
  
  /**
   * Get node management HTML
   * @param {Array} nodes - Nodes
   * @returns {string} Node management HTML
   */
  getNodeManagementHTML(nodes) {
    return this.app.ui.createCard('Server Management', `
      <h5 class="mb-3">Add Proxmox Node</h5>
      <form id="add-node-form" class="mb-4">
        <div class="row g-3">
          <div class="col-md-4">
            <label for="node-name" class="form-label">Node Name</label>
            <input type="text" class="form-control" id="node-name" placeholder="e.g., pve1" required>
          </div>
          <div class="col-md-4">
            <label for="node-hostname" class="form-label">Hostname/IP</label>
            <input type="text" class="form-control" id="node-hostname" placeholder="e.g., 10.55.1.10" required>
          </div>
          <div class="col-md-2">
            <label for="node-port" class="form-label">API Port</label>
            <input type="number" class="form-control" id="node-port" value="8006" required>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="button" id="show-more-btn" class="btn btn-secondary w-100">More Options</button>
          </div>
        </div>
        
        <div id="advanced-options" class="mt-3" style="display: none;">
          <div class="row g-3">
            <div class="col-md-6">
              <label for="api-username" class="form-label">API Username</label>
              <input type="text" class="form-control" id="api-username" value="root@pam" placeholder="Username (e.g., api@pam!home)">
            </div>
            <div class="col-md-6">
              <label for="api-password" class="form-label">API Password</label>
              <input type="password" class="form-control" id="api-password" value="Poolamea01@" placeholder="Password">
            </div>
          </div>
          
          <div class="row g-3 mt-2">
            <div class="col-md-6">
              <label for="ssh-username" class="form-label">SSH Username</label>
              <input type="text" class="form-control" id="ssh-username" value="root" placeholder="Username">
            </div>
            <div class="col-md-6">
              <label for="ssh-password" class="form-label">SSH Password</label>
              <input type="password" class="form-control" id="ssh-password" value="Poolamea01@" placeholder="Password">
            </div>
          </div>
          
          <div class="form-check mt-3">
            <input class="form-check-input" type="checkbox" id="verify-ssl">
            <label class="form-check-label" for="verify-ssl">
              Verify SSL Certificate
            </label>
          </div>
        </div>
        
        <div class="mt-3">
          <button type="button" id="test-connection-btn" class="btn btn-outline-primary me-2">
            <i class="fas fa-plug me-1"></i> Test Connection
          </button>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-plus me-1"></i> Add Node
          </button>
        </div>
        
        <div id="connection-test-results" class="mt-3" style="display: none;"></div>
      </form>
      
      <h5 class="mb-3">Configured Nodes</h5>
      ${this.getNodesTableHTML(nodes)}
    `, 'server');
  }
  
  /**
   * Get nodes table HTML
   * @param {Array} nodes - Nodes
   * @returns {string} Nodes table HTML
   */
  getNodesTableHTML(nodes) {
    if (nodes.length === 0) {
      return `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i> No nodes have been added yet. Add your first Proxmox node above.
        </div>
      `;
    }
    
    return `
      <div class="table-responsive">
        <table class="custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Hostname/IP</th>
              <th>Port</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${nodes.map(node => `
              <tr>
                <td>${node.name}</td>
                <td>${node.api_host || node.hostname}</td>
                <td>${node.api_port || node.port || 8006}</td>
                <td>${this.app.ui.getStatusBadge(node.status || 'Unknown')}</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary node-details-btn" data-id="${node.id}" title="View details">
                      <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger node-delete-btn" data-id="${node.id}" title="Delete node">
                      <i class="fas fa-trash"></i>
                    </button>
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
   * Get recent activity HTML
   * @returns {string} Recent activity HTML
   */
  getRecentActivityHTML() {
    return this.app.ui.createCard('Recent Activity', `
      <div class="alert alert-info mb-0">
        <i class="fas fa-info-circle me-2"></i> Activity logging will be available once you add and interact with Proxmox nodes.
      </div>
    `, 'history');
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Toggle advanced options
    const showMoreBtn = document.getElementById('show-more-btn');
    const advancedOptions = document.getElementById('advanced-options');
    
    if (showMoreBtn && advancedOptions) {
      showMoreBtn.addEventListener('click', () => {
        const isHidden = advancedOptions.style.display === 'none';
        advancedOptions.style.display = isHidden ? 'block' : 'none';
        showMoreBtn.textContent = isHidden ? 'Less Options' : 'More Options';
      });
    }
    
    // Test connection button
    const testConnectionBtn = document.getElementById('test-connection-btn');
    if (testConnectionBtn) {
      testConnectionBtn.addEventListener('click', () => {
        this.testConnection();
      });
    }
    
    // Add node form
    const addNodeForm = document.getElementById('add-node-form');
    if (addNodeForm) {
      addNodeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.addNode();
      });
    }
    
    // Node details buttons
    const nodeDetailsBtns = document.querySelectorAll('.node-details-btn');
    nodeDetailsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.dataset.id;
        this.app.router.navigate('node-details', { id: nodeId });
      });
    });
    
    // Node delete buttons
    const nodeDeleteBtns = document.querySelectorAll('.node-delete-btn');
    nodeDeleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.dataset.id;
        this.deleteNode(nodeId);
      });
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.app.loadAppData().then(() => {
          this.render();
          this.app.ui.showSuccess('Data refreshed successfully');
        });
      });
    }
  }
  
  /**
   * Test connection to a node
   */
  async testConnection() {
    const hostname = document.getElementById('node-hostname').value;
    const port = document.getElementById('node-port').value;
    const username = document.getElementById('api-username').value;
    const password = document.getElementById('api-password').value;
    const verifySSL = document.getElementById('verify-ssl').checked;
    const resultsContainer = document.getElementById('connection-test-results');
    
    // Validate input
    if (!hostname || !port || !username || !password) {
      this.app.ui.showError('Please fill in all required fields');
      return;
    }
    
    // Show loading state
    resultsContainer.style.display = 'block';
    resultsContainer.innerHTML = `
      <div class="alert alert-info">
        <div class="spinner-border spinner-border-sm me-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        Testing connection to ${hostname}:${port}...
      </div>
    `;
    
    // Test connection
    try {
      const connectionData = {
        host: hostname,
        port,
        username,
        password,
        realm: 'pam',
        ssl: true,
        verify: verifySSL
      };
      
      const result = await this.app.api.testConnection(connectionData);
      
      if (result.success) {
        resultsContainer.innerHTML = `
          <div class="alert alert-success">
            <i class="fas fa-check-circle me-2"></i> Connection successful! 
            ${result.data ? `<div class="mt-2 small">Proxmox version: ${result.data.data?.version || 'Unknown'}</div>` : ''}
          </div>
        `;
      } else {
        resultsContainer.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-times-circle me-2"></i> Connection failed: ${result.message || 'Unknown error'}
          </div>
        `;
      }
    } catch (error) {
      resultsContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-times-circle me-2"></i> Connection failed: ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }
  
  /**
   * Add a new node
   */
  async addNode() {
    // Get form values
    const name = document.getElementById('node-name').value;
    const hostname = document.getElementById('node-hostname').value;
    const port = document.getElementById('node-port').value;
    const apiUsername = document.getElementById('api-username').value;
    const apiPassword = document.getElementById('api-password').value;
    const sshUsername = document.getElementById('ssh-username').value;
    const sshPassword = document.getElementById('ssh-password').value;
    const verifySSL = document.getElementById('verify-ssl').checked;
    
    // Validate input
    if (!name || !hostname || !port || !apiUsername || !apiPassword) {
      this.app.ui.showError('Please fill in all required fields');
      return;
    }
    
    // Show loading state
    this.app.ui.showLoading('Adding node...');
    
    // Add node
    try {
      const nodeData = {
        name,
        api_host: hostname,
        api_port: port,
        api_username: apiUsername,
        api_password: apiPassword,
        api_realm: 'pam',
        ssh_host: hostname,
        ssh_port: 22,
        ssh_username: sshUsername || apiUsername,
        ssh_password: sshPassword || apiPassword,
        use_ssl: true,
        verify_ssl: verifySSL
      };
      
      await this.app.api.addNode(nodeData);
      
      // Reload data
      await this.app.loadAppData();
      
      // Hide loading state
      this.app.ui.hideLoading();
      
      // Show success message
      this.app.ui.showSuccess('Node added successfully');
      
      // Re-render view
      this.render();
    } catch (error) {
      // Hide loading state
      this.app.ui.hideLoading();
      
      // Show error message
      this.app.ui.showError('Failed to add node: ' + (error.message || 'Unknown error'));
    }
  }
  
  /**
   * Delete a node
   * @param {number} nodeId - Node ID
   */
  async deleteNode(nodeId) {
    // Ask for confirmation
    if (!confirm('Are you sure you want to delete this node?')) {
      return;
    }
    
    // Show loading state
    this.app.ui.showLoading('Deleting node...');
    
    // Delete node
    try {
      await this.app.api.deleteNode(nodeId);
      
      // Reload data
      await this.app.loadAppData();
      
      // Hide loading state
      this.app.ui.hideLoading();
      
      // Show success message
      this.app.ui.showSuccess('Node deleted successfully');
      
      // Re-render view
      this.render();
    } catch (error) {
      // Hide loading state
      this.app.ui.hideLoading();
      
      // Show error message
      this.app.ui.showError('Failed to delete node: ' + (error.message || 'Unknown error'));
    }
  }
}