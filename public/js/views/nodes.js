/**
 * Nodes View
 * Displays a list of all Proxmox nodes and node details
 */
export class NodesView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the nodes view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes } = this.app.state.getState();
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Nodes Overview', 'server')}
      
      <!-- Nodes Overview -->
      ${this.getNodesOverviewHTML(nodes)}
    `;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Render node details
   * @param {number} nodeId - Node ID
   */
  async renderDetails(nodeId) {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Set loading content
    mainContent.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
        <div class="spinner-border text-primary me-3" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span>Loading node details...</span>
      </div>
    `;
    
    try {
      // Get node details
      const nodeDetails = await this.app.api.getNodeDetails(nodeId);
      
      // Set main content
      mainContent.innerHTML = `
        ${this.app.ui.createPageHeader('Node Details', 'server')}
        
        <!-- Node Details -->
        ${this.getNodeDetailsHTML(nodeDetails)}
        
        <!-- Resource Usage -->
        ${this.getResourceUsageHTML(nodeDetails)}
        
        <!-- VMs and Containers -->
        ${this.getVMsContainersHTML(nodeDetails)}
      `;
      
      // Add event listeners
      this.addDetailsEventListeners(nodeDetails);
      
      // Initialize charts
      this.initializeCharts(nodeDetails);
    } catch (error) {
      // Show error
      mainContent.innerHTML = `
        <div class="alert alert-danger m-3">
          <i class="fas fa-exclamation-triangle me-2"></i> 
          Failed to load node details: ${error.message || 'Unknown error'}
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-primary" id="back-to-nodes-btn">
            <i class="fas fa-arrow-left me-2"></i> Back to Nodes
          </button>
        </div>
      `;
      
      // Add back button listener
      document.getElementById('back-to-nodes-btn').addEventListener('click', () => {
        this.app.router.navigate('nodes');
      });
    }
  }
  
  /**
   * Get nodes overview HTML
   * @param {Array} nodes - Nodes
   * @returns {string} Nodes overview HTML
   */
  getNodesOverviewHTML(nodes) {
    if (nodes.length === 0) {
      return this.app.ui.createCard('No Nodes Found', `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i> No Proxmox nodes have been added yet. Add nodes from the Dashboard.
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-primary" id="go-to-dashboard-btn">
            <i class="fas fa-tachometer-alt me-2"></i> Go to Dashboard
          </button>
        </div>
      `, 'exclamation-triangle');
    }
    
    return `
      <div class="row">
        ${nodes.map(node => this.getNodeCardHTML(node)).join('')}
      </div>
    `;
  }
  
  /**
   * Get node card HTML
   * @param {Object} node - Node
   * @returns {string} Node card HTML
   */
  getNodeCardHTML(node) {
    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="custom-card h-100">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span><i class="fas fa-server me-2"></i> ${node.name}</span>
            <span>${this.app.ui.getStatusBadge(node.status || 'Unknown')}</span>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <div class="text-muted mb-1 small">Hostname/IP:</div>
              <div>${node.api_host || node.hostname}</div>
            </div>
            <div class="mb-3">
              <div class="text-muted mb-1 small">API Port:</div>
              <div>${node.api_port || node.port || 8006}</div>
            </div>
            <div class="mb-3">
              <div class="text-muted mb-1 small">Username:</div>
              <div>${node.api_username || node.username}</div>
            </div>
            <div class="mb-3">
              <div class="text-muted mb-1 small">Added:</div>
              <div>${node.created_at ? this.app.ui.formatDate(node.created_at) : 'Unknown'}</div>
            </div>
            <div class="d-grid gap-2 mt-4">
              <button class="btn btn-primary node-details-btn" data-id="${node.id}">
                View Details
              </button>
              <button class="btn btn-outline-danger node-delete-btn" data-id="${node.id}">
                Delete Node
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get node details HTML
   * @param {Object} nodeDetails - Node details
   * @returns {string} Node details HTML
   */
  getNodeDetailsHTML(nodeDetails) {
    const { node, status, cluster, error } = nodeDetails;
    
    // Basic node info
    let detailsHTML = this.app.ui.createCard('Node Information', `
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <div class="text-muted mb-1 small">Name:</div>
            <div>${node.name}</div>
          </div>
          <div class="mb-3">
            <div class="text-muted mb-1 small">Hostname/IP:</div>
            <div>${node.api_host || node.hostname}</div>
          </div>
          <div class="mb-3">
            <div class="text-muted mb-1 small">API Port:</div>
            <div>${node.api_port || node.port || 8006}</div>
          </div>
          <div class="mb-3">
            <div class="text-muted mb-1 small">Username:</div>
            <div>${node.api_username || node.username}</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <div class="text-muted mb-1 small">Status:</div>
            <div>${this.app.ui.getStatusBadge(status?.status || 'Unknown')}</div>
          </div>
          <div class="mb-3">
            <div class="text-muted mb-1 small">Uptime:</div>
            <div>${status?.uptime ? this.formatUptime(status.uptime) : 'Unknown'}</div>
          </div>
          <div class="mb-3">
            <div class="text-muted mb-1 small">Proxmox Version:</div>
            <div>${status?.pveversion || 'Unknown'}</div>
          </div>
          <div class="mb-3">
            <div class="text-muted mb-1 small">Added:</div>
            <div>${node.created_at ? this.app.ui.formatDate(node.created_at) : 'Unknown'}</div>
          </div>
        </div>
      </div>
      
      ${error ? `
        <div class="alert alert-warning mt-3">
          <i class="fas fa-exclamation-triangle me-2"></i> 
          Could not retrieve real-time data from Proxmox API: ${error}
        </div>
      ` : ''}
      
      <div class="d-flex justify-content-end mt-3">
        <button class="btn btn-primary me-2" id="refresh-node-btn">
          <i class="fas fa-sync me-1"></i> Refresh
        </button>
        <button class="btn btn-outline-primary me-2" id="back-to-nodes-btn">
          <i class="fas fa-arrow-left me-1"></i> Back
        </button>
        <button class="btn btn-outline-danger" id="delete-node-btn" data-id="${node.id}">
          <i class="fas fa-trash me-1"></i> Delete
        </button>
      </div>
    `, 'server');
    
    return detailsHTML;
  }
  
  /**
   * Get resource usage HTML
   * @param {Object} nodeDetails - Node details
   * @returns {string} Resource usage HTML
   */
  getResourceUsageHTML(nodeDetails) {
    const { status, error } = nodeDetails;
    
    if (error || !status) {
      return '';
    }
    
    // Calculate usage percentages
    const cpuUsage = status.cpu ? Math.round(status.cpu * 100) : 0;
    const memUsage = status.memory && status.memory.total ? 
      Math.round((status.memory.used / status.memory.total) * 100) : 0;
    const diskUsage = status.rootfs && status.rootfs.total ? 
      Math.round((status.rootfs.used / status.rootfs.total) * 100) : 0;
    
    return this.app.ui.createCard('Resource Usage', `
      <div class="row">
        <div class="col-md-4">
          <h5 class="text-center mb-3">CPU Usage</h5>
          <div class="chart-container" style="height: 200px;">
            <canvas id="cpu-chart"></canvas>
          </div>
          <div class="text-center mt-3">
            <h3>${cpuUsage}%</h3>
            <div class="text-muted">
              ${status.cpuinfo?.cpus || 'Unknown'} CPUs, ${status.cpuinfo?.sockets || 'Unknown'} Socket(s)
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <h5 class="text-center mb-3">Memory Usage</h5>
          <div class="chart-container" style="height: 200px;">
            <canvas id="memory-chart"></canvas>
          </div>
          <div class="text-center mt-3">
            <h3>${memUsage}%</h3>
            <div class="text-muted">
              ${status.memory ? this.app.ui.formatBytes(status.memory.used) : '0'} / 
              ${status.memory ? this.app.ui.formatBytes(status.memory.total) : '0'}
            </div>
          </div>
        </div>
        
        <div class="col-md-4">
          <h5 class="text-center mb-3">Disk Usage</h5>
          <div class="chart-container" style="height: 200px;">
            <canvas id="disk-chart"></canvas>
          </div>
          <div class="text-center mt-3">
            <h3>${diskUsage}%</h3>
            <div class="text-muted">
              ${status.rootfs ? this.app.ui.formatBytes(status.rootfs.used) : '0'} / 
              ${status.rootfs ? this.app.ui.formatBytes(status.rootfs.total) : '0'}
            </div>
          </div>
        </div>
      </div>
    `, 'chart-line');
  }
  
  /**
   * Get VMs and containers HTML
   * @param {Object} nodeDetails - Node details
   * @returns {string} VMs and containers HTML
   */
  getVMsContainersHTML(nodeDetails) {
    const { node, error } = nodeDetails;
    
    return this.app.ui.createCard('VMs & Containers', `
      <ul class="nav nav-tabs" id="resourceTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="vms-tab" data-bs-toggle="tab" data-bs-target="#vms-tab-pane" type="button" role="tab">
            <i class="fas fa-desktop me-2"></i> Virtual Machines
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="containers-tab" data-bs-toggle="tab" data-bs-target="#containers-tab-pane" type="button" role="tab">
            <i class="fas fa-box me-2"></i> Containers
          </button>
        </li>
      </ul>
      
      <div class="tab-content p-3" id="resourceTabsContent">
        <div class="tab-pane fade show active" id="vms-tab-pane" role="tabpanel" tabindex="0">
          <div class="text-end mb-3">
            <button class="btn btn-primary btn-sm" id="refresh-vms-btn">
              <i class="fas fa-sync me-1"></i> Refresh VMs
            </button>
            <button class="btn btn-outline-primary btn-sm ms-2" id="create-vm-btn">
              <i class="fas fa-plus me-1"></i> Create VM
            </button>
          </div>
          
          <div id="vms-container">
            <div class="d-flex justify-content-center">
              <div class="spinner-border text-primary me-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <span>Loading VMs...</span>
            </div>
          </div>
        </div>
        
        <div class="tab-pane fade" id="containers-tab-pane" role="tabpanel" tabindex="0">
          <div class="text-end mb-3">
            <button class="btn btn-primary btn-sm" id="refresh-containers-btn">
              <i class="fas fa-sync me-1"></i> Refresh Containers
            </button>
            <button class="btn btn-outline-primary btn-sm ms-2" id="create-container-btn">
              <i class="fas fa-plus me-1"></i> Create Container
            </button>
          </div>
          
          <div id="containers-container">
            <div class="d-flex justify-content-center">
              <div class="spinner-border text-primary me-2" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <span>Loading Containers...</span>
            </div>
          </div>
        </div>
      </div>
    `, 'layer-group');
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
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
    
    // Go to dashboard button
    const dashboardBtn = document.getElementById('go-to-dashboard-btn');
    if (dashboardBtn) {
      dashboardBtn.addEventListener('click', () => {
        this.app.router.navigate('dashboard');
      });
    }
    
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
   * Add details event listeners
   * @param {Object} nodeDetails - Node details
   */
  addDetailsEventListeners(nodeDetails) {
    // Back button
    const backBtn = document.getElementById('back-to-nodes-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.app.router.navigate('nodes');
      });
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-node-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderDetails(nodeDetails.node.id);
        this.app.ui.showSuccess('Node details refreshed successfully');
      });
    }
    
    // Delete button
    const deleteBtn = document.getElementById('delete-node-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const nodeId = deleteBtn.dataset.id;
        this.deleteNode(nodeId);
      });
    }
    
    // Refresh VMs button
    const refreshVMsBtn = document.getElementById('refresh-vms-btn');
    if (refreshVMsBtn) {
      refreshVMsBtn.addEventListener('click', () => {
        this.loadVMs(nodeDetails.node.id);
      });
    }
    
    // Refresh containers button
    const refreshContainersBtn = document.getElementById('refresh-containers-btn');
    if (refreshContainersBtn) {
      refreshContainersBtn.addEventListener('click', () => {
        this.loadContainers(nodeDetails.node.id);
      });
    }
    
    // Create VM button
    const createVMBtn = document.getElementById('create-vm-btn');
    if (createVMBtn) {
      createVMBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Create VM functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Create container button
    const createContainerBtn = document.getElementById('create-container-btn');
    if (createContainerBtn) {
      createContainerBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Create Container functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Load VMs and containers
    this.loadVMs(nodeDetails.node.id);
    this.loadContainers(nodeDetails.node.id);
  }
  
  /**
   * Initialize charts
   * @param {Object} nodeDetails - Node details
   */
  initializeCharts(nodeDetails) {
    const { status } = nodeDetails;
    
    if (!status) {
      return;
    }
    
    // CPU usage chart
    const cpuCtx = document.getElementById('cpu-chart');
    if (cpuCtx) {
      const cpuUsage = status.cpu ? Math.round(status.cpu * 100) : 0;
      
      new Chart(cpuCtx, {
        type: 'doughnut',
        data: {
          labels: ['Used', 'Free'],
          datasets: [{
            data: [cpuUsage, 100 - cpuUsage],
            backgroundColor: ['rgba(52, 152, 219, 0.8)', 'rgba(52, 152, 219, 0.2)'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
    
    // Memory usage chart
    const memoryCtx = document.getElementById('memory-chart');
    if (memoryCtx) {
      const memUsage = status.memory && status.memory.total ? 
        Math.round((status.memory.used / status.memory.total) * 100) : 0;
      
      new Chart(memoryCtx, {
        type: 'doughnut',
        data: {
          labels: ['Used', 'Free'],
          datasets: [{
            data: [memUsage, 100 - memUsage],
            backgroundColor: ['rgba(46, 204, 113, 0.8)', 'rgba(46, 204, 113, 0.2)'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
    
    // Disk usage chart
    const diskCtx = document.getElementById('disk-chart');
    if (diskCtx) {
      const diskUsage = status.rootfs && status.rootfs.total ? 
        Math.round((status.rootfs.used / status.rootfs.total) * 100) : 0;
      
      new Chart(diskCtx, {
        type: 'doughnut',
        data: {
          labels: ['Used', 'Free'],
          datasets: [{
            data: [diskUsage, 100 - diskUsage],
            backgroundColor: ['rgba(231, 76, 60, 0.8)', 'rgba(231, 76, 60, 0.2)'],
            borderWidth: 0
          }]
        },
        options: {
          cutout: '70%',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    }
  }
  
  /**
   * Load VMs for a node
   * @param {number} nodeId - Node ID
   */
  async loadVMs(nodeId) {
    const vmsContainer = document.getElementById('vms-container');
    
    if (!vmsContainer) {
      return;
    }
    
    // Show loading state
    vmsContainer.innerHTML = `
      <div class="d-flex justify-content-center">
        <div class="spinner-border text-primary me-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span>Loading VMs...</span>
      </div>
    `;
    
    try {
      // Get VMs
      const vms = await this.app.api.getNodeVMs(nodeId);
      
      // Render VMs
      if (vms.length === 0) {
        vmsContainer.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> No virtual machines found on this node.
          </div>
        `;
      } else {
        vmsContainer.innerHTML = `
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Memory</th>
                  <th>CPU</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${vms.map(vm => `
                  <tr>
                    <td>${vm.vmid}</td>
                    <td>${vm.name}</td>
                    <td>${this.app.ui.getStatusBadge(vm.status || 'Unknown')}</td>
                    <td>${vm.maxmem ? this.app.ui.formatBytes(vm.maxmem) : 'Unknown'}</td>
                    <td>${vm.maxcpu || 'Unknown'} vCPU</td>
                    <td>
                      <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary vm-details-btn" data-id="${vm.vmid}" title="View details">
                          <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success vm-start-btn ${vm.status === 'running' ? 'disabled' : ''}" data-id="${vm.vmid}" title="Start VM">
                          <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning vm-stop-btn ${vm.status !== 'running' ? 'disabled' : ''}" data-id="${vm.vmid}" title="Stop VM">
                          <i class="fas fa-stop"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        
        // Add VM action event listeners
        this.addVMActionListeners();
      }
    } catch (error) {
      vmsContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i> Failed to load VMs: ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }
  
  /**
   * Load containers for a node
   * @param {number} nodeId - Node ID
   */
  async loadContainers(nodeId) {
    const containersContainer = document.getElementById('containers-container');
    
    if (!containersContainer) {
      return;
    }
    
    // Show loading state
    containersContainer.innerHTML = `
      <div class="d-flex justify-content-center">
        <div class="spinner-border text-primary me-2" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span>Loading Containers...</span>
      </div>
    `;
    
    try {
      // Get containers
      const containers = await this.app.api.getNodeContainers(nodeId);
      
      // Render containers
      if (containers.length === 0) {
        containersContainer.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> No containers found on this node.
          </div>
        `;
      } else {
        containersContainer.innerHTML = `
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Memory</th>
                  <th>CPU</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${containers.map(container => `
                  <tr>
                    <td>${container.vmid}</td>
                    <td>${container.name}</td>
                    <td>${this.app.ui.getStatusBadge(container.status || 'Unknown')}</td>
                    <td>${container.maxmem ? this.app.ui.formatBytes(container.maxmem) : 'Unknown'}</td>
                    <td>${container.maxcpu || 'Unknown'} vCPU</td>
                    <td>
                      <div class="btn-group">
                        <button class="btn btn-sm btn-outline-primary container-details-btn" data-id="${container.vmid}" title="View details">
                          <i class="fas fa-info-circle"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-success container-start-btn ${container.status === 'running' ? 'disabled' : ''}" data-id="${container.vmid}" title="Start Container">
                          <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-warning container-stop-btn ${container.status !== 'running' ? 'disabled' : ''}" data-id="${container.vmid}" title="Stop Container">
                          <i class="fas fa-stop"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
        
        // Add container action event listeners
        this.addContainerActionListeners();
      }
    } catch (error) {
      containersContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-triangle me-2"></i> Failed to load containers: ${error.message || 'Unknown error'}
        </div>
      `;
    }
  }
  
  /**
   * Add VM action event listeners
   */
  addVMActionListeners() {
    // VM details buttons
    const vmDetailsBtns = document.querySelectorAll('.vm-details-btn');
    vmDetailsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        this.app.ui.showNotification('VM details functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // VM start buttons
    const vmStartBtns = document.querySelectorAll('.vm-start-btn:not(.disabled)');
    vmStartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        this.app.ui.showNotification('VM start functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // VM stop buttons
    const vmStopBtns = document.querySelectorAll('.vm-stop-btn:not(.disabled)');
    vmStopBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        this.app.ui.showNotification('VM stop functionality is under development.', 'info', 'Coming Soon');
      });
    });
  }
  
  /**
   * Add container action event listeners
   */
  addContainerActionListeners() {
    // Container details buttons
    const containerDetailsBtns = document.querySelectorAll('.container-details-btn');
    containerDetailsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        this.app.ui.showNotification('Container details functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // Container start buttons
    const containerStartBtns = document.querySelectorAll('.container-start-btn:not(.disabled)');
    containerStartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        this.app.ui.showNotification('Container start functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // Container stop buttons
    const containerStopBtns = document.querySelectorAll('.container-stop-btn:not(.disabled)');
    containerStopBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const containerId = btn.dataset.id;
        this.app.ui.showNotification('Container stop functionality is under development.', 'info', 'Coming Soon');
      });
    });
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
      
      // Navigate back to nodes view
      this.app.router.navigate('nodes');
    } catch (error) {
      // Hide loading state
      this.app.ui.hideLoading();
      
      // Show error message
      this.app.ui.showError('Failed to delete node: ' + (error.message || 'Unknown error'));
    }
  }
  
  /**
   * Format uptime
   * @param {number} uptime - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(uptime) {
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    if (days > 0) {
      return `${days} days, ${hours} hours, ${minutes} minutes`;
    } else if (hours > 0) {
      return `${hours} hours, ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  }
}