/**
 * Nodes View
 * Displays node management, node list, and node details
 */
import { formatBytes, formatUptime, cpuToPercentage } from '../utils.js';

export class NodesView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the nodes view
   * @param {Object} params - Route parameters
   */
  render(params = {}) {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    // Set app container with sidebar and content
    appElement.innerHTML = this.getLayoutHTML();
    
    // Render nodes content
    this.renderNodesContent();
    
    // Add event listeners
    this.addEventListeners();
    
    // Set active navigation item
    this.setActiveNavItem('nodes');
  }
  
  /**
   * Render node details
   * @param {Object} params - Route parameters
   */
  renderDetails(params = {}) {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    // Set app container with sidebar and content
    appElement.innerHTML = this.getLayoutHTML();
    
    // Get node ID from params
    const nodeId = params.id;
    
    // Render node details content
    this.renderNodeDetailsContent(nodeId);
    
    // Add event listeners
    this.addEventListeners();
    
    // Set active navigation item
    this.setActiveNavItem('nodes');
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
            <!-- Nodes content will be rendered here -->
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render the nodes content
   */
  async renderNodesContent() {
    const contentElement = document.getElementById('main-content');
    if (!contentElement) return;
    
    // Show loading state
    contentElement.innerHTML = `<div class="text-center py-5"><div class="spinner-border" role="status"></div><p class="mt-2">Loading nodes...</p></div>`;
    
    try {
      // Fetch nodes
      await this.fetchNodes();
      
      // Get nodes from state
      const { nodes } = this.app.state.getState();
      
      // Render content
      contentElement.innerHTML = `
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <h2 class="mb-0">Nodes</h2>
          <div>
            <button id="refresh-btn" class="btn btn-outline-primary me-2">
              <i class="fas fa-sync-alt me-2"></i> Refresh
            </button>
            <button id="add-node-btn" class="btn btn-primary">
              <i class="fas fa-plus me-2"></i> Add Node
            </button>
          </div>
        </div>
        
        <!-- Nodes List -->
        <div class="custom-card">
          <div class="card-header">
            <h5><i class="fas fa-server me-2"></i> Proxmox Nodes</h5>
          </div>
          <div class="card-body">
            ${this.getNodesTableHTML(nodes)}
          </div>
        </div>
        
        <!-- Add Node Modal -->
        <div class="modal fade" id="add-node-modal" tabindex="-1" aria-hidden="true">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">Add Proxmox Node</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div class="modal-body">
                <form id="add-node-form">
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="node-name" class="form-label">Node Name</label>
                      <input type="text" class="form-control" id="node-name" placeholder="e.g., pve1" required>
                    </div>
                    <div class="col-md-6">
                      <label for="api-host" class="form-label">API Host</label>
                      <input type="text" class="form-control" id="api-host" placeholder="e.g., pve1.ionutlab.com" value="pve1.ionutlab.com" required>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="api-port" class="form-label">API Port</label>
                      <input type="number" class="form-control" id="api-port" value="8006" required>
                    </div>
                    <div class="col-md-6">
                      <label for="api-realm" class="form-label">Realm</label>
                      <input type="text" class="form-control" id="api-realm" value="pam" required>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="api-username" class="form-label">API Username</label>
                      <input type="text" class="form-control" id="api-username" value="root@pam" required>
                    </div>
                    <div class="col-md-6">
                      <label for="api-password" class="form-label">API Password</label>
                      <input type="password" class="form-control" id="api-password" value="Poolamea01@" required>
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="ssh-host" class="form-label">SSH Host (Optional)</label>
                      <input type="text" class="form-control" id="ssh-host" placeholder="Same as API host if empty">
                    </div>
                    <div class="col-md-6">
                      <label for="ssh-port" class="form-label">SSH Port</label>
                      <input type="number" class="form-control" id="ssh-port" value="22">
                    </div>
                  </div>
                  <div class="row mb-3">
                    <div class="col-md-6">
                      <label for="ssh-username" class="form-label">SSH Username (Optional)</label>
                      <input type="text" class="form-control" id="ssh-username" placeholder="root">
                    </div>
                    <div class="col-md-6">
                      <label for="ssh-password" class="form-label">SSH Password (Optional)</label>
                      <input type="password" class="form-control" id="ssh-password">
                    </div>
                  </div>
                  <div class="form-check mb-3">
                    <input class="form-check-input" type="checkbox" id="verify-ssl">
                    <label class="form-check-label" for="verify-ssl">
                      Verify SSL Certificate (disable for self-signed certificates)
                    </label>
                  </div>
                  
                  <div id="connection-test-result" class="alert alert-info d-none">
                    Testing connection...
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-info" id="test-connection-btn">Test Connection</button>
                <button type="button" class="btn btn-primary" id="save-node-btn">Add Node</button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Initialize modals
      const addNodeModal = new bootstrap.Modal(document.getElementById('add-node-modal'));
      
      // Add event listeners
      document.getElementById('add-node-btn').addEventListener('click', () => {
        addNodeModal.show();
      });
      
      document.getElementById('test-connection-btn').addEventListener('click', () => {
        this.testConnection();
      });
      
      document.getElementById('save-node-btn').addEventListener('click', () => {
        this.addNode(addNodeModal);
      });
      
      document.getElementById('refresh-btn').addEventListener('click', () => {
        this.renderNodesContent();
      });
      
    } catch (error) {
      console.error('Error rendering nodes content:', error);
      contentElement.innerHTML = `
        <div class="alert alert-danger mt-4">
          <h4 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i> Error</h4>
          <p>Failed to load nodes data: ${error.message || 'Unknown error'}</p>
          <hr>
          <button id="retry-btn" class="btn btn-danger">Retry</button>
        </div>
      `;
      
      // Add retry button event listener
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.renderNodesContent();
        });
      }
    }
  }
  
  /**
   * Render node details content
   * @param {string} nodeId - Node ID
   */
  async renderNodeDetailsContent(nodeId) {
    const contentElement = document.getElementById('main-content');
    if (!contentElement) return;
    
    // Show loading state
    contentElement.innerHTML = `<div class="text-center py-5"><div class="spinner-border" role="status"></div><p class="mt-2">Loading node details...</p></div>`;
    
    try {
      // Fetch node details
      const nodeDetails = await this.app.api.getNodeDetails(nodeId);
      
      // Render content
      contentElement.innerHTML = `
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <div>
            <button id="back-btn" class="btn btn-outline-secondary me-2">
              <i class="fas fa-arrow-left me-2"></i> Back to Nodes
            </button>
            <h2 class="d-inline-block mb-0 ms-2">${nodeDetails.name}</h2>
            <span class="ms-2">${this.app.ui.getStatusBadge(nodeDetails.status)}</span>
          </div>
          <div>
            <button id="refresh-btn" class="btn btn-outline-primary me-2">
              <i class="fas fa-sync-alt me-2"></i> Refresh
            </button>
            <button id="delete-node-btn" class="btn btn-danger">
              <i class="fas fa-trash me-2"></i> Delete Node
            </button>
          </div>
        </div>
        
        <!-- Node Details -->
        <div class="row g-4 mb-4">
          <div class="col-md-6">
            <div class="custom-card">
              <div class="card-header">
                <h5><i class="fas fa-info-circle me-2"></i> Node Information</h5>
              </div>
              <div class="card-body">
                <table class="table">
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <td>${nodeDetails.name}</td>
                    </tr>
                    <tr>
                      <th>API Host</th>
                      <td>${nodeDetails.api_host}</td>
                    </tr>
                    <tr>
                      <th>API Port</th>
                      <td>${nodeDetails.api_port}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>${this.app.ui.getStatusBadge(nodeDetails.status)}</td>
                    </tr>
                    <tr>
                      <th>Added on</th>
                      <td>${new Date(nodeDetails.created_at).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="custom-card">
              <div class="card-header">
                <h5><i class="fas fa-microchip me-2"></i> Resource Usage</h5>
              </div>
              <div class="card-body">
                <div class="mb-3">
                  <label class="form-label">CPU Usage</label>
                  <div class="progress">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: 25%"></div>
                  </div>
                  <div class="d-flex justify-content-between mt-1">
                    <small>0%</small>
                    <small>25%</small>
                    <small>100%</small>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Memory Usage</label>
                  <div class="progress">
                    <div class="progress-bar bg-info" role="progressbar" style="width: 45%"></div>
                  </div>
                  <div class="d-flex justify-content-between mt-1">
                    <small>0 GB</small>
                    <small>4.5 GB / 10 GB</small>
                    <small>10 GB</small>
                  </div>
                </div>
                
                <div>
                  <label class="form-label">Disk Usage</label>
                  <div class="progress">
                    <div class="progress-bar bg-warning" role="progressbar" style="width: 60%"></div>
                  </div>
                  <div class="d-flex justify-content-between mt-1">
                    <small>0 GB</small>
                    <small>120 GB / 200 GB</small>
                    <small>200 GB</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- VMs and Containers -->
        <div class="row g-4">
          <div class="col-md-6">
            <div class="custom-card">
              <div class="card-header">
                <h5><i class="fas fa-desktop me-2"></i> Virtual Machines</h5>
              </div>
              <div class="card-body">
                <div class="alert alert-info mb-0">
                  <i class="fas fa-info-circle me-2"></i> Click "Refresh" to load virtual machines on this node.
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="custom-card">
              <div class="card-header">
                <h5><i class="fas fa-box me-2"></i> Containers</h5>
              </div>
              <div class="card-body">
                <div class="alert alert-info mb-0">
                  <i class="fas fa-info-circle me-2"></i> Click "Refresh" to load containers on this node.
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners
      document.getElementById('back-btn').addEventListener('click', () => {
        this.app.router.navigate('nodes');
      });
      
      document.getElementById('refresh-btn').addEventListener('click', () => {
        this.renderNodeDetailsContent(nodeId);
      });
      
      document.getElementById('delete-node-btn').addEventListener('click', () => {
        this.deleteNode(nodeId);
      });
      
    } catch (error) {
      console.error('Error rendering node details:', error);
      contentElement.innerHTML = `
        <div class="alert alert-danger mt-4">
          <h4 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i> Error</h4>
          <p>Failed to load node details: ${error.message || 'Unknown error'}</p>
          <hr>
          <button id="back-btn" class="btn btn-outline-secondary me-2">
            <i class="fas fa-arrow-left me-2"></i> Back to Nodes
          </button>
          <button id="retry-btn" class="btn btn-danger">Retry</button>
        </div>
      `;
      
      // Add back button event listener
      const backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.app.router.navigate('nodes');
        });
      }
      
      // Add retry button event listener
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.renderNodeDetailsContent(nodeId);
        });
      }
    }
  }
  
  /**
   * Fetch nodes
   * @returns {Promise<Array>} Nodes
   */
  async fetchNodes() {
    try {
      const nodes = await this.app.api.getNodes();
      this.app.state.setNodes(nodes);
      return nodes;
    } catch (error) {
      console.error('Error fetching nodes:', error);
      throw error;
    }
  }
  
  /**
   * Get nodes table HTML
   * @param {Array} nodes - Nodes
   * @returns {string} HTML
   */
  getNodesTableHTML(nodes) {
    if (!nodes || nodes.length === 0) {
      return `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i> No nodes found. Click "Add Node" to add your first Proxmox node.
        </div>
      `;
    }
    
    return `
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>API Host</th>
              <th>API Port</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${nodes.map(node => `
              <tr>
                <td>${node.name}</td>
                <td>${node.api_host}</td>
                <td>${node.api_port}</td>
                <td>${this.app.ui.getStatusBadge(node.status)}</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-primary view-node-btn" data-id="${node.id}">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-node-btn" data-id="${node.id}">
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
   * Test connection to a Proxmox API
   */
  async testConnection() {
    // Get form data
    const apiHost = document.getElementById('api-host').value;
    const apiPort = document.getElementById('api-port').value;
    const apiUsername = document.getElementById('api-username').value;
    const apiPassword = document.getElementById('api-password').value;
    const apiRealm = document.getElementById('api-realm').value;
    const verifySSL = document.getElementById('verify-ssl').checked;
    
    // Show loading state
    const resultElement = document.getElementById('connection-test-result');
    resultElement.classList.remove('d-none', 'alert-success', 'alert-danger');
    resultElement.classList.add('alert-info');
    resultElement.innerHTML = '<div class="spinner-border spinner-border-sm me-2" role="status"></div> Testing connection...';
    
    try {
      // Test connection
      const result = await this.app.api.testConnection({
        api_host: apiHost,
        api_port: apiPort,
        api_username: apiUsername,
        api_password: apiPassword,
        api_realm: apiRealm,
        verify_ssl: verifySSL
      });
      
      // Show success
      resultElement.classList.remove('alert-info', 'alert-danger');
      resultElement.classList.add('alert-success');
      resultElement.innerHTML = `
        <i class="fas fa-check-circle me-2"></i> Connection successful.
        <div class="mt-2">
          <strong>Version:</strong> ${result.version.version} (${result.version.release})
          <br>
          <strong>Nodes:</strong> ${result.nodes.length} (${result.nodes.map(n => n.node).join(', ')})
        </div>
      `;
    } catch (error) {
      // Show error
      resultElement.classList.remove('alert-info', 'alert-success');
      resultElement.classList.add('alert-danger');
      resultElement.innerHTML = `
        <i class="fas fa-times-circle me-2"></i> Connection failed: ${error.message || 'Unknown error'}
      `;
    }
  }
  
  /**
   * Add a new node
   * @param {bootstrap.Modal} modal - Bootstrap modal
   */
  async addNode(modal) {
    // Get form data
    const name = document.getElementById('node-name').value;
    const apiHost = document.getElementById('api-host').value;
    const apiPort = document.getElementById('api-port').value;
    const apiUsername = document.getElementById('api-username').value;
    const apiPassword = document.getElementById('api-password').value;
    const apiRealm = document.getElementById('api-realm').value;
    const sshHost = document.getElementById('ssh-host').value;
    const sshPort = document.getElementById('ssh-port').value;
    const sshUsername = document.getElementById('ssh-username').value;
    const sshPassword = document.getElementById('ssh-password').value;
    const verifySSL = document.getElementById('verify-ssl').checked;
    
    // Validate required fields
    if (!name || !apiHost || !apiPort || !apiUsername || !apiPassword) {
      this.app.ui.showError('Please fill in all required fields');
      return;
    }
    
    // Show loading
    this.app.ui.showLoading('Adding node...');
    
    try {
      // Add node
      const node = await this.app.api.addNode({
        name,
        api_host: apiHost,
        api_port: apiPort,
        api_username: apiUsername,
        api_password: apiPassword,
        api_realm: apiRealm,
        ssh_host: sshHost || apiHost,
        ssh_port: sshPort || 22,
        ssh_username: sshUsername || '',
        ssh_password: sshPassword || '',
        verify_ssl: verifySSL,
        use_ssl: true
      });
      
      // Hide modal
      modal.hide();
      
      // Refresh nodes
      await this.fetchNodes();
      
      // Re-render content
      this.renderNodesContent();
      
      // Show success
      this.app.ui.showSuccess(`Node ${name} added successfully`);
    } catch (error) {
      console.error('Error adding node:', error);
      this.app.ui.showError(`Failed to add node: ${error.message || 'Unknown error'}`);
    } finally {
      this.app.ui.hideLoading();
    }
  }
  
  /**
   * Delete a node
   * @param {string} nodeId - Node ID
   */
  async deleteNode(nodeId) {
    // Confirm deletion
    const confirmed = await this.app.ui.confirm(
      'Delete Node',
      'Are you sure you want to delete this node? This will only remove it from the manager, not from your Proxmox cluster.',
      'Delete',
      'Cancel'
    );
    
    if (!confirmed) return;
    
    // Show loading
    this.app.ui.showLoading('Deleting node...');
    
    try {
      // Delete node
      await this.app.api.deleteNode(nodeId);
      
      // Refresh nodes
      await this.fetchNodes();
      
      // Navigate back to nodes list
      this.app.router.navigate('nodes');
      
      // Show success
      this.app.ui.showSuccess('Node deleted successfully');
    } catch (error) {
      console.error('Error deleting node:', error);
      this.app.ui.showError(`Failed to delete node: ${error.message || 'Unknown error'}`);
    } finally {
      this.app.ui.hideLoading();
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
    
    // View node buttons
    const viewNodeBtns = document.querySelectorAll('.view-node-btn');
    viewNodeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.getAttribute('data-id');
        this.app.router.navigate('node-details', { id: nodeId });
      });
    });
    
    // Delete node buttons
    const deleteNodeBtns = document.querySelectorAll('.delete-node-btn');
    deleteNodeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.getAttribute('data-id');
        this.deleteNode(nodeId);
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