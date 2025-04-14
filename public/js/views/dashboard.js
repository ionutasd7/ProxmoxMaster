/**
 * Dashboard View
 * Displays cluster overview, resource usage, and server status
 */
import { formatBytes, formatUptime, calculatePercentage, cpuToPercentage } from '../utils.js';
import * as Charts from '../chartConfig.js';

export class DashboardView {
  constructor(app) {
    this.app = app;
    
    // Charts
    this.cpuChart = null;
    this.memoryChart = null;
    this.storageChart = null;
    this.networkChart = null;
    
    // Refresh interval
    this.refreshInterval = null;
    this.refreshRate = 30000; // 30 seconds
  }
  
  /**
   * Render the dashboard view
   */
  render() {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    // Set app container with sidebar and content
    appElement.innerHTML = this.getLayoutHTML();
    
    // Render dashboard content
    this.renderDashboardContent();
    
    // Add event listeners
    this.addEventListeners();
    
    // Set active navigation item
    this.setActiveNavItem('dashboard');
    
    // Start auto-refresh
    this.startAutoRefresh();
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
            <!-- Dashboard content will be rendered here -->
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Render the dashboard content
   */
  async renderDashboardContent() {
    const contentElement = document.getElementById('main-content');
    if (!contentElement) return;
    
    // Show loading state
    contentElement.innerHTML = `<div class="text-center py-5"><div class="spinner-border" role="status"></div><p class="mt-2">Loading dashboard data...</p></div>`;
    
    try {
      // Fetch dashboard data
      const dashboardData = await this.fetchDashboardData();
      const { cluster } = dashboardData;
      
      // Get state data
      const { nodes, vms, containers } = this.app.state.getState();
      
      // Render content
      contentElement.innerHTML = `
        <div class="mb-4 d-flex justify-content-between align-items-center">
          <h2 class="mb-0">Dashboard</h2>
          <button id="refresh-btn" class="btn btn-primary">
            <i class="fas fa-sync-alt me-2"></i> Refresh Data
          </button>
        </div>
        
        <!-- Statistics Cards -->
        <div class="row row-cols-1 row-cols-md-2 row-cols-xl-4 g-4 mb-4">
          ${this.getStatisticsCardsHTML(cluster)}
        </div>
        
        <!-- Resource Usage -->
        <div class="row g-4 mb-4">
          <!-- CPU, Memory, Disk Usage -->
          <div class="col-md-6">
            <div class="custom-card h-100">
              <div class="card-header">
                <h5><i class="fas fa-microchip me-2"></i> Resource Usage</h5>
              </div>
              <div class="card-body">
                ${this.getResourceUsageHTML(cluster.stats)}
              </div>
            </div>
          </div>
          
          <!-- Cluster Status -->
          <div class="col-md-6">
            <div class="custom-card h-100">
              <div class="card-header">
                <h5><i class="fas fa-server me-2"></i> Cluster Status</h5>
              </div>
              <div class="card-body">
                ${this.getClusterStatusHTML(cluster.stats)}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Charts -->
        <div class="row g-4 mb-4">
          <!-- Network Traffic Chart -->
          <div class="col-md-6">
            <div class="custom-card h-100">
              <div class="card-header">
                <h5><i class="fas fa-network-wired me-2"></i> Network Traffic</h5>
              </div>
              <div class="card-body">
                <div class="network-traffic-info mb-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <i class="fas fa-arrow-down text-success me-1"></i> Inbound: 
                      <span id="network-in">Calculating...</span>
                    </div>
                    <div>
                      <i class="fas fa-arrow-up text-danger me-1"></i> Outbound: 
                      <span id="network-out">Calculating...</span>
                    </div>
                  </div>
                </div>
                <div style="height: 300px;">
                  <canvas id="network-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Distribution Chart -->
          <div class="col-md-6">
            <div class="custom-card h-100">
              <div class="card-header">
                <h5><i class="fas fa-chart-pie me-2"></i> VM/CT Distribution</h5>
              </div>
              <div class="card-body">
                <div style="height: 300px;">
                  <canvas id="distribution-chart"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Servers Overview -->
        <div class="custom-card mb-4">
          <div class="card-header">
            <h5><i class="fas fa-server me-2"></i> Servers Overview</h5>
          </div>
          <div class="card-body">
            ${this.getServersOverviewHTML(cluster.nodes)}
          </div>
        </div>
        
        <!-- Recent Activity -->
        <div class="custom-card">
          <div class="card-header">
            <h5><i class="fas fa-history me-2"></i> Recent Activity</h5>
          </div>
          <div class="card-body">
            ${this.getRecentActivityHTML()}
          </div>
        </div>
      `;
      
      // Update dashboard components with real data
      this.updateDashboardComponents(cluster.stats, cluster.networkUsage);
      
      // Initialize charts
      this.initializeCharts(cluster);
      
    } catch (error) {
      console.error('Error rendering dashboard content:', error);
      contentElement.innerHTML = `
        <div class="alert alert-danger mt-4">
          <h4 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i> Error</h4>
          <p>Failed to load dashboard data: ${error.message || 'Unknown error'}</p>
          <hr>
          <button id="retry-btn" class="btn btn-danger">Retry</button>
        </div>
      `;
      
      // Add retry button event listener
      const retryBtn = document.getElementById('retry-btn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => {
          this.renderDashboardContent();
        });
      }
    }
  }
  
  /**
   * Fetch dashboard data from API
   * @returns {Promise<Object>} Dashboard data
   */
  async fetchDashboardData() {
    try {
      // Fetch fresh data from API
      const response = await this.app.api.getDashboardData();
      
      if (!response || !response.success) {
        throw new Error('Invalid dashboard data response');
      }
      
      // Update dashboard state
      if (window.dashboardState) {
        const preservedData = window.dashboardState.updateData(response);
        return preservedData;
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
  
  /**
   * Get statistics cards HTML
   * @param {Object} cluster - Cluster data
   * @returns {string} HTML
   */
  getStatisticsCardsHTML(cluster) {
    const { stats } = cluster;
    
    return `
      <!-- Nodes Card -->
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-muted mb-2">Nodes</h6>
                <h3 class="mb-0">${stats.totalNodes || 0}</h3>
                <p class="mb-0">
                  <span class="text-success">${stats.onlineNodes || 0} Online</span>
                  ${stats.offlineNodes > 0 ? `<span class="text-danger ms-2">${stats.offlineNodes} Offline</span>` : ''}
                </p>
              </div>
              <div class="rounded-circle p-3 bg-light">
                <i class="fas fa-server fa-2x text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- VMs Card -->
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-muted mb-2">Virtual Machines</h6>
                <h3 class="mb-0">${stats.totalVMs || 0}</h3>
                <p class="mb-0">
                  <span class="text-success">${stats.runningVMs || 0} Running</span>
                  ${stats.totalVMs - stats.runningVMs > 0 ? `<span class="text-danger ms-2">${stats.totalVMs - stats.runningVMs} Stopped</span>` : ''}
                </p>
              </div>
              <div class="rounded-circle p-3 bg-light">
                <i class="fas fa-desktop fa-2x text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Containers Card -->
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-muted mb-2">Containers</h6>
                <h3 class="mb-0">${stats.totalContainers || 0}</h3>
                <p class="mb-0">
                  <span class="text-success">${stats.runningContainers || 0} Running</span>
                  ${stats.totalContainers - stats.runningContainers > 0 ? `<span class="text-danger ms-2">${stats.totalContainers - stats.runningContainers} Stopped</span>` : ''}
                </p>
              </div>
              <div class="rounded-circle p-3 bg-light">
                <i class="fas fa-box fa-2x text-info"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Resources Card -->
      <div class="col">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h6 class="text-muted mb-2">Resources</h6>
                <h3 class="mb-0">${stats.totalCPUs || 0} CPUs</h3>
                <p class="mb-0">
                  <span>${formatBytes(stats.totalMemory || 0)} RAM</span>
                </p>
              </div>
              <div class="rounded-circle p-3 bg-light">
                <i class="fas fa-microchip fa-2x text-warning"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get resource usage HTML
   * @param {Object} stats - Cluster stats
   * @returns {string} HTML
   */
  getResourceUsageHTML(stats) {
    // CPU usage
    const cpuPercentage = cpuToPercentage(stats.cpuUsage) || 0;
    
    // Memory usage
    const memoryPercentage = stats.totalMemory > 0 
      ? calculatePercentage(stats.usedMemory, stats.totalMemory) 
      : 0;
      
    const memoryLabel = stats.totalMemory > 0 
      ? `${formatBytes(stats.usedMemory || 0)} / ${formatBytes(stats.totalMemory || 0)}`
      : 'Calculating...';
    
    // Storage usage
    const storagePercentage = stats.totalStorage > 0 
      ? calculatePercentage(stats.usedStorage, stats.totalStorage) 
      : 0;
      
    const storageLabel = stats.totalStorage > 0 
      ? `${formatBytes(stats.usedStorage || 0)} / ${formatBytes(stats.totalStorage || 0)}`
      : 'Calculating...';
    
    return `
      <!-- CPU Usage -->
      <div class="resource-usage">
        <div class="resource-header">
          <div class="resource-title">CPU Usage</div>
          <div class="resource-value" id="cpu-usage-percentage">${cpuPercentage}%</div>
        </div>
        <div class="resource-bar">
          <div class="resource-progress cpu-bar" style="width: ${cpuPercentage}%;"></div>
        </div>
        <div class="mt-2 text-muted small text-end" id="cpu-usage-label">${stats.totalCPUs || 0} CPUs Total</div>
      </div>
      
      <!-- Memory Usage -->
      <div class="resource-usage">
        <div class="resource-header">
          <div class="resource-title">Memory Usage</div>
          <div class="resource-value" id="memory-usage-percentage">${memoryPercentage}%</div>
        </div>
        <div class="resource-bar">
          <div class="resource-progress memory-bar" style="width: ${memoryPercentage}%;"></div>
        </div>
        <div class="mt-2 text-muted small text-end" id="memory-usage-label">${memoryLabel}</div>
      </div>
      
      <!-- Disk Usage -->
      <div class="resource-usage">
        <div class="resource-header">
          <div class="resource-title">Storage Usage</div>
          <div class="resource-value" id="disk-usage-percentage">${storagePercentage}%</div>
        </div>
        <div class="resource-bar">
          <div class="resource-progress disk-bar" style="width: ${storagePercentage}%;"></div>
        </div>
        <div class="mt-2 text-muted small text-end" id="disk-usage-label">${storageLabel}</div>
      </div>
    `;
  }
  
  /**
   * Get cluster status HTML
   * @param {Object} stats - Cluster stats
   * @returns {string} HTML
   */
  getClusterStatusHTML(stats) {
    return `
      <div class="row g-3">
        <div class="col-md-4">
          <div class="border rounded p-3 text-center">
            <div class="mb-2">
              <i class="fas fa-check-circle fa-2x text-success"></i>
            </div>
            <h4 id="online-nodes">${stats.onlineNodes || 0}</h4>
            <div class="text-muted">Online Nodes</div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="border rounded p-3 text-center">
            <div class="mb-2">
              <i class="fas fa-exclamation-triangle fa-2x text-warning"></i>
            </div>
            <h4 id="warning-nodes">${stats.warningNodes || 0}</h4>
            <div class="text-muted">Warning Nodes</div>
          </div>
        </div>
        
        <div class="col-md-4">
          <div class="border rounded p-3 text-center">
            <div class="mb-2">
              <i class="fas fa-times-circle fa-2x text-danger"></i>
            </div>
            <h4 id="offline-nodes">${stats.offlineNodes || 0}</h4>
            <div class="text-muted">Offline Nodes</div>
          </div>
        </div>
      </div>
      
      <div class="row g-3 mt-2">
        <div class="col-md-6">
          <div class="border rounded p-3 text-center">
            <div class="mb-2">
              <i class="fas fa-desktop fa-2x text-primary"></i>
            </div>
            <h4>${stats.runningVMs || 0} / ${stats.totalVMs || 0}</h4>
            <div class="text-muted">Running VMs</div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="border rounded p-3 text-center">
            <div class="mb-2">
              <i class="fas fa-box fa-2x text-info"></i>
            </div>
            <h4>${stats.runningContainers || 0} / ${stats.totalContainers || 0}</h4>
            <div class="text-muted">Running Containers</div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get servers overview HTML
   * @param {Array} nodes - Cluster nodes
   * @returns {string} HTML
   */
  getServersOverviewHTML(nodes) {
    if (!nodes || nodes.length === 0) {
      return `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i> No nodes found in the cluster.
          <a href="#" data-route="nodes" class="alert-link ms-2">Add nodes</a>
        </div>
      `;
    }
    
    return `
      <div class="table-responsive">
        <table class="table custom-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>CPU</th>
              <th>Memory</th>
              <th>VMs/CTs</th>
              <th>Uptime</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${nodes.map(node => this.getNodeRowHTML(node)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
  
  /**
   * Get node row HTML
   * @param {Object} node - Node data
   * @returns {string} HTML
   */
  getNodeRowHTML(node) {
    // Format memory values
    const usedMemory = node.memory?.used || 0;
    const totalMemory = node.memory?.total || 0;
    const memoryPercentage = totalMemory > 0 
      ? Math.round((usedMemory / totalMemory) * 100) 
      : 0;
    
    // Format CPU value
    const cpuPercentage = cpuToPercentage(node.cpu || 0);
    
    // Get VMs/CTs count
    const vmsCount = node.vms || 0;
    const ctsCount = node.containers || 0;
    
    return `
      <tr>
        <td>
          <a href="#" data-action="view-node" data-id="${node.id}" class="fw-bold">
            ${node.name}
          </a>
        </td>
        <td>
          ${this.app.ui.getStatusBadge(node.status)}
        </td>
        <td>
          <div class="d-flex align-items-center">
            <div class="progress flex-grow-1 me-2" style="height: 6px;">
              <div class="progress-bar bg-primary" style="width: ${cpuPercentage}%"></div>
            </div>
            <span>${cpuPercentage}%</span>
          </div>
        </td>
        <td>
          <div class="d-flex align-items-center">
            <div class="progress flex-grow-1 me-2" style="height: 6px;">
              <div class="progress-bar bg-info" style="width: ${memoryPercentage}%"></div>
            </div>
            <span>${memoryPercentage}%</span>
          </div>
          <small class="text-muted">${formatBytes(usedMemory)} / ${formatBytes(totalMemory)}</small>
        </td>
        <td>${vmsCount + ctsCount > 0 ? `${vmsCount} VMs, ${ctsCount} CTs` : 'None'}</td>
        <td>${formatUptime(node.uptime || 0)}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-primary" data-action="view-node" data-id="${node.id}">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }
  
  /**
   * Get recent activity HTML
   * @returns {string} HTML
   */
  getRecentActivityHTML() {
    // In a real app, we would fetch activity from API
    return `
      <div class="alert alert-info mb-0">
        <i class="fas fa-info-circle me-2"></i> Activity logging will be available in a future update.
      </div>
    `;
  }
  
  /**
   * Update dashboard components with real data
   * @param {Object} clusterStats - Cluster statistics
   * @param {Object} networkUsage - Network usage data
   */
  updateDashboardComponents(clusterStats, networkUsage) {
    // Update CPU usage
    const cpuPercentage = document.getElementById('cpu-usage-percentage');
    if (cpuPercentage) {
      cpuPercentage.textContent = `${Math.round(cpuToPercentage(clusterStats.cpuUsage))}%`;
    }
    
    const cpuLabel = document.getElementById('cpu-usage-label');
    if (cpuLabel) {
      cpuLabel.textContent = `${clusterStats.totalCPUs} CPUs Total`;
    }
    
    // Update memory usage
    const memoryPercentage = document.getElementById('memory-usage-percentage');
    if (memoryPercentage) {
      const percentage = clusterStats.totalMemory > 0 
        ? Math.round((clusterStats.usedMemory / clusterStats.totalMemory) * 100) 
        : 0;
      memoryPercentage.textContent = `${percentage}%`;
    }
    
    const memoryLabel = document.getElementById('memory-usage-label');
    if (memoryLabel) {
      const totalGB = formatBytes(clusterStats.totalMemory);
      const usedGB = formatBytes(clusterStats.usedMemory);
      memoryLabel.textContent = `${usedGB} / ${totalGB}`;
    }
    
    // Update disk usage
    const diskPercentage = document.getElementById('disk-usage-percentage');
    if (diskPercentage) {
      const percentage = clusterStats.totalStorage > 0 
        ? Math.round((clusterStats.usedStorage / clusterStats.totalStorage) * 100) 
        : 0;
      diskPercentage.textContent = `${percentage}%`;
    }
    
    const diskLabel = document.getElementById('disk-usage-label');
    if (diskLabel) {
      const totalGB = formatBytes(clusterStats.totalStorage);
      const usedGB = formatBytes(clusterStats.usedStorage);
      diskLabel.textContent = `${usedGB} / ${totalGB}`;
    }
    
    // Update network usage
    const networkIn = document.getElementById('network-in');
    if (networkIn) {
      networkIn.textContent = `${formatBytes(networkUsage.inbound || 0)}/s`;
    }
    
    const networkOut = document.getElementById('network-out');
    if (networkOut) {
      networkOut.textContent = `${formatBytes(networkUsage.outbound || 0)}/s`;
    }
    
    // Update cluster status
    const onlineNodes = document.getElementById('online-nodes');
    if (onlineNodes) {
      onlineNodes.textContent = clusterStats.onlineNodes || 0;
    }
    
    const warningNodes = document.getElementById('warning-nodes');
    if (warningNodes) {
      warningNodes.textContent = clusterStats.warningNodes || 0;
    }
    
    const offlineNodes = document.getElementById('offline-nodes');
    if (offlineNodes) {
      offlineNodes.textContent = clusterStats.offlineNodes || 0;
    }
  }
  
  /**
   * Initialize charts
   * @param {Object} cluster - Cluster data
   */
  initializeCharts(cluster) {
    // Network traffic chart
    if (document.getElementById('network-chart')) {
      // Example data for last 12 hours
      const hours = Array.from({ length: 12 }, (_, i) => `${i + 1}h ago`).reverse();
      const inboundData = Array.from({ length: 12 }, () => Math.floor(Math.random() * 5 * 1024 * 1024));
      const outboundData = Array.from({ length: 12 }, () => Math.floor(Math.random() * 3 * 1024 * 1024));
      
      // Create network chart
      this.networkChart = Charts.createNetworkChart('network-chart', inboundData, outboundData, hours);
    }
    
    // VM/CT distribution chart
    if (document.getElementById('distribution-chart')) {
      const { stats } = cluster;
      
      // Create pie chart
      this.distributionChart = Charts.createPieChart(
        'distribution-chart',
        [
          stats.runningVMs || 0, 
          stats.totalVMs - stats.runningVMs || 0,
          stats.runningContainers || 0,
          stats.totalContainers - stats.runningContainers || 0
        ],
        [
          'Running VMs', 
          'Stopped VMs', 
          'Running Containers', 
          'Stopped Containers'
        ],
        [
          '#28a745', // Running VMs
          '#dc3545', // Stopped VMs
          '#17a2b8', // Running Containers
          '#ffc107'  // Stopped Containers
        ]
      );
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.renderDashboardContent();
      });
    }
    
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
    const viewNodeBtns = document.querySelectorAll('[data-action="view-node"]');
    viewNodeBtns.forEach(btn => {
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        const nodeId = btn.getAttribute('data-id');
        if (nodeId) {
          this.app.router.navigate('node-details', { id: nodeId });
        }
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
  
  /**
   * Start auto-refresh
   */
  startAutoRefresh() {
    // Clear any existing interval
    this.stopAutoRefresh();
    
    // Set new interval
    this.refreshInterval = setInterval(() => {
      this.renderDashboardContent();
    }, this.refreshRate);
  }
  
  /**
   * Stop auto-refresh
   */
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  /**
   * Format bytes to human-readable size
   * @param {number} bytes - Bytes
   * @param {number} decimals - Decimal places
   * @returns {string} Formatted size
   */
  formatBytes(bytes, decimals = 2) {
    return formatBytes(bytes, decimals);
  }
  
  /**
   * Format uptime to human-readable time
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    return formatUptime(seconds);
  }
  
  /**
   * Calculate percentage
   * @param {number} value - Value
   * @param {number} total - Total
   * @returns {number} Percentage
   */
  calculatePercentage(value, total) {
    return calculatePercentage(value, total);
  }
  
  /**
   * Convert CPU usage from decimal to percentage
   * @param {number} value - CPU usage (0-1)
   * @returns {number} CPU usage percentage
   */
  cpuToPercentage(value) {
    return cpuToPercentage(value);
  }
}