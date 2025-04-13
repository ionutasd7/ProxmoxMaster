/**
 * Containers View
 * Displays a list of all LXC containers across all nodes
 */
export class ContainersView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the containers view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes, containers } = this.app.state.getState();
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('LXC Containers', 'box')}
      
      <!-- Container Management -->
      ${this.getContainerManagementHTML(nodes)}
      
      <!-- Containers List -->
      ${this.getContainersListHTML(containers, nodes)}
    `;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Render container details
   * @param {number} containerId - Container ID
   */
  renderDetails(containerId) {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Set content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Container Details', 'box')}
      
      <div class="alert alert-info mb-4">
        <i class="fas fa-info-circle me-2"></i> Container details functionality is under development.
      </div>
      
      <div class="text-center">
        <button class="btn btn-primary" id="back-to-containers-btn">
          <i class="fas fa-arrow-left me-2"></i> Back to Containers
        </button>
      </div>
    `;
    
    // Add back button listener
    document.getElementById('back-to-containers-btn').addEventListener('click', () => {
      this.app.router.navigate('containers');
    });
  }
  
  /**
   * Get container management HTML
   * @param {Array} nodes - Nodes
   * @returns {string} Container management HTML
   */
  getContainerManagementHTML(nodes) {
    return this.app.ui.createCard('Container Management', `
      <div class="row mb-4">
        <div class="col-md-8">
          <h5 class="mb-3">Quick Actions</h5>
          <div class="btn-group">
            <button class="btn btn-outline-primary" id="create-container-btn">
              <i class="fas fa-plus me-1"></i> Create Container
            </button>
            <button class="btn btn-outline-primary" id="templates-btn">
              <i class="fas fa-clone me-1"></i> Templates
            </button>
            <button class="btn btn-outline-primary" id="batch-actions-btn">
              <i class="fas fa-tasks me-1"></i> Batch Actions
            </button>
          </div>
        </div>
        <div class="col-md-4">
          <h5 class="mb-3">Filter by Node</h5>
          <select class="form-control" id="node-filter">
            <option value="all">All Nodes</option>
            ${nodes.map(node => `<option value="${node.id}">${node.name}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <div class="mb-3">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary">
                <i class="fas fa-search text-muted"></i>
              </span>
              <input type="text" class="form-control" id="container-search" placeholder="Search containers...">
            </div>
          </div>
        </div>
      </div>
    `, 'cogs');
  }
  
  /**
   * Get containers list HTML
   * @param {Array} containers - Containers
   * @param {Array} nodes - Nodes
   * @returns {string} Containers list HTML
   */
  getContainersListHTML(containers, nodes) {
    // Create a node name lookup
    const nodeMap = {};
    nodes.forEach(node => {
      nodeMap[node.id] = node.name;
    });
    
    if (containers.length === 0) {
      return this.app.ui.createCard('No Containers Found', `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i> No LXC containers have been found on any node.
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-primary" id="create-first-container-btn">
            <i class="fas fa-plus me-2"></i> Create Your First Container
          </button>
        </div>
      `, 'box');
    }
    
    return this.app.ui.createCard('LXC Containers', `
      <div class="table-responsive">
        <table class="custom-table" id="containers-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Node</th>
              <th>Status</th>
              <th>Memory</th>
              <th>CPU</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${containers.map(container => `
              <tr data-container-id="${container.vmid}" data-node-id="${container.node || ''}">
                <td>${container.vmid}</td>
                <td>${container.name || `Container ${container.vmid}`}</td>
                <td>${container.node ? (nodeMap[container.node] || container.node) : 'Unknown'}</td>
                <td>${this.app.ui.getStatusBadge(container.status || 'Unknown')}</td>
                <td>${container.maxmem ? this.app.ui.formatBytes(container.maxmem) : 'Unknown'}</td>
                <td>${container.maxcpu || 'Unknown'} vCPU</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary container-details-btn" data-id="${container.vmid}" title="View details">
                      <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success container-start-btn ${container.status === 'running' ? 'disabled' : ''}" data-id="${container.vmid}" data-node="${container.node || ''}" title="Start Container">
                      <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning container-stop-btn ${container.status !== 'running' ? 'disabled' : ''}" data-id="${container.vmid}" data-node="${container.node || ''}" title="Stop Container">
                      <i class="fas fa-stop"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger container-delete-btn" data-id="${container.vmid}" data-node="${container.node || ''}" title="Delete Container">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `, 'box');
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Create container button
    const createContainerBtn = document.getElementById('create-container-btn');
    if (createContainerBtn) {
      createContainerBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Create container functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Create first container button
    const createFirstContainerBtn = document.getElementById('create-first-container-btn');
    if (createFirstContainerBtn) {
      createFirstContainerBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Create container functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Templates button
    const templatesBtn = document.getElementById('templates-btn');
    if (templatesBtn) {
      templatesBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Templates functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Batch actions button
    const batchActionsBtn = document.getElementById('batch-actions-btn');
    if (batchActionsBtn) {
      batchActionsBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Batch actions functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Node filter
    const nodeFilter = document.getElementById('node-filter');
    if (nodeFilter) {
      nodeFilter.addEventListener('change', () => {
        this.filterContainers();
      });
    }
    
    // Container search
    const containerSearch = document.getElementById('container-search');
    if (containerSearch) {
      containerSearch.addEventListener('input', () => {
        this.filterContainers();
      });
    }
    
    // Container details buttons
    const containerDetailsBtns = document.querySelectorAll('.container-details-btn');
    containerDetailsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        this.app.router.navigate('container-details', { id: containerId });
      });
    });
    
    // Container start buttons
    const containerStartBtns = document.querySelectorAll('.container-start-btn:not(.disabled)');
    containerStartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        const nodeId = btn.dataset.node;
        this.app.ui.showNotification('Start container functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // Container stop buttons
    const containerStopBtns = document.querySelectorAll('.container-stop-btn:not(.disabled)');
    containerStopBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        const nodeId = btn.dataset.node;
        this.app.ui.showNotification('Stop container functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // Container delete buttons
    const containerDeleteBtns = document.querySelectorAll('.container-delete-btn');
    containerDeleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        const nodeId = btn.dataset.node;
        this.app.ui.showNotification('Delete container functionality is under development.', 'info', 'Coming Soon');
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
   * Filter containers based on search and node filter
   */
  filterContainers() {
    const nodeFilter = document.getElementById('node-filter');
    const containerSearch = document.getElementById('container-search');
    const containersTable = document.getElementById('containers-table');
    
    if (!nodeFilter || !containerSearch || !containersTable) {
      return;
    }
    
    const nodeValue = nodeFilter.value;
    const searchValue = containerSearch.value.toLowerCase();
    
    // Get all container rows
    const rows = containersTable.querySelectorAll('tbody tr');
    
    // Filter rows
    rows.forEach(row => {
      const containerId = row.dataset.containerId;
      const nodeId = row.dataset.nodeId;
      const containerName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      
      // Check if row matches filters
      const matchesNode = nodeValue === 'all' || nodeId === nodeValue;
      const matchesSearch = !searchValue || containerId.includes(searchValue) || containerName.includes(searchValue);
      
      // Show/hide row
      row.style.display = matchesNode && matchesSearch ? '' : 'none';
    });
  }
}