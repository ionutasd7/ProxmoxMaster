document.addEventListener('DOMContentLoaded', () => {
  console.log('Proxmox Manager client loaded');
  
  // Application state
  let appState = {
    currentView: 'login',
    authData: null,
    nodes: [],
    selectedNode: null,
    vms: [],
    containers: []
  };
  
  // ===== UTILITY FUNCTIONS =====
  
  // Display a notification message
  function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.classList.add('notification-hide');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  // Format bytes to human-readable format
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
  
  // Make API request
  async function fetchData(endpoint) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      showNotification(`Failed to fetch data: ${error.message}`, 'error');
      return null;
    }
  }
  
  // Post data to API
  async function postData(endpoint, data) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error posting data to ${endpoint}:`, error);
      showNotification(`Failed to submit data: ${error.message}`, 'error');
      return null;
    }
  }
  
  // ===== VIEW RENDERING FUNCTIONS =====
  
  // Display login screen
  function displayLogin(errorMessage = null) {
    appState.currentView = 'login';
    
    const mainContainer = document.getElementById('app-container');
    mainContainer.innerHTML = `
      <div class="login-container">
        <div class="login-header">
          <h1><i class="fas fa-server me-2"></i>Proxmox Manager</h1>
          <p class="text-white-50">Advanced Infrastructure Management</p>
        </div>
        
        <form id="login-form">
          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <input type="text" class="form-control" id="username" placeholder="Enter username" value="admin" required>
          </div>
          
          <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password" placeholder="Enter password" value="admin" required>
          </div>
          
          ${errorMessage ? `<div class="error-message mb-3">${errorMessage}</div>` : ''}
          
          <div class="d-grid">
            <button type="submit" class="btn btn-login">
              <span id="login-text">Login</span>
              <span id="loading-indicator" style="display: none;">
                <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                Logging in...
              </span>
            </button>
          </div>
        </form>
      </div>
    `;
    
    // Add login form submission handler
    document.getElementById('login-form').addEventListener('submit', handleLogin);
  }
  
  // Handle login form submission
  async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Show loading indicator
    document.getElementById('login-text').style.display = 'none';
    document.getElementById('loading-indicator').style.display = 'inline-block';
    
    // Hardcoded auth for demo purposes - would be replaced with API call in production
    if (username === 'admin' && password === 'admin') {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      appState.authData = {
        username: username,
        role: 'admin',
        timestamp: new Date().getTime()
      };
      
      // Display dashboard
      loadApplicationData();
    } else {
      // Reset loading state
      document.getElementById('login-text').style.display = 'inline-block';
      document.getElementById('loading-indicator').style.display = 'none';
      
      // Display error
      displayLogin('Invalid username or password. Try admin/admin.');
    }
  }
  
  // Load application data after login
  async function loadApplicationData() {
    displayLoading('Loading infrastructure data...');
    
    // Fetch nodes data
    const nodesResponse = await fetchData('/api/nodes');
    if (nodesResponse && nodesResponse.success) {
      appState.nodes = nodesResponse.nodes || [];
    }
    
    // If no nodes, display empty dashboard, otherwise load data for the first node
    if (appState.nodes.length === 0) {
      displayDashboard();
    } else {
      appState.selectedNode = appState.nodes[0];
      
      // Fetch VMs and containers data
      const [vmsResponse, containersResponse] = await Promise.all([
        fetchData('/api/vms'),
        fetchData('/api/containers')
      ]);
      
      if (vmsResponse && vmsResponse.success) {
        appState.vms = vmsResponse.vms || [];
      }
      
      if (containersResponse && containersResponse.success) {
        appState.containers = containersResponse.containers || [];
      }
      
      displayDashboard();
    }
  }
  
  // Display loading screen
  function displayLoading(message) {
    const mainContainer = document.getElementById('app-container');
    mainContainer.innerHTML = `
      <div class="loading-container">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h4 class="mt-3">${message}</h4>
      </div>
    `;
  }
  
  // Display main dashboard
  function displayDashboard() {
    appState.currentView = 'dashboard';
    
    const mainContainer = document.getElementById('app-container');
    mainContainer.innerHTML = `
      <div class="dashboard-container">
        <nav class="sidebar">
          <div class="sidebar-header">
            <h2><i class="fas fa-server me-2"></i>Proxmox</h2>
            <p>Manager</p>
          </div>
          
          <ul class="sidebar-menu">
            <li class="sidebar-item active" data-view="dashboard">
              <i class="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </li>
            <li class="sidebar-item" data-view="nodes">
              <i class="fas fa-network-wired"></i>
              <span>Nodes</span>
            </li>
            <li class="sidebar-item" data-view="vms">
              <i class="fas fa-desktop"></i>
              <span>Virtual Machines</span>
            </li>
            <li class="sidebar-item" data-view="containers">
              <i class="fas fa-cube"></i>
              <span>LXC Containers</span>
            </li>
            <li class="sidebar-item" data-view="storage">
              <i class="fas fa-hdd"></i>
              <span>Storage</span>
            </li>
            <li class="sidebar-item" data-view="network">
              <i class="fas fa-project-diagram"></i>
              <span>Network</span>
            </li>
            <li class="sidebar-item" data-view="updates">
              <i class="fas fa-sync"></i>
              <span>Updates</span>
            </li>
            <li class="sidebar-item" data-view="users">
              <i class="fas fa-users"></i>
              <span>Users</span>
            </li>
            <li class="sidebar-item" data-view="settings">
              <i class="fas fa-cog"></i>
              <span>Settings</span>
            </li>
          </ul>
          
          <div class="sidebar-footer">
            <div class="user-info">
              <i class="fas fa-user-circle"></i>
              <span>${appState.authData.username}</span>
            </div>
            <button id="logout-btn">
              <i class="fas fa-sign-out-alt"></i>
            </button>
          </div>
        </nav>
        
        <main class="content">
          <header class="content-header">
            <div class="header-left">
              <button id="sidebar-toggle">
                <i class="fas fa-bars"></i>
              </button>
              <h2 id="view-title">Dashboard</h2>
            </div>
            
            <div class="header-right">
              <div class="node-selector">
                <label for="node-select">Node:</label>
                <select id="node-select" class="form-select form-select-sm">
                  ${appState.nodes.length > 0 ? 
                    appState.nodes.map(node => `
                      <option value="${node.id}" ${node.id === appState.selectedNode?.id ? 'selected' : ''}>
                        ${node.name || node.hostname}
                      </option>
                    `).join('') : 
                    '<option value="">No nodes available</option>'
                  }
                </select>
              </div>
              
              <button id="refresh-btn" class="btn btn-sm btn-primary">
                <i class="fas fa-sync"></i>
              </button>
            </div>
          </header>
          
          <div id="main-content">
            <!-- Main content will be loaded here -->
            <div class="dashboard-overview">
              <div class="row">
                <div class="col-md-4 mb-4">
                  <div class="card glow-border">
                    <div class="card-body">
                      <h5><i class="fas fa-server me-2"></i> Nodes</h5>
                      <h2>${appState.nodes.length}</h2>
                      <p>${appState.nodes.length === 0 ? 'No nodes configured' : 
                          appState.nodes.length === 1 ? '1 node configured' : 
                          `${appState.nodes.length} nodes configured`}</p>
                      <button class="btn btn-sm btn-primary" id="add-node-btn">Add Node</button>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4 mb-4">
                  <div class="card glow-border">
                    <div class="card-body">
                      <h5><i class="fas fa-desktop me-2"></i> VMs</h5>
                      <h2>${appState.vms.length}</h2>
                      <p>${appState.vms.length === 0 ? 'No VMs configured' : 
                          appState.vms.length === 1 ? '1 VM configured' : 
                          `${appState.vms.length} VMs configured`}</p>
                      <button class="btn btn-sm btn-primary" id="add-vm-btn">Create VM</button>
                    </div>
                  </div>
                </div>
                
                <div class="col-md-4 mb-4">
                  <div class="card glow-border">
                    <div class="card-body">
                      <h5><i class="fas fa-cube me-2"></i> Containers</h5>
                      <h2>${appState.containers.length}</h2>
                      <p>${appState.containers.length === 0 ? 'No containers configured' : 
                          appState.containers.length === 1 ? '1 container configured' : 
                          `${appState.containers.length} containers configured`}</p>
                      <button class="btn btn-sm btn-primary" id="add-container-btn">Create Container</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Node Overview Section -->
              <div class="card glow-border mb-4">
                <div class="card-header">
                  <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i> Infrastructure Overview</h5>
                </div>
                <div class="card-body">
                  ${appState.nodes.length === 0 ? `
                    <div class="text-center py-5">
                      <i class="fas fa-server fa-3x mb-3"></i>
                      <h4>No Proxmox nodes configured</h4>
                      <p class="text-muted">Add a node to start managing your infrastructure</p>
                      <button class="btn btn-primary mt-2" id="add-first-node-btn">
                        <i class="fas fa-plus me-2"></i> Add Your First Node
                      </button>
                    </div>
                  ` : `
                    <div class="row">
                      <div class="col-md-6">
                        <h6 class="mb-3">Node Status</h6>
                        <div class="table-responsive">
                          <table class="table table-dark table-hover">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Status</th>
                                <th>CPU Usage</th>
                                <th>Memory</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${appState.nodes.map(node => `
                                <tr>
                                  <td>${node.name || node.hostname}</td>
                                  <td><span class="badge bg-success">Online</span></td>
                                  <td>
                                    <div class="progress">
                                      <div class="progress-bar" style="width: 25%"></div>
                                    </div>
                                  </td>
                                  <td>
                                    <div class="progress">
                                      <div class="progress-bar" style="width: 40%"></div>
                                    </div>
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <h6 class="mb-3">Storage Usage</h6>
                        <!-- Simple storage graphs would go here -->
                        <div class="storage-chart">
                          <div class="storage-item">
                            <div class="storage-label">local</div>
                            <div class="progress">
                              <div class="progress-bar bg-info" style="width: 30%"></div>
                            </div>
                            <div class="storage-info">30% used</div>
                          </div>
                          <div class="storage-item">
                            <div class="storage-label">storage-1</div>
                            <div class="progress">
                              <div class="progress-bar bg-info" style="width: 55%"></div>
                            </div>
                            <div class="storage-info">55% used</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  `}
                </div>
              </div>
              
              <!-- Recent activity -->
              <div class="card glow-border">
                <div class="card-header">
                  <h5 class="mb-0"><i class="fas fa-history me-2"></i> Recent Activity</h5>
                </div>
                <div class="card-body">
                  <div class="recent-activity">
                    <div class="recent-activity-item">
                      <div class="activity-time">Now</div>
                      <div class="activity-content">
                        <i class="fas fa-user text-primary"></i>
                        <span>User <strong>${appState.authData.username}</strong> logged in</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    `;
    
    // Add event listeners for navigation
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', handleNavigation);
    });
    
    // Add node button handlers
    const addNodeBtns = document.querySelectorAll('#add-node-btn, #add-first-node-btn');
    addNodeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        loadNodesOverview();
        showNodeAddModal();
      });
    });
    
    // Add VM and container button handlers
    document.getElementById('add-vm-btn')?.addEventListener('click', () => {
      loadVMCreateView();
    });
    
    document.getElementById('add-container-btn')?.addEventListener('click', () => {
      loadLXCCreateView();
    });
    
    // Add logout button handler
    document.getElementById('logout-btn').addEventListener('click', () => {
      appState = {
        currentView: 'login',
        authData: null,
        nodes: [],
        selectedNode: null,
        vms: [],
        containers: []
      };
      displayLogin();
    });
    
    // Add node selector handler
    document.getElementById('node-select')?.addEventListener('change', (e) => {
      const selectedNodeId = parseInt(e.target.value);
      appState.selectedNode = appState.nodes.find(node => node.id === selectedNodeId);
      
      // Reload current view with new selected node
      if (appState.currentView === 'dashboard') {
        displayDashboard();
      } else if (appState.currentView === 'vms') {
        loadVMListView();
      } else if (appState.currentView === 'containers') {
        loadLXCListView();
      }
    });
    
    // Add refresh button handler
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      loadApplicationData();
    });
  }
  
  // Function to handle navigation
  function handleNavigation(e) {
    const view = e.currentTarget.dataset.view;
    
    // Remove active class from all items
    document.querySelectorAll('.sidebar-item').forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to clicked item
    e.currentTarget.classList.add('active');
    
    // Load the selected view
    loadView(view);
  }
  
  // Function to load different views
  function loadView(view) {
    document.getElementById('view-title').textContent = view.charAt(0).toUpperCase() + view.slice(1);
    appState.currentView = view;
    
    switch (view) {
      case 'dashboard':
        displayDashboard();
        break;
      case 'nodes':
        loadNodesOverview();
        break;
      case 'vms':
        loadVMListView();
        break;
      case 'containers':
        loadLXCListView();
        break;
      case 'storage':
        loadStorageView();
        break;
      case 'network':
        loadNetworkView();
        break;
      case 'updates':
        loadUpdatesView();
        break;
      case 'users':
        loadUserManagementView();
        break;
      case 'settings':
        loadSettingsView();
        break;
      default:
        displayDashboard();
    }
  }
  
  // Common header for views
  function getCommonHeader(title) {
    return `
      <h1 class="mb-4"><i class="fas fa-${
        title === 'Nodes Overview' ? 'network-wired' :
        title === 'Virtual Machines' ? 'desktop' :
        title === 'LXC Containers' ? 'cube' :
        title === 'Storage' ? 'hdd' :
        title === 'Network' ? 'project-diagram' :
        title === 'Updates' ? 'sync' :
        title === 'User Management' ? 'users-cog' :
        title === 'Settings' ? 'cog' :
        'info'
      } me-2"></i> ${title}</h1>
    `;
  }
  
  // Function to load the Nodes Overview
  function loadNodesOverview() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Nodes Overview')}
      
      <div class="d-flex justify-content-between mb-4">
        <div class="d-flex">
          <div class="input-group me-2">
            <span class="input-group-text"><i class="fas fa-search"></i></span>
            <input type="text" class="form-control" placeholder="Search nodes...">
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-secondary">
              <i class="fas fa-filter me-1"></i> Filter
            </button>
          </div>
        </div>
        <button class="btn btn-primary" id="add-node-btn">
          <i class="fas fa-plus me-1"></i> Add Node
        </button>
      </div>
      
      <div class="card glow-border">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-server me-2"></i> PROXMOX NODES</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Hostname</th>
                  <th>Status</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Uptime</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="nodes-table">
                ${appState.nodes.length === 0 ? `
                  <tr>
                    <td colspan="7" class="text-center">
                      <div class="py-4">
                        <i class="fas fa-info-circle me-2"></i> No nodes configured yet
                      </div>
                    </td>
                  </tr>
                ` : appState.nodes.map(node => `
                  <tr>
                    <td>
                      <strong>${node.name || node.hostname}</strong>
                    </td>
                    <td>${node.hostname}:${node.port || 8006}</td>
                    <td>
                      <span class="badge ${node.node_status === 'connected' ? 'bg-success' : 'bg-danger'}">
                        ${node.node_status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </td>
                    <td>
                      <div class="progress">
                        <div class="progress-bar" style="width: 25%"></div>
                      </div>
                    </td>
                    <td>
                      <div class="progress">
                        <div class="progress-bar" style="width: 40%"></div>
                      </div>
                    </td>
                    <td>12h 30m</td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-info" data-action="view" data-node-id="${node.id}">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-outline-primary" data-action="edit" data-node-id="${node.id}">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-outline-danger" data-action="delete" data-node-id="${node.id}">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <!-- Node Add Modal -->
      <div class="modal fade" id="nodeAddModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header">
              <h5 class="modal-title"><i class="fas fa-plus-circle me-2"></i> Add Proxmox Node</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="add-node-form">
                <div class="mb-3">
                  <label for="node-name" class="form-label">Node Name</label>
                  <input type="text" class="form-control" id="node-name" placeholder="My Proxmox Node">
                  <div class="form-text text-muted">A friendly name for this node</div>
                </div>
                
                <div class="mb-3">
                  <label for="node-hostname" class="form-label">Hostname</label>
                  <input type="text" class="form-control" id="node-hostname" placeholder="proxmox.example.com" required>
                  <div class="form-text text-muted">Hostname or IP address of the Proxmox node</div>
                </div>
                
                <div class="mb-3">
                  <label for="node-port" class="form-label">Port</label>
                  <input type="number" class="form-control" id="node-port" value="8006" required>
                  <div class="form-text text-muted">API port (default: 8006)</div>
                </div>
                
                <div class="mb-3">
                  <label for="node-username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="node-username" placeholder="root@pam" required>
                  <div class="form-text text-muted">Username with API access (e.g., root@pam)</div>
                </div>
                
                <div class="mb-3">
                  <label for="node-password" class="form-label">Password</label>
                  <input type="password" class="form-control" id="node-password" required>
                </div>
                
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="node-ssl-verify">
                  <label class="form-check-label" for="node-ssl-verify">Verify SSL Certificate</label>
                </div>
                
                <div class="d-flex justify-content-between">
                  <button type="button" class="btn btn-outline-secondary" id="test-connection-btn">
                    <i class="fas fa-plug me-2"></i> Test Connection
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus me-2"></i> Add Node
                  </button>
                </div>
                
                <div id="connection-test-results" class="mt-3 d-none">
                  <!-- Connection test results will be shown here -->
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for Add Node button
    document.getElementById('add-node-btn').addEventListener('click', showNodeAddModal);
    
    // Add event listeners for node actions
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', handleNodeAction);
    });
    
    // Add event listener for node add form
    document.getElementById('add-node-form')?.addEventListener('submit', handleAddNode);
    
    // Add event listener for test connection button
    document.getElementById('test-connection-btn')?.addEventListener('click', handleTestConnection);
  }
  
  // Show node add modal
  function showNodeAddModal() {
    // For simplicity, manually create the modal (in a real app, would use Bootstrap's modal API)
    const modal = document.getElementById('nodeAddModal');
    if (modal) {
      modal.classList.add('show');
      modal.style.display = 'block';
      document.body.classList.add('modal-open');
      
      // Add backdrop
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop fade show';
      document.body.appendChild(backdrop);
      
      // Add close button handler
      const closeBtn = modal.querySelector('.btn-close');
      closeBtn.addEventListener('click', closeNodeAddModal);
    }
  }
  
  // Close node add modal
  function closeNodeAddModal() {
    const modal = document.getElementById('nodeAddModal');
    if (modal) {
      modal.classList.remove('show');
      modal.style.display = 'none';
      document.body.classList.remove('modal-open');
      
      // Remove backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  }
  
  // Handle test connection button click
  async function handleTestConnection() {
    const hostname = document.getElementById('node-hostname').value;
    const port = document.getElementById('node-port').value;
    const username = document.getElementById('node-username').value;
    const password = document.getElementById('node-password').value;
    const sslVerify = document.getElementById('node-ssl-verify').checked;
    
    if (!hostname || !username || !password) {
      showNotification('Please fill in the hostname, username, and password fields', 'error');
      return;
    }
    
    const testButton = document.getElementById('test-connection-btn');
    const originalButtonText = testButton.innerHTML;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Testing...';
    testButton.disabled = true;
    
    const resultsDiv = document.getElementById('connection-test-results');
    resultsDiv.className = 'mt-3';
    resultsDiv.innerHTML = `
      <div class="card bg-dark">
        <div class="card-body">
          <h6><i class="fas fa-spinner fa-spin me-2"></i> Testing connection to ${hostname}:${port}</h6>
          <div class="progress mt-2">
            <div class="progress-bar progress-bar-striped progress-bar-animated" style="width: 100%"></div>
          </div>
        </div>
      </div>
    `;
    
    try {
      const response = await postData('/api/nodes/test-connection', {
        hostname,
        port,
        username,
        password,
        ssl_verify: sslVerify
      });
      
      if (response.success && response.connected) {
        resultsDiv.innerHTML = `
          <div class="card bg-success bg-opacity-25 border-success">
            <div class="card-body">
              <h6><i class="fas fa-check-circle me-2"></i> Connection Successful</h6>
              <p class="mb-0 small">Successfully connected to Proxmox API on ${hostname}:${port}</p>
              <ul class="list-unstyled small mt-2 mb-0">
                <li><strong>Version:</strong> ${response.version}</li>
                <li><strong>Release:</strong> ${response.release}</li>
                <li><strong>API Version:</strong> ${response.apiVersion}</li>
              </ul>
            </div>
          </div>
        `;
      } else {
        resultsDiv.innerHTML = `
          <div class="card bg-danger bg-opacity-25 border-danger">
            <div class="card-body">
              <h6><i class="fas fa-times-circle me-2"></i> Connection Failed</h6>
              <p class="mb-0 small">${response.message || 'Could not connect to Proxmox API'}</p>
            </div>
          </div>
        `;
      }
    } catch (error) {
      resultsDiv.innerHTML = `
        <div class="card bg-danger bg-opacity-25 border-danger">
          <div class="card-body">
            <h6><i class="fas fa-times-circle me-2"></i> Connection Failed</h6>
            <p class="mb-0 small">Error: ${error.message}</p>
          </div>
        </div>
      `;
    } finally {
      testButton.innerHTML = originalButtonText;
      testButton.disabled = false;
    }
  }
  
  // Handle adding a new node
  async function handleAddNode(e) {
    e.preventDefault();
    
    const name = document.getElementById('node-name').value;
    const hostname = document.getElementById('node-hostname').value;
    const port = document.getElementById('node-port').value;
    const username = document.getElementById('node-username').value;
    const password = document.getElementById('node-password').value;
    const sslVerify = document.getElementById('node-ssl-verify').checked;
    
    if (!hostname || !username || !password) {
      showNotification('Please fill in the hostname, username, and password fields', 'error');
      return;
    }
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.innerHTML;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Adding...';
    submitButton.disabled = true;
    
    try {
      const response = await postData('/api/nodes', {
        name,
        hostname,
        port,
        username,
        password,
        ssl_verify: sslVerify
      });
      
      if (response.success) {
        showNotification(`Node ${name || hostname} added successfully`, 'success');
        appState.nodes.push(response.node);
        closeNodeAddModal();
        refreshNodesTable();
      } else {
        showNotification(`Failed to add node: ${response.error}`, 'error');
      }
    } catch (error) {
      showNotification(`Error adding node: ${error.message}`, 'error');
    } finally {
      submitButton.innerHTML = originalButtonText;
      submitButton.disabled = false;
    }
  }
  
  // Refresh the nodes table
  function refreshNodesTable() {
    const nodesTable = document.getElementById('nodes-table');
    if (nodesTable) {
      nodesTable.innerHTML = appState.nodes.length === 0 ? `
        <tr>
          <td colspan="7" class="text-center">
            <div class="py-4">
              <i class="fas fa-info-circle me-2"></i> No nodes configured yet
            </div>
          </td>
        </tr>
      ` : appState.nodes.map(node => `
        <tr>
          <td>
            <strong>${node.name || node.hostname}</strong>
          </td>
          <td>${node.hostname}:${node.port || 8006}</td>
          <td>
            <span class="badge ${node.node_status === 'connected' ? 'bg-success' : 'bg-danger'}">
              ${node.node_status === 'connected' ? 'Connected' : 'Disconnected'}
            </span>
          </td>
          <td>
            <div class="progress">
              <div class="progress-bar" style="width: 25%"></div>
            </div>
          </td>
          <td>
            <div class="progress">
              <div class="progress-bar" style="width: 40%"></div>
            </div>
          </td>
          <td>12h 30m</td>
          <td>
            <div class="btn-group btn-group-sm">
              <button class="btn btn-outline-info" data-action="view" data-node-id="${node.id}">
                <i class="fas fa-eye"></i>
              </button>
              <button class="btn btn-outline-primary" data-action="edit" data-node-id="${node.id}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-outline-danger" data-action="delete" data-node-id="${node.id}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      // Re-attach event listeners for node actions
      document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', handleNodeAction);
      });
    }
  }
  
  // Handle node action button clicks
  async function handleNodeAction(e) {
    const action = e.currentTarget.dataset.action;
    const nodeId = parseInt(e.currentTarget.dataset.nodeId);
    const node = appState.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      showNotification('Node not found', 'error');
      return;
    }
    
    switch (action) {
      case 'view':
        appState.selectedNode = node;
        document.getElementById('node-select').value = nodeId;
        loadView('dashboard');
        break;
      case 'edit':
        showNotification('Edit node functionality will be implemented in the next version', 'info');
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete node "${node.name || node.hostname}"?`)) {
          try {
            const response = await fetch(`/api/nodes/${nodeId}`, {
              method: 'DELETE'
            });
            
            if (response.ok) {
              showNotification(`Node ${node.name || node.hostname} deleted successfully`, 'success');
              appState.nodes = appState.nodes.filter(n => n.id !== nodeId);
              refreshNodesTable();
              
              // If deleted node was selected, select first available node or null
              if (appState.selectedNode && appState.selectedNode.id === nodeId) {
                appState.selectedNode = appState.nodes.length > 0 ? appState.nodes[0] : null;
              }
            } else {
              const errorData = await response.json();
              showNotification(`Failed to delete node: ${errorData.error}`, 'error');
            }
          } catch (error) {
            showNotification(`Error deleting node: ${error.message}`, 'error');
          }
        }
        break;
    }
  }
  
  // Function to load the VM List View
  function loadVMListView() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Virtual Machines')}
      
      <div class="d-flex justify-content-between mb-4">
        <div class="d-flex">
          <div class="input-group me-2">
            <span class="input-group-text"><i class="fas fa-search"></i></span>
            <input type="text" class="form-control" placeholder="Search VMs...">
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-secondary">
              <i class="fas fa-filter me-1"></i> Filter
            </button>
          </div>
        </div>
        <button class="btn btn-primary" id="create-vm-btn">
          <i class="fas fa-plus me-1"></i> Create VM
        </button>
      </div>
      
      <div class="card glow-border">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-desktop me-2"></i> VIRTUAL MACHINES</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Node</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Disk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="vms-table">
                ${appState.vms.length === 0 ? `
                  <tr>
                    <td colspan="8" class="text-center">
                      <div class="py-4">
                        <i class="fas fa-info-circle me-2"></i> No virtual machines found
                      </div>
                    </td>
                  </tr>
                ` : appState.vms.map(vm => `
                  <tr>
                    <td>${vm.id}</td>
                    <td>
                      <strong>${vm.name}</strong>
                    </td>
                    <td>
                      <span class="badge ${vm.status === 'running' ? 'bg-success' : 'bg-secondary'}">
                        ${vm.status === 'running' ? 'Running' : 'Stopped'}
                      </span>
                    </td>
                    <td>${vm.node}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2">
                          <div class="progress-bar" style="width: ${vm.cpu.usage * 100}%"></div>
                        </div>
                        <span class="small">${vm.cpu.cores} vCPU</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2">
                          <div class="progress-bar" style="width: ${(vm.memory.used / vm.memory.total) * 100}%"></div>
                        </div>
                        <span class="small">${Math.round(vm.memory.used)}/${Math.round(vm.memory.total)} MB</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2">
                          <div class="progress-bar" style="width: ${(vm.disk.used / vm.disk.total) * 100}%"></div>
                        </div>
                        <span class="small">${Math.round(vm.disk.used)}/${Math.round(vm.disk.total)} GB</span>
                      </div>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-success" data-vm-action="start" data-vm-id="${vm.id}" ${vm.status === 'running' ? 'disabled' : ''}>
                          <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-outline-warning" data-vm-action="stop" data-vm-id="${vm.id}" ${vm.status !== 'running' ? 'disabled' : ''}>
                          <i class="fas fa-stop"></i>
                        </button>
                        <button class="btn btn-outline-primary" data-vm-action="console" data-vm-id="${vm.id}">
                          <i class="fas fa-desktop"></i>
                        </button>
                        <button class="btn btn-outline-danger" data-vm-action="delete" data-vm-id="${vm.id}">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for Create VM button
    document.getElementById('create-vm-btn')?.addEventListener('click', () => {
      loadVMCreateView();
    });
    
    // Add event listeners for VM actions
    document.querySelectorAll('[data-vm-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.vmAction;
        const vmId = parseInt(e.currentTarget.dataset.vmId);
        const vm = appState.vms.find(v => v.id === vmId);
        
        if (!vm) {
          showNotification('VM not found', 'error');
          return;
        }
        
        // Show notification for now since we're not implementing actual functionality yet
        showNotification(`Action "${action}" on VM "${vm.name}" will be implemented in the next version`, 'info');
      });
    });
  }
  
  // Function to load the LXC Container List View
  function loadLXCListView() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('LXC Containers')}
      
      <div class="d-flex justify-content-between mb-4">
        <div class="d-flex">
          <div class="input-group me-2">
            <span class="input-group-text"><i class="fas fa-search"></i></span>
            <input type="text" class="form-control" placeholder="Search containers...">
          </div>
          <div class="btn-group">
            <button class="btn btn-outline-secondary">
              <i class="fas fa-filter me-1"></i> Filter
            </button>
          </div>
        </div>
        <button class="btn btn-primary" id="create-container-btn">
          <i class="fas fa-plus me-1"></i> Create Container
        </button>
      </div>
      
      <div class="card glow-border">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-cube me-2"></i> LXC CONTAINERS</h5>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Status</th>
                  <th>Node</th>
                  <th>IP Address</th>
                  <th>CPU</th>
                  <th>Memory</th>
                  <th>Disk</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="containers-table">
                ${appState.containers.length === 0 ? `
                  <tr>
                    <td colspan="9" class="text-center">
                      <div class="py-4">
                        <i class="fas fa-info-circle me-2"></i> No LXC containers found
                      </div>
                    </td>
                  </tr>
                ` : appState.containers.map(container => `
                  <tr>
                    <td>${container.id}</td>
                    <td>
                      <strong>${container.name}</strong>
                    </td>
                    <td>
                      <span class="badge ${container.status === 'running' ? 'bg-success' : 'bg-secondary'}">
                        ${container.status === 'running' ? 'Running' : 'Stopped'}
                      </span>
                    </td>
                    <td>${container.node}</td>
                    <td>${container.ip || 'N/A'}</td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2">
                          <div class="progress-bar" style="width: ${container.cpu.usage * 100}%"></div>
                        </div>
                        <span class="small">${container.cpu.cores} vCPU</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2">
                          <div class="progress-bar" style="width: ${(container.memory.used / container.memory.total) * 100}%"></div>
                        </div>
                        <span class="small">${Math.round(container.memory.used)}/${Math.round(container.memory.total)} MB</span>
                      </div>
                    </td>
                    <td>
                      <div class="d-flex align-items-center">
                        <div class="progress flex-grow-1 me-2">
                          <div class="progress-bar" style="width: ${(container.disk.used / container.disk.total) * 100}%"></div>
                        </div>
                        <span class="small">${Math.round(container.disk.used)}/${Math.round(container.disk.total)} GB</span>
                      </div>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-success" data-container-action="start" data-container-id="${container.id}" ${container.status === 'running' ? 'disabled' : ''}>
                          <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-outline-warning" data-container-action="stop" data-container-id="${container.id}" ${container.status !== 'running' ? 'disabled' : ''}>
                          <i class="fas fa-stop"></i>
                        </button>
                        <button class="btn btn-outline-primary" data-container-action="console" data-container-id="${container.id}">
                          <i class="fas fa-terminal"></i>
                        </button>
                        <button class="btn btn-outline-danger" data-container-action="delete" data-container-id="${container.id}">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for Create Container button
    document.getElementById('create-container-btn')?.addEventListener('click', () => {
      loadLXCCreateView();
    });
    
    // Add event listeners for Container actions
    document.querySelectorAll('[data-container-action]').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.containerAction;
        const containerId = parseInt(e.currentTarget.dataset.containerId);
        const container = appState.containers.find(c => c.id === containerId);
        
        if (!container) {
          showNotification('Container not found', 'error');
          return;
        }
        
        // Show notification for now since we're not implementing actual functionality yet
        showNotification(`Action "${action}" on Container "${container.name}" will be implemented in the next version`, 'info');
      });
    });
  }
  
  // Function to load the Network View
  function loadNetworkView() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Network')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-project-diagram me-2"></i> NETWORK INTERFACES</h5>
        </div>
        <div class="card-body">
          <p class="text-center py-4">
            <i class="fas fa-tools fa-2x mb-3"></i><br>
            Network management functionality will be implemented in the next version
          </p>
        </div>
      </div>
    `;
  }
  
  // Function to load the Updates View
  function loadUpdatesView() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Updates')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-sync me-2"></i> AVAILABLE UPDATES</h5>
        </div>
        <div class="card-body">
          <p class="text-center py-4">
            <i class="fas fa-tools fa-2x mb-3"></i><br>
            Updates management functionality will be implemented in the next version
          </p>
        </div>
      </div>
    `;
  }
  
  // Function to load the Settings View
  function loadSettingsView() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Settings')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-cog me-2"></i> APPLICATION SETTINGS</h5>
        </div>
        <div class="card-body">
          <p class="text-center py-4">
            <i class="fas fa-tools fa-2x mb-3"></i><br>
            Settings management functionality will be implemented in the next version
          </p>
        </div>
      </div>
    `;
  }
  
  // Function to load "Under Development" view
  function loadUnderDevelopmentView(viewName) {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader(viewName)}
      
      <div class="card glow-border">
        <div class="card-body text-center py-5">
          <i class="fas fa-tools fa-4x mb-3"></i>
          <h3>Under Development</h3>
          <p class="lead">This feature is currently under development and will be available in a future version.</p>
        </div>
      </div>
    `;
  }
  
  // Function to load the VM Create View
  function loadVMCreateView() {
    loadUnderDevelopmentView('Create Virtual Machine');
  }
  
  // Function to load the LXC Create View
  function loadLXCCreateView() {
    loadUnderDevelopmentView('Create LXC Container');
  }
  
  // Function to load the Storage View
  function loadStorageView() {
    loadUnderDevelopmentView('Storage');
  }
  
  // Function to load the User Management View
  function loadUserManagementView() {
    loadUnderDevelopmentView('User Management');
  }
  
  // Start the application with the login screen
  displayLogin();
});