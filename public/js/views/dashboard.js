/**
 * Dashboard View
 * Displays the cluster dashboard with resource monitoring and overview
 */
export class DashboardView {
  constructor(app) {
    this.app = app;
    this.charts = {};
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
      ${this.app.ui.createPageHeader('Cluster Dashboard', 'chart-line')}
      
      <!-- Stats Cards Row -->
      <div class="row">
        <div class="col-md-3">
          <div class="card stat-card stat-primary mb-4">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="stat-value">${nodes.length}</div>
                  <div class="stat-label">Proxmox Nodes</div>
                </div>
                <div class="stat-icon">
                  <i class="fas fa-server"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card stat-card stat-success mb-4">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="stat-value">${vms.length}</div>
                  <div class="stat-label">Virtual Machines</div>
                </div>
                <div class="stat-icon">
                  <i class="fas fa-desktop"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card stat-card stat-warning mb-4">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="stat-value">${containers.length}</div>
                  <div class="stat-label">LXC Containers</div>
                </div>
                <div class="stat-icon">
                  <i class="fas fa-box"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-3">
          <div class="card stat-card stat-danger mb-4">
            <div class="card-body p-3">
              <div class="d-flex justify-content-between align-items-center">
                <div>
                  <div class="stat-value" id="active-vms">-</div>
                  <div class="stat-label">Running VMs</div>
                </div>
                <div class="stat-icon">
                  <i class="fas fa-play-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Cluster Monitoring -->
      ${this.getClusterMonitoringHTML(nodes)}
      
      <!-- Node Status Cards -->
      <div class="row">
        ${this.getNodeStatusCardsHTML(nodes)}
      </div>
      
      <!-- Recent Events Card -->
      <div class="row">
        <div class="col-md-12">
          ${this.getRecentEventsHTML()}
        </div>
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
    
    // Initialize charts
    this.initializeCharts(nodes);
    
    // Count active VMs
    this.updateActiveVMCount(vms);
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
  
  /**
   * Get cluster monitoring HTML
   * @param {Array} nodes - Nodes
   * @returns {string} Cluster monitoring HTML
   */
  getClusterMonitoringHTML(nodes) {
    const noNodesMessage = `
      <div class="alert alert-info mb-0">
        <i class="fas fa-info-circle me-2"></i> No nodes available. Add your first Proxmox node to see resource monitoring.
      </div>
    `;
    
    if (nodes.length === 0) {
      return this.app.ui.createCard('Cluster Resource Monitoring', noNodesMessage, 'chart-line');
    }
    
    return `
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-microchip me-2 text-primary"></i>
                CPU Usage
              </h5>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary active" data-time="1h">1h</button>
                <button class="btn btn-sm btn-outline-secondary" data-time="6h">6h</button>
                <button class="btn btn-sm btn-outline-secondary" data-time="24h">24h</button>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-container" id="cpu-chart-container">
                <canvas id="cpu-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-memory me-2 text-primary"></i>
                Memory Usage
              </h5>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-secondary active" data-time="1h">1h</button>
                <button class="btn btn-sm btn-outline-secondary" data-time="6h">6h</button>
                <button class="btn btn-sm btn-outline-secondary" data-time="24h">24h</button>
              </div>
            </div>
            <div class="card-body">
              <div class="chart-container" id="memory-chart-container">
                <canvas id="memory-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-hdd me-2 text-primary"></i>
                Storage Usage
              </h5>
            </div>
            <div class="card-body">
              <div class="chart-container" id="storage-chart-container">
                <canvas id="storage-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">
                <i class="fas fa-network-wired me-2 text-primary"></i>
                Network Traffic
              </h5>
            </div>
            <div class="card-body">
              <div class="chart-container" id="network-chart-container">
                <canvas id="network-chart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get node status cards HTML
   * @param {Array} nodes - Nodes
   * @returns {string} Node status cards HTML
   */
  getNodeStatusCardsHTML(nodes) {
    if (nodes.length === 0) {
      return `
        <div class="col-md-12">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> No nodes available. Please add a node to see node status.
          </div>
        </div>
      `;
    }
    
    return nodes.map(node => `
      <div class="col-md-6 col-xl-4 mb-4">
        <div class="node-status-card">
          <div class="node-title">
            <div class="status-indicator ${node.status?.toLowerCase() === 'online' ? 'status-online' : 'status-offline'}"></div>
            <span>${node.name}</span>
            <a href="#" class="ms-auto node-details-btn text-primary" data-id="${node.id}" title="View details">
              <i class="fas fa-external-link-alt"></i>
            </a>
          </div>
          
          <div class="d-flex align-items-center mt-2 mb-3">
            <div>
              <div class="text-muted" style="font-size: 0.8rem;">${node.api_host || node.hostname}:${node.api_port || node.port || 8006}</div>
              <div>${this.app.ui.getStatusBadge(node.status || 'Unknown')}</div>
            </div>
          </div>
          
          <div class="node-details">
            ${this.app.ui.createResourceMeter(node.cpu_usage || 0, 'CPU', `${node.cpu_usage || 0}%`)}
            ${this.app.ui.createResourceMeter(node.memory_usage || 0, 'Memory', `${node.memory_usage || 0}%`)}
            ${this.app.ui.createResourceMeter(node.disk_usage || 0, 'Storage', `${node.disk_usage || 0}%`)}
          </div>
          
          <div class="d-flex flex-wrap mt-3">
            <div class="me-3 mb-2">
              <div class="text-muted small">VMs</div>
              <div class="fw-semibold">${node.vms_count || 0}</div>
            </div>
            <div class="me-3 mb-2">
              <div class="text-muted small">Containers</div>
              <div class="fw-semibold">${node.container_count || 0}</div>
            </div>
            <div class="me-3 mb-2">
              <div class="text-muted small">Uptime</div>
              <div class="fw-semibold">${this.formatUptime(node.uptime || 0)}</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  /**
   * Get recent events HTML
   * @returns {string} Recent events HTML
   */
  getRecentEventsHTML() {
    return this.app.ui.createCard('Recent Events', `
      <div class="alert alert-info mb-0">
        <i class="fas fa-info-circle me-2"></i> Event logging will be available after you interact with Proxmox nodes.
      </div>
    `, 'history');
  }
  
  /**
   * Format uptime in seconds to readable format
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    if (seconds === 0) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }
  
  /**
   * Update active VM count
   * @param {Array} vms - VMs
   */
  updateActiveVMCount(vms) {
    const activeVMsElement = document.getElementById('active-vms');
    if (activeVMsElement) {
      const activeVMs = vms.filter(vm => 
        vm.status && 
        (vm.status.toLowerCase() === 'running' || vm.status.toLowerCase() === 'online')
      ).length;
      
      activeVMsElement.textContent = activeVMs;
    }
  }
  
  /**
   * Initialize charts
   * @param {Array} nodes - Nodes
   */
  initializeCharts(nodes) {
    if (nodes.length === 0) return;
    
    setTimeout(() => {
      this.initCPUChart();
      this.initMemoryChart();
      this.initStorageChart();
      this.initNetworkChart();
    }, 100);
  }
  
  /**
   * Initialize CPU chart
   */
  initCPUChart() {
    const ctx = document.getElementById('cpu-chart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const data = {
      labels: this.generateTimeLabels(24),
      datasets: [
        {
          label: 'Average CPU Usage',
          data: this.generateRandomData(24, 10, 60),
          borderColor: '#8257e6',
          backgroundColor: 'rgba(130, 87, 230, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    };
    
    const config = {
      type: 'line',
      data,
      options: this.getChartOptions('CPU Usage (%)')
    };
    
    this.charts.cpu = new Chart(ctx, config);
  }
  
  /**
   * Initialize memory chart
   */
  initMemoryChart() {
    const ctx = document.getElementById('memory-chart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const data = {
      labels: this.generateTimeLabels(24),
      datasets: [
        {
          label: 'Average Memory Usage',
          data: this.generateRandomData(24, 30, 80),
          borderColor: '#53c986',
          backgroundColor: 'rgba(83, 201, 134, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    };
    
    const config = {
      type: 'line',
      data,
      options: this.getChartOptions('Memory Usage (%)')
    };
    
    this.charts.memory = new Chart(ctx, config);
  }
  
  /**
   * Initialize storage chart
   */
  initStorageChart() {
    const ctx = document.getElementById('storage-chart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const data = {
      labels: ['Free', 'Used'],
      datasets: [
        {
          data: [30, 70],
          backgroundColor: ['#53c986', '#ff5252'],
          hoverOffset: 4,
          borderWidth: 1,
          borderColor: 'rgba(0, 0, 0, 0.1)'
        }
      ]
    };
    
    const config = {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: 'rgb(240, 240, 240)',
              font: {
                family: 'Inter, sans-serif',
                size: 12
              },
              padding: 15,
              boxWidth: 15,
              boxHeight: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          title: {
            display: true,
            text: 'Storage Usage',
            color: 'rgb(240, 240, 240)',
            font: {
              family: 'Inter, sans-serif',
              size: 14,
              weight: 'normal'
            },
            padding: {
              bottom: 15
            }
          },
          tooltip: {
            backgroundColor: 'rgba(42, 42, 42, 0.9)',
            titleColor: 'rgb(240, 240, 240)',
            bodyColor: 'rgb(240, 240, 240)',
            borderColor: 'var(--accent-primary)',
            borderWidth: 1,
            padding: 10,
            titleFont: {
              family: 'Inter, sans-serif',
              weight: 'bold'
            },
            bodyFont: {
              family: 'Inter, sans-serif'
            },
            cornerRadius: 6,
            boxPadding: 5
          }
        },
        backgroundColor: 'transparent'
      }
    };
    
    this.charts.storage = new Chart(ctx, config);
  }
  
  /**
   * Initialize network chart
   */
  initNetworkChart() {
    const ctx = document.getElementById('network-chart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const data = {
      labels: this.generateTimeLabels(12),
      datasets: [
        {
          label: 'Inbound',
          data: this.generateRandomData(12, 10, 100),
          borderColor: '#33b5e5',
          backgroundColor: 'rgba(51, 181, 229, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        },
        {
          label: 'Outbound',
          data: this.generateRandomData(12, 5, 50),
          borderColor: '#ffcc33',
          backgroundColor: 'rgba(255, 204, 51, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 2
        }
      ]
    };
    
    const config = {
      type: 'line',
      data,
      options: this.getChartOptions('Network Traffic (MB/s)')
    };
    
    this.charts.network = new Chart(ctx, config);
  }
  
  /**
   * Get chart options
   * @param {string} yAxisTitle - Y-axis title
   * @returns {Object} Chart options
   */
  getChartOptions(yAxisTitle) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            color: 'rgb(240, 240, 240)',
            font: {
              family: 'Inter, sans-serif'
            }
          }
        },
        title: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(42, 42, 42, 0.9)',
          titleColor: 'rgb(240, 240, 240)',
          bodyColor: 'rgb(240, 240, 240)',
          borderColor: 'var(--accent-primary)',
          borderWidth: 1,
          padding: 10,
          titleFont: {
            family: 'Inter, sans-serif',
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            family: 'Inter, sans-serif',
            size: 13
          },
          cornerRadius: 6
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgb(200, 200, 200)',
            font: {
              family: 'Inter, sans-serif'
            }
          },
          border: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          ticks: {
            color: 'rgb(200, 200, 200)',
            font: {
              family: 'Inter, sans-serif'
            }
          },
          title: {
            display: true,
            text: yAxisTitle,
            color: 'rgb(200, 200, 200)',
            font: {
              family: 'Inter, sans-serif',
              size: 12
            }
          },
          border: {
            color: 'rgba(255, 255, 255, 0.2)'
          }
        }
      },
      color: 'rgb(240, 240, 240)',
      backgroundColor: 'transparent'
    };
  }
  
  /**
   * Generate time labels for charts
   * @param {number} count - Number of labels
   * @returns {Array} Time labels
   */
  generateTimeLabels(count) {
    const labels = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600 * 1000);
      labels.push(time.getHours().toString().padStart(2, '0') + ':00');
    }
    
    return labels;
  }
  
  /**
   * Generate random data for charts
   * @param {number} count - Number of data points
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {Array} Random data
   */
  generateRandomData(count, min, max) {
    return Array.from({ length: count }, () => Math.floor(Math.random() * (max - min + 1)) + min);
  }
}