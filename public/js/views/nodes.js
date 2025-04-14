/**
 * Nodes View
 */
export function renderNodesView(app) {
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
      <a class="nav-link ${item.route === 'nodes' ? 'active' : ''}" href="#" data-route="${item.route}">
        <i class="fas fa-${item.icon} mr-2"></i>
        <span>${item.label}</span>
      </a>
    `;
    
    nav.appendChild(li);
  });
  
  // Create main content
  const content = document.createElement('div');
  content.className = 'content';
  
  // Create nodes content
  const nodesContent = document.createElement('div');
  nodesContent.className = 'nodes-content container-fluid py-3';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'row mb-4';
  header.innerHTML = `
    <div class="col-12 d-flex justify-content-between align-items-center">
      <div>
        <h1 class="h3 mb-2 text-gray-800">Nodes</h1>
        <p class="mb-4">Manage your Proxmox cluster nodes</p>
      </div>
      <div>
        <button class="btn btn-primary" id="add-node-btn">
          <i class="fas fa-plus-circle me-2"></i> Add Node
        </button>
        <button class="btn btn-outline-secondary ms-2" id="refresh-nodes-btn">
          <i class="fas fa-sync-alt me-2"></i> Refresh
        </button>
      </div>
    </div>
  `;
  
  // Get nodes from dashboard state
  const data = dashboardState.getData();
  const { nodes = [] } = data?.cluster || {};
  
  // Create nodes table
  const tableContainer = document.createElement('div');
  tableContainer.className = 'card shadow mb-4';
  
  if (nodes.length > 0) {
    // Format bytes function
    const formatBytes = (bytes, decimals = 2) => {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
      
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    };
    
    // Format uptime function
    const formatUptime = (uptime) => {
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      
      return `${days}d ${hours}h ${minutes}m`;
    };
    
    tableContainer.innerHTML = `
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Proxmox Nodes</h6>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-bordered table-hover" id="nodes-table" width="100%" cellspacing="0">
            <thead>
              <tr>
                <th>Status</th>
                <th>Name</th>
                <th>IP Address</th>
                <th>Uptime</th>
                <th>CPU Usage</th>
                <th>Memory Usage</th>
                <th>VMs</th>
                <th>Containers</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${nodes.map(node => {
                // Calculate memory percentage
                const memoryPercent = Math.round((node.memory?.used / node.memory?.total) * 100) || 0;
                // Calculate CPU percentage (already in decimal form)
                const cpuPercent = Math.round(node.cpu * 100) || 0;
                
                return `
                  <tr>
                    <td>
                      <span class="badge ${node.status === 'online' ? 'text-bg-success' : 'text-bg-danger'}">
                        <i class="fas fa-${node.status === 'online' ? 'check-circle' : 'times-circle'} me-1"></i>
                        ${node.status}
                      </span>
                    </td>
                    <td><strong>${node.name}</strong></td>
                    <td>${node.ip}</td>
                    <td>${formatUptime(node.uptime)}</td>
                    <td>
                      <div class="progress" style="height: 20px;" title="${cpuPercent}% used">
                        <div class="progress-bar ${cpuPercent > 80 ? 'bg-danger' : cpuPercent > 60 ? 'bg-warning' : 'bg-success'}" 
                             role="progressbar" 
                             style="width: ${cpuPercent}%;" 
                             aria-valuenow="${cpuPercent}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                          ${cpuPercent}%
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex justify-content-between mb-1">
                        <small>${formatBytes(node.memory?.used)} / ${formatBytes(node.memory?.total)}</small>
                        <small>${memoryPercent}%</small>
                      </div>
                      <div class="progress" style="height: 20px;" title="${memoryPercent}% used">
                        <div class="progress-bar ${memoryPercent > 80 ? 'bg-danger' : memoryPercent > 60 ? 'bg-warning' : 'bg-success'}" 
                             role="progressbar" 
                             style="width: ${memoryPercent}%;" 
                             aria-valuenow="${memoryPercent}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                          ${memoryPercent}%
                        </div>
                      </div>
                    </td>
                    <td>${node.vms || 0}</td>
                    <td>${node.containers || 0}</td>
                    <td>
                      <div class="btn-group" role="group">
                        <button type="button" class="btn btn-sm btn-outline-primary" data-action="view-node" data-node-id="${node.id}">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-action="edit-node" data-node-id="${node.id}">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-action="delete-node" data-node-id="${node.id}">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    // No nodes
    tableContainer.innerHTML = `
      <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Proxmox Nodes</h6>
      </div>
      <div class="card-body text-center py-5">
        <i class="fas fa-server fa-3x text-muted mb-3"></i>
        <h5>No Nodes Found</h5>
        <p class="text-muted mb-3">You haven't added any Proxmox nodes yet.</p>
        <button class="btn btn-primary" id="add-first-node-btn">
          <i class="fas fa-plus-circle me-2"></i> Add Your First Node
        </button>
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
  
  // Add event listeners
  document.addEventListener('DOMContentLoaded', () => {
    // Refresh nodes button
    const refreshBtn = document.getElementById('refresh-nodes-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        ui.showLoading('Refreshing nodes...');
        try {
          await app.refreshDashboard();
          // Force re-render of the nodes view
          app.router.navigate('nodes');
          ui.showSuccess('Nodes refreshed');
        } catch (error) {
          ui.showError(`Failed to refresh nodes: ${error.message}`);
        } finally {
          ui.hideLoading();
        }
      });
    }
    
    // Add node button
    const addNodeBtn = document.getElementById('add-node-btn');
    if (addNodeBtn) {
      addNodeBtn.addEventListener('click', () => {
        // Show add node modal or navigate to add node view
        ui.showInfo('Add node feature coming soon');
      });
    }
    
    // Add first node button (if nodes list is empty)
    const addFirstNodeBtn = document.getElementById('add-first-node-btn');
    if (addFirstNodeBtn) {
      addFirstNodeBtn.addEventListener('click', () => {
        // Show add node modal or navigate to add node view
        ui.showInfo('Add node feature coming soon');
      });
    }
  });
  
  // Assemble sidebar
  sidebar.appendChild(sidebarHeader);
  sidebarContent.appendChild(nav);
  sidebar.appendChild(sidebarContent);
  sidebar.appendChild(sidebarFooter);
  
  // Assemble view
  nodesContent.appendChild(header);
  nodesContent.appendChild(tableContainer);
  content.appendChild(nodesContent);
  container.appendChild(sidebar);
  container.appendChild(content);
  
  return container;
}