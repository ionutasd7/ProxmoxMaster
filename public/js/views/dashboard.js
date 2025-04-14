/**
 * Dashboard View
 */
export function renderDashboardView(app) {
  const { api, ui, dashboardState } = app;
  
  // Create container
  const container = document.createElement('div');
  container.className = 'app-container';
  
  // Create sidebar
  const sidebar = document.createElement('div');
  sidebar.className = 'sidebar';
  
  // Create sidebar header
  const sidebarHeader = document.createElement('div');
  sidebarHeader.className = 'sidebar-header';
  sidebarHeader.innerHTML = `
    <h4 class="mb-0">Proxmox Manager</h4>
    <p class="text-muted small mb-0">v1.0.0</p>
  `;
  
  // Create sidebar content
  const sidebarContent = document.createElement('div');
  sidebarContent.className = 'sidebar-sticky';
  
  // Create navigation
  const nav = document.createElement('ul');
  nav.className = 'nav flex-column';
  
  // Define navigation items
  const navItems = [
    { route: 'dashboard', icon: 'tachometer-alt', label: 'Dashboard' },
    { route: 'nodes', icon: 'server', label: 'Nodes' },
    { route: 'vms', icon: 'desktop', label: 'Virtual Machines' },
    { route: 'containers', icon: 'box', label: 'Containers' },
    { route: 'storage', icon: 'hdd', label: 'Storage' },
    { route: 'network', icon: 'network-wired', label: 'Network' },
    { route: 'templates', icon: 'copy', label: 'Templates' },
    { route: 'settings', icon: 'cog', label: 'Settings' }
  ];
  
  // Create navigation items
  navItems.forEach(item => {
    const li = document.createElement('li');
    li.className = 'nav-item';
    
    li.innerHTML = `
      <a class="nav-link ${item.route === 'dashboard' ? 'active' : ''}" href="#" data-route="${item.route}">
        <i class="fas fa-${item.icon} mr-2"></i>
        <span>${item.label}</span>
      </a>
    `;
    
    nav.appendChild(li);
  });
  
  // Create main content
  const content = document.createElement('div');
  content.className = 'content';
  
  // Create dashboard content
  const dashboardContent = document.createElement('div');
  dashboardContent.className = 'dashboard-content container-fluid py-3';
  
  try {
    // Get dashboard data
    const data = dashboardState.getData();
    
    if (data && data.cluster) {
      const { stats, nodes = [] } = data.cluster;
      
      // Create header
      const header = document.createElement('div');
      header.className = 'row mb-4';
      header.innerHTML = `
        <div class="col-12 d-flex justify-content-between align-items-center">
          <div>
            <h1 class="h3 mb-2 text-gray-800">Dashboard</h1>
            <p class="mb-4">Overview of your Proxmox infrastructure</p>
          </div>
          <div>
            <button id="refresh-dashboard" class="btn btn-outline-primary">
              <i class="fas fa-sync-alt me-2"></i> Refresh
            </button>
          </div>
        </div>
      `;
      
      // Create stats cards
      const statsRow = document.createElement('div');
      statsRow.className = 'row';
      
      // Define stat cards
      const statCards = [
        { icon: 'server', color: 'primary', label: 'Nodes', value: stats.totalNodes, online: stats.onlineNodes },
        { icon: 'desktop', color: 'success', label: 'VMs', value: stats.totalVMs, online: stats.runningVMs },
        { icon: 'box', color: 'info', label: 'Containers', value: stats.totalContainers, online: stats.runningContainers },
        { icon: 'microchip', color: 'warning', label: 'CPUs', value: stats.totalCPUs, usage: Math.round(stats.cpuUsage * 100) }
      ];
      
      // Create stat card elements
      statCards.forEach(card => {
        const cardCol = document.createElement('div');
        cardCol.className = 'col-xl-3 col-md-6 mb-4';
        
        let statusInfo = '';
        if (card.online !== undefined) {
          statusInfo = `<div class="small text-muted">${card.online} online</div>`;
        } else if (card.usage !== undefined) {
          statusInfo = `<div class="small text-muted">${card.usage}% usage</div>`;
        }
        
        cardCol.innerHTML = `
          <div class="card border-left-${card.color} shadow h-100 py-2">
            <div class="card-body">
              <div class="row no-gutters align-items-center">
                <div class="col mr-2">
                  <div class="text-xs font-weight-bold text-${card.color} text-uppercase mb-1">${card.label}</div>
                  <div class="h5 mb-0 font-weight-bold text-gray-800">${card.value}</div>
                  ${statusInfo}
                </div>
                <div class="col-auto">
                  <i class="fas fa-${card.icon} fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        `;
        
        statsRow.appendChild(cardCol);
      });
      
      // Create nodes section
      const nodesSection = document.createElement('div');
      nodesSection.className = 'row mt-4';
      
      // Create nodes header
      const nodesHeader = document.createElement('div');
      nodesHeader.className = 'col-12 mb-4';
      nodesHeader.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <h4 class="mb-0">Node Status</h4>
          <a href="#" class="text-primary" data-route="nodes">View All Nodes</a>
        </div>
        <hr>
      `;
      
      nodesSection.appendChild(nodesHeader);
      
      const formatBytes = (bytes, decimals = 2) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
      };
      
      // Add node cards
      if (nodes.length > 0) {
        nodes.forEach(node => {
          // Calculate percentages
          const memoryPercent = Math.round((node.memory?.used / node.memory?.total) * 100) || 0;
          const cpuPercent = Math.round(node.cpu * 100) || 0;
          
          const nodeCol = document.createElement('div');
          nodeCol.className = 'col-xl-6 col-lg-6 mb-4';
          
          nodeCol.innerHTML = `
            <div class="card shadow h-100">
              <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
                <h6 class="m-0 font-weight-bold text-primary">
                  <span class="badge ${node.status === 'online' ? 'text-bg-success' : 'text-bg-danger'} me-2">
                    <i class="fas fa-${node.status === 'online' ? 'check-circle' : 'times-circle'}"></i>
                  </span>
                  ${node.name}
                </h6>
                <div class="dropdown no-arrow">
                  <button class="btn btn-link btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-ellipsis-v"></i>
                  </button>
                  <div class="dropdown-menu dropdown-menu-end">
                    <a class="dropdown-item" href="#" data-route="nodes" data-params='{"nodeId":"${node.id}"}'>
                      <i class="fas fa-eye me-1"></i> View Details
                    </a>
                    <a class="dropdown-item" href="#" data-action="reboot-node" data-node-id="${node.id}">
                      <i class="fas fa-sync me-1"></i> Reboot
                    </a>
                    <a class="dropdown-item" href="#" data-action="shutdown-node" data-node-id="${node.id}">
                      <i class="fas fa-power-off me-1"></i> Shutdown
                    </a>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="resource-section mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <h6 class="mb-0">
                      <i class="fas fa-microchip me-1"></i> CPU Usage
                    </h6>
                    <span class="text-${cpuPercent > 80 ? 'danger' : cpuPercent > 60 ? 'warning' : 'success'}">${cpuPercent}%</span>
                  </div>
                  <div class="progress mb-2" style="height: 10px;">
                    <div class="progress-bar ${cpuPercent > 80 ? 'bg-danger' : cpuPercent > 60 ? 'bg-warning' : 'bg-success'}" 
                         role="progressbar" 
                         style="width: ${cpuPercent}%;" 
                         aria-valuenow="${cpuPercent}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"></div>
                  </div>
                </div>
                
                <div class="resource-section mb-3">
                  <div class="d-flex justify-content-between align-items-center mb-1">
                    <h6 class="mb-0">
                      <i class="fas fa-memory me-1"></i> Memory Usage
                    </h6>
                    <div>
                      <span class="text-${memoryPercent > 80 ? 'danger' : memoryPercent > 60 ? 'warning' : 'success'}">${memoryPercent}%</span>
                      <small class="text-muted ms-2">${formatBytes(node.memory?.used)} / ${formatBytes(node.memory?.total)}</small>
                    </div>
                  </div>
                  <div class="progress mb-2" style="height: 10px;">
                    <div class="progress-bar ${memoryPercent > 80 ? 'bg-danger' : memoryPercent > 60 ? 'bg-warning' : 'bg-success'}" 
                         role="progressbar" 
                         style="width: ${memoryPercent}%;" 
                         aria-valuenow="${memoryPercent}" 
                         aria-valuemin="0" 
                         aria-valuemax="100"></div>
                  </div>
                </div>
                
                <div class="node-info mt-3">
                  <div class="row">
                    <div class="col-6">
                      <div class="mb-2">
                        <small class="text-muted">VMs:</small>
                        <span class="float-end">${node.vms || 0}</span>
                      </div>
                    </div>
                    <div class="col-6">
                      <div class="mb-2">
                        <small class="text-muted">Containers:</small>
                        <span class="float-end">${node.containers || 0}</span>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-12">
                      <div class="mb-2">
                        <small class="text-muted">IP Address:</small>
                        <span class="float-end">${node.ip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          
          nodesSection.appendChild(nodeCol);
        });
      } else {
        // No nodes
        const noNodesCol = document.createElement('div');
        noNodesCol.className = 'col-12';
        noNodesCol.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No nodes found in your Proxmox cluster. Please add a node to get started.
          </div>
        `;
        nodesSection.appendChild(noNodesCol);
      }
      
      // Create resource usage section
      const resourceSection = document.createElement('div');
      resourceSection.className = 'row mt-4';
      
      // Memory usage
      const memoryCol = document.createElement('div');
      memoryCol.className = 'col-xl-6 col-lg-6';
      
      const memoryUsed = stats.usedMemory || 0;
      const memoryTotal = stats.totalMemory || 1;
      const memoryPercent = Math.round((memoryUsed / memoryTotal) * 100) || 0;
      
      memoryCol.innerHTML = `
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 class="m-0 font-weight-bold text-primary">Cluster Memory Usage</h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-1">
              <span>${formatBytes(memoryUsed)} used of ${formatBytes(memoryTotal)}</span>
              <span class="text-${memoryPercent > 80 ? 'danger' : memoryPercent > 60 ? 'warning' : 'success'}">${memoryPercent}%</span>
            </div>
            <div class="progress mb-4" style="height: 25px;">
              <div class="progress-bar ${memoryPercent > 80 ? 'bg-danger' : memoryPercent > 60 ? 'bg-warning' : 'bg-success'}" 
                   role="progressbar" 
                   style="width: ${memoryPercent}%;" 
                   aria-valuenow="${memoryPercent}" 
                   aria-valuemin="0" 
                   aria-valuemax="100">
                ${memoryPercent}%
              </div>
            </div>
            <div class="text-center">
              <p class="text-muted mb-0">
                Free: ${formatBytes(memoryTotal - memoryUsed)}
              </p>
            </div>
          </div>
        </div>
      `;
      
      // Storage usage
      const storageCol = document.createElement('div');
      storageCol.className = 'col-xl-6 col-lg-6';
      
      const storageUsed = stats.usedStorage || 0;
      const storageTotal = stats.totalStorage || 1;
      const storagePercent = Math.round((storageUsed / storageTotal) * 100) || 0;
      
      storageCol.innerHTML = `
        <div class="card shadow mb-4">
          <div class="card-header py-3 d-flex flex-row align-items-center justify-content-between">
            <h6 class="m-0 font-weight-bold text-primary">Cluster Storage Usage</h6>
          </div>
          <div class="card-body">
            <div class="d-flex justify-content-between mb-1">
              <span>${formatBytes(storageUsed)} used of ${formatBytes(storageTotal)}</span>
              <span class="text-${storagePercent > 80 ? 'danger' : storagePercent > 60 ? 'warning' : 'success'}">${storagePercent}%</span>
            </div>
            <div class="progress mb-4" style="height: 25px;">
              <div class="progress-bar ${storagePercent > 80 ? 'bg-danger' : storagePercent > 60 ? 'bg-warning' : 'bg-success'}" 
                   role="progressbar" 
                   style="width: ${storagePercent}%;" 
                   aria-valuenow="${storagePercent}" 
                   aria-valuemin="0" 
                   aria-valuemax="100">
                ${storagePercent}%
              </div>
            </div>
            <div class="text-center">
              <p class="text-muted mb-0">
                Free: ${formatBytes(storageTotal - storageUsed)}
              </p>
            </div>
          </div>
        </div>
      `;
      
      // Add elements to dashboard
      dashboardContent.appendChild(header);
      dashboardContent.appendChild(statsRow);
      dashboardContent.appendChild(nodesSection);
      dashboardContent.appendChild(resourceSection);
      
      // Create connection warning if needed
      if (stats.onlineNodes === 0 && stats.totalNodes > 0) {
        const warningRow = document.createElement('div');
        warningRow.className = 'row mt-4';
        warningRow.innerHTML = `
          <div class="col-12">
            <div class="alert alert-warning">
              <h5><i class="fas fa-exclamation-triangle me-2"></i> Connection Issues Detected</h5>
              <p>We're having trouble connecting to your Proxmox server. This could be due to:</p>
              <ul>
                <li>Incorrect credentials</li>
                <li>The server might be offline</li>
                <li>SSL/TLS certificate issues</li>
                <li>Proxmox API requiring a token instead of password</li>
              </ul>
              <button class="btn btn-outline-dark" data-action="api-token">Try using API Token</button>
            </div>
          </div>
        `;
        dashboardContent.appendChild(warningRow);
      }
      
      // Add last updated info
      const lastUpdatedRow = document.createElement('div');
      lastUpdatedRow.className = 'row mt-4';
      lastUpdatedRow.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-muted small mb-0">
            Last updated: ${new Date(data.lastUpdated || Date.now()).toLocaleString()}
          </p>
        </div>
      `;
      dashboardContent.appendChild(lastUpdatedRow);
      
      // Add event listener for refresh button
      document.addEventListener('DOMContentLoaded', () => {
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', async () => {
            ui.showLoading('Refreshing dashboard data...');
            try {
              await app.refreshDashboard();
              // Force re-render of the dashboard
              app.router.navigate('dashboard');
              ui.showSuccess('Dashboard refreshed');
            } catch (error) {
              ui.showError(`Failed to refresh dashboard: ${error.message}`);
            } finally {
              ui.hideLoading();
            }
          });
        }
      });
    } else {
      // No data available
      dashboardContent.innerHTML = `
        <div class="text-center py-5">
          <i class="fas fa-database fa-3x text-muted mb-3"></i>
          <h3>No Data Available</h3>
          <p class="text-muted">Unable to retrieve data from Proxmox API</p>
          <button id="setup-api-token" class="btn btn-primary mt-3" data-action="api-token">
            <i class="fas fa-key me-2"></i> Configure API Token
          </button>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error rendering dashboard content:', error);
    
    dashboardContent.innerHTML = `
      <div class="alert alert-danger">
        <h5>Error Loading Dashboard</h5>
        <p>${error.message}</p>
      </div>
    `;
  }
  
  // Create sidebar footer
  const sidebarFooter = document.createElement('div');
  sidebarFooter.className = 'sidebar-footer';
  
  // Add user info if available
  let userInfo = '';
  if (app.user) {
    userInfo = `
      <div class="small mb-2">
        <strong>${app.user.username}</strong>
        <span class="text-muted">(${app.user.role})</span>
      </div>
    `;
  }
  
  sidebarFooter.innerHTML = `
    ${userInfo}
    <button class="btn btn-outline-light btn-sm w-100" data-action="logout">
      <i class="fas fa-sign-out-alt me-2"></i> Logout
    </button>
  `;
  
  // Assemble sidebar
  sidebar.appendChild(sidebarHeader);
  sidebarContent.appendChild(nav);
  sidebar.appendChild(sidebarContent);
  sidebar.appendChild(sidebarFooter);
  
  // Assemble view
  content.appendChild(dashboardContent);
  container.appendChild(sidebar);
  container.appendChild(content);
  
  // Refresh dashboard data
  app.refreshDashboard().catch(error => {
    console.error('Error refreshing dashboard data:', error);
  });
  
  return container;
}