/**
 * Nodes View Component
 * Renders the nodes overview and management interface
 */

const NodesView = {
  /**
   * Render the nodes view
   * @param {HTMLElement} container - The container element
   * @param {Object} params - View parameters including nodes and auth
   */
  render(container, params = {}) {
    const { nodes = [], auth } = params;
    
    // Create dashboard container
    const dashboardContainer = createElement('div', { className: 'dashboard-container' });
    
    // Add sidebar
    dashboardContainer.appendChild(DashboardView.renderSidebar(auth));
    
    // Create main content element
    const mainContent = createElement('div', { className: 'main-content' });
    
    // Add grid background
    mainContent.appendChild(createElement('div', { className: 'grid-bg' }));
    
    // Add nodes content
    mainContent.innerHTML += this.renderNodesContent(nodes);
    
    // Add main content to dashboard container
    dashboardContainer.appendChild(mainContent);
    
    // Add the dashboard container to the main container
    container.appendChild(dashboardContainer);
    
    // Load nodes if not already loaded
    if (nodes.length === 0) {
      this.loadNodesData();
    }
    
    // Set up event listeners
    this.setupEventListeners();
  },
  
  /**
   * Render nodes content
   * @param {Array} nodes - The list of nodes
   * @returns {string} HTML string for nodes content
   */
  renderNodesContent(nodes) {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-server me-3"></i> NODES OVERVIEW</h1>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#add-node-modal">
          <i class="fas fa-plus me-2"></i> Add Node
        </button>
      </div>
      
      <!-- Nodes Table -->
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-server me-2"></i> Proxmox Nodes</h5>
          <button class="btn btn-sm btn-outline-primary" id="refresh-nodes-btn">
            <i class="fas fa-sync"></i>
          </button>
        </div>
        <div class="card-body">
          ${nodes.length === 0 ? `
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i> No nodes have been added yet. Add your first Proxmox node to get started.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>API Host</th>
                    <th>API Port</th>
                    <th>SSH Host</th>
                    <th>SSH Port</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="nodes-table-body">
                  ${nodes.map(node => `
                    <tr>
                      <td>${node.name}</td>
                      <td>${node.api_host}</td>
                      <td>${node.api_port}</td>
                      <td>${node.ssh_host || '-'}</td>
                      <td>${node.ssh_port || '-'}</td>
                      <td id="node-status-${node.id}">
                        <div class="spinner-border spinner-border-sm text-primary" role="status">
                          <span class="visually-hidden">Loading...</span>
                        </div>
                      </td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-primary" data-action="select-node" data-node-id="${node.id}">
                            <i class="fas fa-check"></i>
                          </button>
                          <button class="btn btn-outline-danger" data-action="delete-node" data-node-id="${node.id}">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
      
      <!-- Add Node Modal -->
      <div class="modal fade" id="add-node-modal" tabindex="-1" aria-labelledby="add-node-modal-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="add-node-modal-label">Add Proxmox Node</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="add-node-form">
                <!-- Node Information -->
                <div class="mb-4">
                  <h6 class="fw-bold mb-3">Node Information</h6>
                  <div class="mb-3">
                    <label for="node-name" class="form-label">Node Name</label>
                    <input type="text" class="form-control" id="node-name" placeholder="e.g., pve-node1" required>
                    <div class="form-text">A friendly name to identify this node</div>
                  </div>
                </div>
                
                <!-- API Connection -->
                <div class="mb-4">
                  <h6 class="fw-bold mb-3">API Connection</h6>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="api-host" class="form-label">API Host</label>
                      <input type="text" class="form-control" id="api-host" placeholder="e.g., pve.example.com" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="api-port" class="form-label">API Port</label>
                      <input type="number" class="form-control" id="api-port" placeholder="8006" value="8006">
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="api-username" class="form-label">API Username</label>
                      <input type="text" class="form-control" id="api-username" placeholder="e.g., root" required>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="api-password" class="form-label">API Password</label>
                      <input type="password" class="form-control" id="api-password" required>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="api-realm" class="form-label">API Realm</label>
                      <input type="text" class="form-control" id="api-realm" placeholder="pam" value="pam">
                      <div class="form-text">Usually 'pam' for Linux authentication</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <div class="form-check mt-4">
                        <input class="form-check-input" type="checkbox" id="use-ssl" checked>
                        <label class="form-check-label" for="use-ssl">
                          Use SSL
                        </label>
                      </div>
                      <div class="form-check">
                        <input class="form-check-input" type="checkbox" id="verify-ssl">
                        <label class="form-check-label" for="verify-ssl">
                          Verify SSL Certificate
                        </label>
                      </div>
                    </div>
                  </div>
                  <div class="mt-3">
                    <button type="button" class="btn btn-outline-primary" data-action="test-connection">
                      <i class="fas fa-plug me-2"></i> Test Connection
                    </button>
                    <div id="connection-status" class="mt-2"></div>
                    <div id="api-version-info"></div>
                  </div>
                </div>
                
                <!-- SSH Connection (Optional) -->
                <div class="mb-4">
                  <h6 class="fw-bold mb-3">SSH Connection (Optional)</h6>
                  <p class="text-muted small mb-3">SSH connection is used for advanced operations that require direct access to the node.</p>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="ssh-host" class="form-label">SSH Host</label>
                      <input type="text" class="form-control" id="ssh-host" placeholder="e.g., pve.example.com">
                      <div class="form-text">If left empty, API host will be used</div>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="ssh-port" class="form-label">SSH Port</label>
                      <input type="number" class="form-control" id="ssh-port" placeholder="22" value="22">
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label for="ssh-username" class="form-label">SSH Username</label>
                      <input type="text" class="form-control" id="ssh-username" placeholder="e.g., root">
                    </div>
                    <div class="col-md-6 mb-3">
                      <label for="ssh-password" class="form-label">SSH Password</label>
                      <input type="password" class="form-control" id="ssh-password">
                    </div>
                  </div>
                  <div class="mt-3">
                    <button type="button" class="btn btn-outline-primary" data-action="test-ssh">
                      <i class="fas fa-terminal me-2"></i> Test SSH Connection
                    </button>
                    <div id="ssh-status" class="mt-2"></div>
                  </div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" data-action="add-node">
                <i class="fas fa-plus me-2"></i> Add Node
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Node Confirmation Modal -->
      <div class="modal fade" id="delete-node-modal" tabindex="-1" aria-labelledby="delete-node-modal-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="delete-node-modal-label">Confirm Deletion</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <p>Are you sure you want to delete this node?</p>
              <p class="text-danger">This will remove the node from the manager, but will not affect the Proxmox server itself.</p>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger" id="confirm-delete-node">
                <i class="fas fa-trash me-2"></i> Delete Node
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Set up event listeners for the nodes view
   */
  setupEventListeners() {
    // Refresh nodes button
    const refreshButton = document.getElementById('refresh-nodes-btn');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.loadNodesData();
        showNotification('Refreshing nodes...', 'info');
      });
    }
    
    // Node deletion handling
    const deleteNodeButtons = document.querySelectorAll('[data-action="delete-node"]');
    deleteNodeButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const nodeId = Number(event.currentTarget.dataset.nodeId);
        this.showDeleteNodeModal(nodeId);
      });
    });
    
    // Test SSH connection button
    const testSSHButton = document.querySelector('[data-action="test-ssh"]');
    if (testSSHButton) {
      testSSHButton.addEventListener('click', this.handleTestSSH.bind(this));
    }
    
    // Handle auto-fill for SSH host
    const apiHostInput = document.getElementById('api-host');
    const sshHostInput = document.getElementById('ssh-host');
    if (apiHostInput && sshHostInput) {
      apiHostInput.addEventListener('blur', () => {
        if (!sshHostInput.value && apiHostInput.value) {
          sshHostInput.value = apiHostInput.value;
        }
      });
    }
  },
  
  /**
   * Show the delete node confirmation modal
   * @param {number} nodeId - The ID of the node to delete
   */
  showDeleteNodeModal(nodeId) {
    // Get the modal element
    const modal = document.getElementById('delete-node-modal');
    if (!modal) return;
    
    // Get the confirm button
    const confirmButton = document.getElementById('confirm-delete-node');
    if (!confirmButton) return;
    
    // Set up the confirm button to delete the node
    confirmButton.onclick = async () => {
      try {
        await this.deleteNode(nodeId);
        
        // Close the modal
        const bsModal = bootstrap.Modal.getInstance(modal);
        if (bsModal) {
          bsModal.hide();
        }
      } catch (error) {
        console.error('Error deleting node:', error);
      }
    };
    
    // Show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  },
  
  /**
   * Delete a node
   * @param {number} nodeId - The ID of the node to delete
   */
  async deleteNode(nodeId) {
    try {
      await api.deleteNode(nodeId);
      
      // Show notification
      showNotification('Node deleted successfully', 'success');
      
      // Reload nodes
      await this.loadNodesData();
    } catch (error) {
      showNotification(error.message || 'Failed to delete node', 'danger');
    }
  },
  
  /**
   * Handle testing an SSH connection
   */
  async handleTestSSH() {
    try {
      // Get form data
      const hostInput = document.getElementById('ssh-host') || document.getElementById('api-host');
      const portInput = document.getElementById('ssh-port');
      const usernameInput = document.getElementById('ssh-username');
      const passwordInput = document.getElementById('ssh-password');
      
      if (!hostInput || !usernameInput || !passwordInput) {
        showNotification('SSH form fields not found', 'danger');
        return;
      }
      
      // Create SSH data object
      const sshData = {
        host: hostInput.value.trim(),
        port: portInput?.value ? parseInt(portInput.value, 10) : 22,
        username: usernameInput.value.trim(),
        password: passwordInput.value
      };
      
      // Validate required fields
      if (!sshData.host || !sshData.username || !sshData.password) {
        showNotification('Please fill all required SSH fields', 'warning');
        return;
      }
      
      // Show loading state
      const testButton = document.querySelector('[data-action="test-ssh"]');
      if (testButton) {
        testButton.disabled = true;
        testButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Testing...';
      }
      
      // Test the connection
      const result = await api.testSSH(sshData);
      
      // Reset button state
      if (testButton) {
        testButton.disabled = false;
        testButton.innerHTML = '<i class="fas fa-terminal me-2"></i> Test SSH Connection';
      }
      
      // Display result
      showNotification(result.message, result.success ? 'success' : 'danger');
      
      // Update SSH status if element exists
      const statusElement = document.getElementById('ssh-status');
      if (statusElement) {
        statusElement.innerHTML = result.success
          ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> SSH Connection Successful</span>'
          : '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> SSH Connection Failed</span>';
      }
      
      // Display output if available
      if (result.success && result.data) {
        const outputElement = document.createElement('div');
        outputElement.className = 'alert alert-info mt-3';
        outputElement.innerHTML = `
          <h6 class="alert-heading">SSH Output:</h6>
          <pre class="mb-0">${result.data.output}</pre>
        `;
        
        const statusElement = document.getElementById('ssh-status');
        if (statusElement) {
          statusElement.appendChild(outputElement);
        }
      }
    } catch (error) {
      showNotification(error.message || 'SSH connection test failed', 'danger');
      
      // Reset button state
      const testButton = document.querySelector('[data-action="test-ssh"]');
      if (testButton) {
        testButton.disabled = false;
        testButton.innerHTML = '<i class="fas fa-terminal me-2"></i> Test SSH Connection';
      }
      
      // Update SSH status if element exists
      const statusElement = document.getElementById('ssh-status');
      if (statusElement) {
        statusElement.innerHTML = '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> SSH Connection Failed</span>';
      }
    }
  },
  
  /**
   * Load nodes data
   */
  async loadNodesData() {
    try {
      // This uses the global App object to load nodes
      await App.loadNodes();
      
      // Refresh the view
      App.navigateTo(VIEWS.NODES);
    } catch (error) {
      console.error('Error loading nodes data:', error);
      showNotification('Failed to load nodes data', 'danger');
    }
  }
};