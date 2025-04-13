// This file is used to initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  console.log('Proxmox Infrastructure Manager initializing...');
  
  const root = document.getElementById('root');
  
  // Predefined credentials for admin user
  const ADMIN_USERNAME = 'admin';
  const ADMIN_PASSWORD = 'admin';
  
  // State management for nodes and selected entities
  let state = {
    nodes: [],
    selectedNode: null,
    vms: [],
    containers: []
  };
  
  // Display the login form
  function displayLogin(errorMessage = null) {
    root.innerHTML = `
      <div class="login-container">
        <div class="grid-bg"></div>
        <div class="card login-card">
          <div class="card-header text-white">
            <h3 class="text-center mb-0 glow-text">PROXMOX INFRASTRUCTURE MANAGER</h3>
          </div>
          <div class="card-body">
            ${errorMessage ? `<div class="alert alert-danger mb-4">
              <i class="fas fa-exclamation-triangle me-2"></i> ${errorMessage}
            </div>` : ''}
            <form id="login-form">
              <div class="mb-4">
                <label for="username" class="form-label">Username</label>
                <input type="text" class="form-control" id="username" placeholder="Enter username" value="admin" required>
              </div>
              <div class="mb-4">
                <label for="password" class="form-label">Password</label>
                <input type="password" class="form-control" id="password" placeholder="Enter password" value="admin" required>
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-sign-in-alt me-2"></i> LOGIN
                </button>
              </div>
            </form>
          </div>
          <div class="card-footer text-center">
            <small>VERSION 1.0.0 | SECURED CONNECTION</small>
          </div>
        </div>
      </div>
    `;
    
    // Add listener for login form submission
    document.getElementById('login-form').addEventListener('submit', handleLogin);
  }
  
  // Handle login form submission
  async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Check credentials (for this version we use hard-coded admin/admin)
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Show loading
      displayLoading("Logging in...");
      
      try {
        // Verify API server is running
        const statusResponse = await fetch('/api/status');
        if (!statusResponse.ok) {
          throw new Error('API server is not responding');
        }
        
        // Load application data
        await loadApplicationData();
      } catch (error) {
        console.error('Error during login:', error);
        displayLogin("Error connecting to server. Please try again.");
      }
    } else {
      displayLogin("Invalid username or password. Try using admin/admin.");
    }
  }
  
  // Display loading screen with message
  function displayLoading(message) {
    root.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 100vh; background-color: var(--dark-bg);">
        <div class="grid-bg"></div>
        <div class="text-center">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <h4 class="mt-3 glow-text">PROXMOX INFRASTRUCTURE MANAGER</h4>
          <p class="text-dim">${message}</p>
        </div>
      </div>
    `;
  }
  
  // Fetch data from API
  async function fetchData(endpoint) {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching data from ${endpoint}:`, error);
      return { success: false, error: error.message };
    }
  }

  // Load application data
  async function loadApplicationData() {
    displayLoading("Loading application data...");
    
    try {
      // Fetch nodes data
      const nodesResponse = await fetchData('/api/nodes');
      if (nodesResponse.success) {
        state.nodes = nodesResponse.nodes;
      } else {
        console.error('Failed to load nodes:', nodesResponse.error);
      }
      
      // Fetch VMs data
      const vmsResponse = await fetchData('/api/vms');
      if (vmsResponse.success) {
        state.vms = vmsResponse.vms;
      } else {
        console.error('Failed to load VMs:', vmsResponse.error);
      }
      
      // Fetch containers data
      const containersResponse = await fetchData('/api/containers');
      if (containersResponse.success) {
        state.containers = containersResponse.containers;
      } else {
        console.error('Failed to load containers:', containersResponse.error);
      }
      
      // Display the dashboard with loaded data
      displayDashboard();
    } catch (error) {
      console.error('Error loading application data:', error);
      // If we encounter an error, still try to display the dashboard with whatever data we have
      displayDashboard();
    }
  }

  // Display the main dashboard view
  function displayDashboard() {
    root.innerHTML = `
      <div class="dashboard-container">
        <div class="grid-bg"></div>
        <div class="sidebar">
          <div class="sidebar-header">
            <h4><i class="fas fa-server me-2"></i> PROXMOX MANAGER</h4>
          </div>
          <div class="sidebar-menu">
            <div class="sidebar-section">
              <h6><i class="fas fa-tachometer-alt me-2"></i> Overview</h6>
              <button class="nav-link active" data-view="dashboard">
                <i class="fas fa-chart-line me-2"></i> Dashboard
              </button>
              <button class="nav-link" data-view="nodes-overview">
                <i class="fas fa-server me-2"></i> Nodes
              </button>
            </div>
            <div class="sidebar-section">
              <h6><i class="fas fa-desktop me-2"></i> Virtual Machines</h6>
              <button class="nav-link" data-view="vm-list">
                <i class="fas fa-list me-2"></i> VM List
              </button>
              <button class="nav-link" data-view="vm-create">
                <i class="fas fa-plus me-2"></i> Create VM
              </button>
            </div>
            <div class="sidebar-section">
              <h6><i class="fas fa-box me-2"></i> Containers</h6>
              <button class="nav-link" data-view="lxc-list">
                <i class="fas fa-list me-2"></i> LXC List
              </button>
              <button class="nav-link" data-view="lxc-create">
                <i class="fas fa-plus me-2"></i> Create LXC
              </button>
            </div>
            <div class="sidebar-section">
              <h6><i class="fas fa-cogs me-2"></i> Management</h6>
              <button class="nav-link" data-view="network">
                <i class="fas fa-network-wired me-2"></i> Network
              </button>
              <button class="nav-link" data-view="storage">
                <i class="fas fa-hdd me-2"></i> Storage
              </button>
              <button class="nav-link" data-view="templates" title="Manage VM and Container templates">
                <i class="fas fa-clone me-2"></i> Templates
              </button>
              <button class="nav-link" data-view="monitoring" title="System resource monitoring">
                <i class="fas fa-chart-line me-2"></i> Monitoring
              </button>
              <button class="nav-link" data-view="updates">
                <i class="fas fa-sync me-2"></i> Updates
              </button>
              <button class="nav-link" data-view="apps">
                <i class="fas fa-cubes me-2"></i> Applications
              </button>
            </div>
            <div class="sidebar-section">
              <h6><i class="fas fa-wrench me-2"></i> System</h6>
              <button class="nav-link" data-view="settings">
                <i class="fas fa-sliders-h me-2"></i> Settings
              </button>
              <button class="nav-link" data-view="logout">
                <i class="fas fa-sign-out-alt me-2"></i> Logout
              </button>
            </div>
          </div>
        </div>
        <div class="main-content">
          <!-- This will be populated dynamically -->
        </div>
      </div>
    `;
    
    // Add event listeners for navigation
    document.querySelectorAll('.sidebar .nav-link').forEach(button => {
      button.addEventListener('click', handleNavigation);
    });
    
    // Load initial view (dashboard)
    loadView('dashboard');
  }
  
  // Handle navigation clicks
  function handleNavigation(e) {
    // Remove active class from all buttons
    document.querySelectorAll('.sidebar .nav-link').forEach(btn => {
      btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    e.currentTarget.classList.add('active');
    
    // Get the view to load
    const view = e.currentTarget.dataset.view;
    
    // Handle logout separately
    if (view === 'logout') {
      displayLogin();
      return;
    }
    
    // Load the requested view
    loadView(view);
  }
  
  // Load a specific view into the main content area
  function loadView(view) {
    const mainContent = document.querySelector('.main-content');
    
    // Show loading within the main content
    mainContent.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 100%;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <span class="ms-3">Loading ${view} view...</span>
      </div>
    `;
    
    // Load the requested view after a short delay (simulating loading)
    setTimeout(() => {
      switch (view) {
        case 'dashboard':
          loadDashboardView();
          break;
        case 'nodes-overview':
          loadNodesOverview();
          break;
        case 'vm-list':
          loadVMListView();
          break;
        case 'vm-create':
          loadVMCreateView();
          break;
        case 'lxc-list':
          loadLXCListView();
          break;
        case 'lxc-create':
          loadLXCCreateView();
          break;
        case 'network':
          loadNetworkView();
          break;
        case 'storage':
          loadStorageView();
          break;
        case 'templates':
          loadTemplatesView();
          break;
        case 'monitoring':
          loadMonitoringView();
          break;
        case 'updates':
          loadUpdatesView();
          break;
        case 'settings':
          loadSettingsView();
          break;
        default:
          // Show under development message for other views
          loadUnderDevelopmentView(view);
      }
    }, 500);
  }
  
  // Common header for all pages with title
  function getCommonHeader(title) {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-cube me-3"></i> ${title.toUpperCase()}</h1>
        <div class="d-flex align-items-center">
          <div class="me-3 text-dim">
            <i class="fas fa-user-circle me-1"></i> admin
          </div>
          <div class="glow-border px-3 py-2 rounded">
            <i class="fas fa-server me-1"></i> Proxmox Manager
            <span class="badge bg-success ms-2">CONNECTED</span>
          </div>
        </div>
      </div>
    `;
  }
  
  // Load the initial dashboard view with server management
  function loadDashboardView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Dashboard')}
      
      <!-- Node Management Section -->
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-server me-2"></i> SERVER MANAGEMENT</h5>
        </div>
        <div class="card-body">
          <h6 class="mb-3">Add Proxmox Node</h6>
          <form id="add-node-form" class="mb-4">
            <div class="row g-3">
              <div class="col-md-4">
                <label for="node-hostname" class="form-label">Hostname/IP</label>
                <input type="text" class="form-control" id="node-hostname" placeholder="e.g., 10.55.1.10" required>
              </div>
              <div class="col-md-3">
                <label for="node-name" class="form-label">Node Name</label>
                <input type="text" class="form-control" id="node-name" placeholder="e.g., pve1" required>
              </div>
              <div class="col-md-3">
                <label for="node-port" class="form-label">API Port</label>
                <input type="number" class="form-control" id="node-port" value="8006" required>
              </div>
              <div class="col-md-2 d-flex align-items-end">
                <button type="submit" class="btn btn-primary w-100">Add Node</button>
              </div>
            </div>
            
            <div class="row mt-3">
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="api-username" class="form-label">API Credentials</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-user"></i></span>
                    <input type="text" class="form-control" id="api-username" placeholder="Username (e.g., api@pam!home)" value="root@pam">
                    <input type="password" class="form-control" id="api-password" placeholder="Password" value="Poolamea01@">
                  </div>
                  <div class="form-text">API user with sufficient privileges</div>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label for="ssh-username" class="form-label">SSH Credentials</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-terminal"></i></span>
                    <input type="text" class="form-control" id="ssh-username" placeholder="Username" value="root">
                    <input type="password" class="form-control" id="ssh-password" placeholder="Password" value="Poolamea01@">
                  </div>
                  <div class="form-text">SSH access for advanced operations</div>
                </div>
              </div>
            </div>
          </form>
          
          <h6 class="mb-3 mt-4">Configured Nodes</h6>
          <div id="nodes-table-container">
            ${state.nodes.length === 0 ? 
              `<div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i> No nodes have been added yet. Add your first Proxmox node above.
              </div>` :
              `<table class="table table-dark table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Hostname/IP</th>
                    <th>API Port</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="nodes-table-body">
                  <!-- Nodes will be populated here -->
                </tbody>
              </table>`
            }
          </div>
        </div>
      </div>
      
      <!-- Quick Status Overview -->
      <div class="row mt-4">
        <div class="col-md-6 mb-4">
          <div class="card glow-border">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i> GETTING STARTED</h5>
            </div>
            <div class="card-body">
              <div class="alert alert-info bg-transparent glow-border">
                <p><i class="fas fa-lightbulb me-2"></i> <strong>Welcome to the Proxmox Infrastructure Manager!</strong></p>
                <p>To get started:</p>
                <ol>
                  <li>Add your Proxmox nodes using the form above</li>
                  <li>Use the sidebar to navigate between different management features</li>
                  <li>Manage your VMs, containers, and apply updates from a single interface</li>
                </ol>
                <p>This application uses both the Proxmox API and SSH to provide comprehensive management capabilities.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card glow-border">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-cog me-2"></i> CONFIGURATION OPTIONS</h5>
            </div>
            <div class="card-body">
              <div class="mb-3">
                <label class="form-label">Application Settings</label>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="setting-ssh" checked>
                  <label class="form-check-label" for="setting-ssh">Enable SSH Operations</label>
                </div>
                <div class="form-check form-switch mb-2">
                  <input class="form-check-input" type="checkbox" id="setting-verify-ssl">
                  <label class="form-check-label" for="setting-verify-ssl">Verify SSL Certificates</label>
                </div>
                <div class="form-check form-switch">
                  <input class="form-check-input" type="checkbox" id="setting-auto-refresh" checked>
                  <label class="form-check-label" for="setting-auto-refresh">Auto-refresh Data (30s)</label>
                </div>
              </div>
              
              <div class="d-grid mt-3">
                <button class="btn btn-outline-primary glow-border">
                  <i class="fas fa-save me-2"></i> Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for the add node form
    document.getElementById('add-node-form').addEventListener('submit', handleAddNode);
  }
  
  // Handle adding a new Proxmox node
  function handleAddNode(e) {
    e.preventDefault();
    
    // Get form values
    const hostname = document.getElementById('node-hostname').value;
    const name = document.getElementById('node-name').value;
    const port = document.getElementById('node-port').value;
    const apiUsername = document.getElementById('api-username').value;
    const apiPassword = document.getElementById('api-password').value;
    const sshUsername = document.getElementById('ssh-username').value;
    const sshPassword = document.getElementById('ssh-password').value;
    
    // Create node object
    const newNode = {
      id: Date.now(), // Use timestamp as unique ID
      name,
      hostname,
      port,
      apiUsername,
      apiPassword,
      sshUsername,
      sshPassword,
      status: 'connecting',
      lastConnected: null
    };
    
    // Add node to state
    state.nodes.push(newNode);
    
    // Show loading message
    const nodesContainer = document.getElementById('nodes-table-container');
    nodesContainer.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Connecting to ${hostname}...</p>
      </div>
    `;
    
    // Simulate connection (in real app, this would be an actual API call)
    setTimeout(() => {
      // Update node status
      newNode.status = 'connected';
      newNode.lastConnected = new Date();
      
      // Refresh the nodes table
      refreshNodesTable();
      
      // Show success message
      showNotification(`Successfully connected to ${name} (${hostname})`);
    }, 2000);
  }
  
  // Refresh the nodes table based on current state
  function refreshNodesTable() {
    const nodesContainer = document.getElementById('nodes-table-container');
    
    if (state.nodes.length === 0) {
      nodesContainer.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i> No nodes have been added yet. Add your first Proxmox node above.
        </div>
      `;
      return;
    }
    
    nodesContainer.innerHTML = `
      <table class="table table-dark table-hover">
        <thead>
          <tr>
            <th>Name</th>
            <th>Hostname/IP</th>
            <th>API Port</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="nodes-table-body">
          ${state.nodes.map(node => `
            <tr>
              <td>${node.name}</td>
              <td>${node.hostname}</td>
              <td>${node.port}</td>
              <td>
                ${node.status === 'connected' 
                  ? `<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Connected</span>` 
                  : node.status === 'connecting'
                  ? `<span class="badge bg-warning"><i class="fas fa-sync fa-spin me-1"></i> Connecting</span>`
                  : `<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Disconnected</span>`
                }
              </td>
              <td>
                <div class="btn-group btn-group-sm">
                  <button class="btn btn-outline-primary" data-node-id="${node.id}" data-action="view">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-outline-warning" data-node-id="${node.id}" data-action="edit">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn btn-outline-danger" data-node-id="${node.id}" data-action="delete">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    // Add event listeners for node actions
    document.querySelectorAll('[data-action]').forEach(button => {
      button.addEventListener('click', handleNodeAction);
    });
  }
  
  // Handle node actions (view, edit, delete)
  function handleNodeAction(e) {
    const nodeId = parseInt(e.currentTarget.dataset.nodeId);
    const action = e.currentTarget.dataset.action;
    const node = state.nodes.find(n => n.id === nodeId);
    
    if (!node) {
      showNotification('Node not found', 'error');
      return;
    }
    
    switch (action) {
      case 'view':
        state.selectedNode = node;
        loadNodesOverview();
        // Also update the sidebar to show the nodes view is active
        document.querySelectorAll('.sidebar .nav-link').forEach(btn => {
          btn.classList.remove('active');
        });
        document.querySelector('[data-view="nodes-overview"]').classList.add('active');
        break;
      case 'edit':
        // For now, just show a notification
        showNotification(`Edit functionality will be implemented in the next version`, 'info');
        break;
      case 'delete':
        if (confirm(`Are you sure you want to remove ${node.name} (${node.hostname})?`)) {
          // Remove node from state
          state.nodes = state.nodes.filter(n => n.id !== nodeId);
          // Refresh the nodes table
          refreshNodesTable();
          showNotification(`Node ${node.name} has been removed`, 'success');
        }
        break;
    }
  }
  
  // Show a notification message
  function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'info' ? 'info' : 'success'} border-0 position-fixed`;
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'info' ? 'info-circle' : 'check-circle'} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    
    // Add to document body
    document.body.appendChild(notification);
    
    // Initialize Bootstrap toast
    const toast = new bootstrap.Toast(notification, {
      delay: 5000
    });
    
    // Show notification
    toast.show();
    
    // Remove from DOM after hiding
    notification.addEventListener('hidden.bs.toast', () => {
      notification.remove();
    });
  }
  
  // Load the nodes overview
  function loadNodesOverview() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Nodes Overview')}
      
      ${state.nodes.length === 0 ? 
        `<div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i> No nodes have been added yet. Return to the dashboard to add your first Proxmox node.
        </div>` :
        `<div class="row">
          ${state.nodes.map(node => `
            <div class="col-md-6 mb-4">
              <div class="card glow-border ${state.selectedNode && state.selectedNode.id === node.id ? 'border border-info' : ''}">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">
                    <i class="fas fa-server me-2"></i> ${node.name}
                  </h5>
                  <span class="badge bg-${node.status === 'connected' ? 'success' : 'danger'}">
                    ${node.status === 'connected' ? 'ONLINE' : 'OFFLINE'}
                  </span>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <strong>Hostname:</strong> ${node.hostname}:${node.port}
                  </div>
                  <div class="mb-3">
                    <strong>API User:</strong> ${node.apiUsername}
                  </div>
                  <div class="mb-3">
                    <strong>SSH User:</strong> ${node.sshUsername}
                  </div>
                  <div class="mb-3">
                    <strong>Last Connected:</strong> ${node.lastConnected ? node.lastConnected.toLocaleString() : 'Never'}
                  </div>
                  
                  <div class="row mt-4">
                    <div class="col-md-6">
                      <div class="card bg-darker text-center py-2">
                        <h5 class="mb-0">VMs</h5>
                        <div class="display-4">-</div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card bg-darker text-center py-2">
                        <h5 class="mb-0">LXC</h5>
                        <div class="display-4">-</div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="d-grid gap-2 mt-3">
                    <button class="btn btn-outline-primary" data-node-id="${node.id}" data-action="view-details">
                      <i class="fas fa-eye me-2"></i> View Details
                    </button>
                    <button class="btn btn-outline-info" data-node-id="${node.id}" data-action="fetch-vms">
                      <i class="fas fa-sync me-2"></i> Fetch Resources
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>`
      }
    `;
    
    // Add event listeners for node actions
    document.querySelectorAll('[data-action="view-details"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const nodeId = parseInt(e.currentTarget.dataset.nodeId);
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          state.selectedNode = node;
          showNotification(`Viewing details for ${node.name}`, 'info');
          // Refresh current view to highlight selected node
          loadNodesOverview();
        }
      });
    });
    
    document.querySelectorAll('[data-action="fetch-vms"]').forEach(button => {
      button.addEventListener('click', (e) => {
        const nodeId = parseInt(e.currentTarget.dataset.nodeId);
        const node = state.nodes.find(n => n.id === nodeId);
        if (node) {
          // Show loading
          e.currentTarget.innerHTML = '<i class="fas fa-sync fa-spin me-2"></i> Fetching...';
          e.currentTarget.disabled = true;
          
          // Simulate API call
          setTimeout(() => {
            // Randomly generate between 1-5 VMs and 1-5 containers for this demo
            const vmsCount = Math.floor(Math.random() * 5) + 1;
            const containersCount = Math.floor(Math.random() * 5) + 1;
            
            // Update button text
            e.currentTarget.innerHTML = '<i class="fas fa-check me-2"></i> Fetched Successfully';
            
            // Update card display
            const cardBody = e.currentTarget.closest('.card-body');
            const vmCountEl = cardBody.querySelector('.col-md-6:first-child .display-4');
            const lxcCountEl = cardBody.querySelector('.col-md-6:last-child .display-4');
            
            vmCountEl.textContent = vmsCount;
            lxcCountEl.textContent = containersCount;
            
            // Re-enable button after a delay
            setTimeout(() => {
              e.currentTarget.innerHTML = '<i class="fas fa-sync me-2"></i> Refresh Resources';
              e.currentTarget.disabled = false;
            }, 2000);
            
            showNotification(`Successfully fetched resources from ${node.name}`, 'success');
          }, 2000);
        }
      });
    });
  }
  
  // Load the VM List view
  function loadVMListView() {
    const mainContent = document.querySelector('.main-content');
    const selectedNode = state.selectedNode;
    
    mainContent.innerHTML = `
      ${getCommonHeader('VM List')}
      
      ${!selectedNode ? 
        `<div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i> Please select a node first from the Nodes Overview page.
        </div>` :
        `<div class="card glow-border mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-desktop me-2"></i> VIRTUAL MACHINES ON ${selectedNode.name.toUpperCase()}</h5>
            <div>
              <button class="btn btn-sm btn-outline-info me-2 glow-border" id="refresh-vms-btn">
                <i class="fas fa-sync-alt me-1"></i> Refresh
              </button>
              <button class="btn btn-sm btn-outline-success glow-border">
                <i class="fas fa-plus me-1"></i> Create New VM
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="text-center py-5">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <h5>Fetching VMs from ${selectedNode.name}...</h5>
            </div>
          </div>
        </div>`
      }
    `;
    
    if (selectedNode) {
      // Simulate fetching VMs from the selected node
      setTimeout(() => {
        // For demo, generate some sample VMs
        const vms = [
          {
            id: 101,
            name: 'web-server',
            status: 'running',
            cpu: { cores: 2, usage: 15 },
            memory: { total: 4, used: 2.1 },
            disk: { total: 32, used: 18.5 }
          },
          {
            id: 102,
            name: 'db-server',
            status: 'running',
            cpu: { cores: 4, usage: 45 },
            memory: { total: 16, used: 12.4 },
            disk: { total: 100, used: 76.2 }
          },
          {
            id: 103,
            name: 'mail-server',
            status: 'stopped',
            cpu: { cores: 2, usage: 0 },
            memory: { total: 4, used: 0 },
            disk: { total: 50, used: 23.7 }
          }
        ];
        
        // Update the view with the VMs
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
          cardBody.innerHTML = `
            <div class="table-responsive">
              <table class="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>VMID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    <th>Disk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${vms.map(vm => `
                    <tr>
                      <td>${vm.id}</td>
                      <td>${vm.name}</td>
                      <td>
                        <span class="badge bg-${vm.status === 'running' ? 'success' : 'danger'}">
                          <i class="fas fa-${vm.status === 'running' ? 'play-circle' : 'stop-circle'} me-1"></i>
                          ${vm.status.charAt(0).toUpperCase() + vm.status.slice(1)}
                        </span>
                      </td>
                      <td>${vm.cpu.cores} vCPU (${vm.cpu.usage}%)</td>
                      <td>${vm.memory.total} GB (${vm.memory.used} GB used)</td>
                      <td>${vm.disk.total} GB (${vm.disk.used} GB used)</td>
                      <td>
                        <div class="btn-group btn-group-sm" role="group">
                          <button class="btn btn-outline-primary" title="Console"><i class="fas fa-terminal"></i></button>
                          ${vm.status === 'running' ? `
                            <button class="btn btn-outline-warning" title="Restart"><i class="fas fa-sync"></i></button>
                            <button class="btn btn-outline-danger" title="Stop"><i class="fas fa-stop"></i></button>
                          ` : `
                            <button class="btn btn-outline-success" title="Start"><i class="fas fa-play"></i></button>
                          `}
                          <button class="btn btn-outline-info" title="Settings"><i class="fas fa-cog"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
      }, 1500);
      
      // Add event listener for refresh button
      setTimeout(() => {
        const refreshBtn = document.getElementById('refresh-vms-btn');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', () => {
            loadVMListView();
          });
        }
      }, 100);
    }
  }
  
  // Load the LXC List view
  function loadLXCListView() {
    const mainContent = document.querySelector('.main-content');
    const selectedNode = state.selectedNode;
    
    mainContent.innerHTML = `
      ${getCommonHeader('LXC List')}
      
      ${!selectedNode ? 
        `<div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i> Please select a node first from the Nodes Overview page.
        </div>` :
        `<div class="card glow-border mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="mb-0"><i class="fas fa-box me-2"></i> LXC CONTAINERS ON ${selectedNode.name.toUpperCase()}</h5>
            <div>
              <button class="btn btn-sm btn-outline-info me-2 glow-border" id="refresh-lxc-btn">
                <i class="fas fa-sync-alt me-1"></i> Refresh
              </button>
              <button class="btn btn-sm btn-outline-success glow-border">
                <i class="fas fa-plus me-1"></i> Create New Container
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="text-center py-5">
              <div class="spinner-border text-primary mb-3" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <h5>Fetching Containers from ${selectedNode.name}...</h5>
            </div>
          </div>
        </div>`
      }
    `;
    
    if (selectedNode) {
      // Simulate fetching LXC containers from the selected node
      setTimeout(() => {
        // For demo, generate some sample containers
        const containers = [
          {
            id: 201,
            name: 'nginx-proxy',
            status: 'running',
            cpu: { cores: 1, usage: 8 },
            memory: { total: 1, used: 0.5 },
            disk: { total: 8, used: 3.2 },
            ip: '10.10.10.201'
          },
          {
            id: 202,
            name: 'redis-cache',
            status: 'running',
            cpu: { cores: 2, usage: 24 },
            memory: { total: 4, used: 3.1 },
            disk: { total: 16, used: 7.8 },
            ip: '10.10.10.202'
          },
          {
            id: 203,
            name: 'monitoring',
            status: 'running',
            cpu: { cores: 2, usage: 15 },
            memory: { total: 2, used: 1.5 },
            disk: { total: 20, used: 12.4 },
            ip: '10.10.10.203'
          },
          {
            id: 204,
            name: 'dev-env',
            status: 'stopped',
            cpu: { cores: 2, usage: 0 },
            memory: { total: 4, used: 0 },
            disk: { total: 30, used: 18.6 },
            ip: '10.10.10.204'
          }
        ];
        
        // Update the view with the containers
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
          cardBody.innerHTML = `
            <div class="table-responsive">
              <table class="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>CTID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>CPU</th>
                    <th>Memory</th>
                    <th>Disk</th>
                    <th>IP Address</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${containers.map(ct => `
                    <tr>
                      <td>${ct.id}</td>
                      <td>${ct.name}</td>
                      <td>
                        <span class="badge bg-${ct.status === 'running' ? 'success' : 'danger'}">
                          <i class="fas fa-${ct.status === 'running' ? 'play-circle' : 'stop-circle'} me-1"></i>
                          ${ct.status.charAt(0).toUpperCase() + ct.status.slice(1)}
                        </span>
                      </td>
                      <td>${ct.cpu.cores} vCPU (${ct.cpu.usage}%)</td>
                      <td>${ct.memory.total} GB (${ct.memory.used} GB used)</td>
                      <td>${ct.disk.total} GB (${ct.disk.used} GB used)</td>
                      <td>${ct.ip}</td>
                      <td>
                        <div class="btn-group btn-group-sm" role="group">
                          <button class="btn btn-outline-primary" title="Console"><i class="fas fa-terminal"></i></button>
                          ${ct.status === 'running' ? `
                            <button class="btn btn-outline-warning" title="Restart"><i class="fas fa-sync"></i></button>
                            <button class="btn btn-outline-danger" title="Stop"><i class="fas fa-stop"></i></button>
                          ` : `
                            <button class="btn btn-outline-success" title="Start"><i class="fas fa-play"></i></button>
                          `}
                          <button class="btn btn-outline-info" title="Settings"><i class="fas fa-cog"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
      }, 1500);
      
      // Add event listener for refresh button
      setTimeout(() => {
        const refreshBtn = document.getElementById('refresh-lxc-btn');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', () => {
            loadLXCListView();
          });
        }
      }, 100);
    }
  }
  
  // Load Network view
  function loadNetworkView() {
    const mainContent = document.querySelector('.main-content');
    const selectedNode = state.selectedNode;
    
    mainContent.innerHTML = `
      ${getCommonHeader('Network')}
      
      ${!selectedNode ? 
        `<div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i> Please select a node first from the Nodes Overview page.
        </div>` :
        `<div class="row mb-4">
          <div class="col-12">
            <div class="card glow-border">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-network-wired me-2"></i> NETWORK INTERFACES ON ${selectedNode.name.toUpperCase()}</h5>
                <button class="btn btn-sm btn-outline-info glow-border" id="refresh-network-btn">
                  <i class="fas fa-sync-alt me-1"></i> Refresh
                </button>
              </div>
              <div class="card-body p-0">
                <div class="text-center py-5">
                  <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <h5>Fetching Network Data from ${selectedNode.name}...</h5>
                </div>
              </div>
            </div>
          </div>
        </div>`
      }
    `;
    
    if (selectedNode) {
      // Simulate fetching network data from the selected node
      setTimeout(() => {
        // For demo, generate some sample network interfaces
        const interfaces = [
          {
            name: 'eth0',
            ip: '10.55.1.10',
            netmask: '255.255.255.0',
            mac: '00:1A:2B:3C:4D:5E',
            status: 'up',
            trafficIn: '4.5 MB/s',
            trafficOut: '2.8 MB/s'
          },
          {
            name: 'eth1',
            ip: '192.168.1.10',
            netmask: '255.255.255.0',
            mac: '00:1A:2B:3C:4D:5F',
            status: 'up',
            trafficIn: '1.2 MB/s',
            trafficOut: '0.8 MB/s'
          },
          {
            name: 'vmbr0',
            ip: '10.55.2.1',
            netmask: '255.255.255.0',
            mac: '00:1A:2B:3C:4D:60',
            status: 'up',
            trafficIn: '8.7 MB/s',
            trafficOut: '5.3 MB/s'
          },
          {
            name: 'lo',
            ip: '127.0.0.1',
            netmask: '255.0.0.0',
            mac: '00:00:00:00:00:00',
            status: 'up',
            trafficIn: '0.1 MB/s',
            trafficOut: '0.1 MB/s'
          }
        ];
        
        // Update the view with the network interfaces
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
          cardBody.innerHTML = `
            <div class="table-responsive">
              <table class="table table-dark table-hover mb-0">
                <thead>
                  <tr>
                    <th>Interface</th>
                    <th>IP Address</th>
                    <th>Netmask</th>
                    <th>MAC Address</th>
                    <th>Status</th>
                    <th>Traffic In</th>
                    <th>Traffic Out</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${interfaces.map(iface => `
                    <tr>
                      <td>${iface.name}</td>
                      <td>${iface.ip}</td>
                      <td>${iface.netmask}</td>
                      <td>${iface.mac}</td>
                      <td>
                        <span class="badge bg-${iface.status === 'up' ? 'success' : 'danger'}">
                          ${iface.status.toUpperCase()}
                        </span>
                      </td>
                      <td>${iface.trafficIn}</td>
                      <td>${iface.trafficOut}</td>
                      <td>
                        <div class="btn-group btn-group-sm" role="group">
                          <button class="btn btn-outline-info" title="Edit"><i class="fas fa-edit"></i></button>
                          <button class="btn btn-outline-primary" title="Details"><i class="fas fa-info-circle"></i></button>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `;
        }
        
        // Add rest of the Network view
        mainContent.innerHTML += `
          <div class="row">
            <div class="col-md-6">
              <div class="card glow-border mb-4">
                <div class="card-header">
                  <h5 class="mb-0"><i class="fas fa-traffic-light me-2"></i> TRAFFIC MONITOR</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <h6 class="text-dim mb-2">Real-time Network Traffic</h6>
                    <div class="row text-center">
                      <div class="col-md-6">
                        <div class="display-4">12.5<small class="fs-6">MB/s</small></div>
                        <div class="text-success"><i class="fas fa-arrow-down me-1"></i> Inbound</div>
                      </div>
                      <div class="col-md-6">
                        <div class="display-4">7.4<small class="fs-6">MB/s</small></div>
                        <div class="text-info"><i class="fas fa-arrow-up me-1"></i> Outbound</div>
                      </div>
                    </div>
                  </div>
                  
                  <h6 class="text-dim mb-2">Top Traffic by VM/Container</h6>
                  <table class="table table-dark table-sm">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>IP</th>
                        <th>In</th>
                        <th>Out</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>nginx-proxy</td>
                        <td>10.10.10.201</td>
                        <td>3.4 MB/s</td>
                        <td>2.1 MB/s</td>
                      </tr>
                      <tr>
                        <td>web-server</td>
                        <td>10.10.10.101</td>
                        <td>2.7 MB/s</td>
                        <td>1.5 MB/s</td>
                      </tr>
                      <tr>
                        <td>db-server</td>
                        <td>10.10.10.102</td>
                        <td>2.2 MB/s</td>
                        <td>0.8 MB/s</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card glow-border mb-4">
                <div class="card-header">
                  <h5 class="mb-0"><i class="fas fa-cogs me-2"></i> NETWORK CONFIGURATION</h5>
                </div>
                <div class="card-body">
                  <form>
                    <div class="mb-3">
                      <label for="network-config" class="form-label">Network Configuration File</label>
                      <textarea class="form-control bg-darker" id="network-config" rows="10" style="font-family: monospace;">
# This file describes the network interfaces available on your system
# and how to activate them. For more information, see interfaces(5).

source /etc/network/interfaces.d/*

# The loopback network interface
auto lo
iface lo inet loopback

# The primary network interface
auto eth0
iface eth0 inet static
  address 10.55.1.10
  netmask 255.255.255.0
  gateway 10.55.1.1
  
# Secondary interface
auto eth1
iface eth1 inet static
  address 192.168.1.10
  netmask 255.255.255.0
                      </textarea>
                    </div>
                    <div class="d-flex justify-content-end">
                      <button type="button" class="btn btn-outline-warning me-2">
                        <i class="fas fa-undo me-1"></i> Reset
                      </button>
                      <button type="button" class="btn btn-outline-success">
                        <i class="fas fa-save me-1"></i> Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        `;
      }, 1500);
      
      // Add event listener for refresh button
      setTimeout(() => {
        const refreshBtn = document.getElementById('refresh-network-btn');
        if (refreshBtn) {
          refreshBtn.addEventListener('click', () => {
            loadNetworkView();
          });
        }
      }, 100);
    }
  }
  
  // Load Updates view
  function loadUpdatesView() {
    const mainContent = document.querySelector('.main-content');
    const selectedNode = state.selectedNode;
    
    mainContent.innerHTML = `
      ${getCommonHeader('Updates')}
      
      ${!selectedNode ? 
        `<div class="alert alert-warning">
          <i class="fas fa-exclamation-triangle me-2"></i> Please select a node first from the Nodes Overview page.
        </div>` :
        `<div class="row mb-4">
          <div class="col-12">
            <div class="card glow-border">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="fas fa-sync me-2"></i> AVAILABLE UPDATES ON ${selectedNode.name.toUpperCase()}</h5>
                <div>
                  <button class="btn btn-sm btn-outline-info me-2 glow-border" id="check-updates-btn">
                    <i class="fas fa-sync-alt me-1"></i> Check for Updates
                  </button>
                </div>
              </div>
              <div class="card-body p-0">
                <div class="text-center py-5">
                  <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                  <h5>Checking for updates on ${selectedNode.name}...</h5>
                </div>
              </div>
            </div>
          </div>
        </div>`
      }
    `;
    
    if (selectedNode) {
      // Simulate checking for updates
      setTimeout(() => {
        // For demo, generate some sample updates
        const updates = {
          node: [
            { package: 'pve-kernel-5.15', currentVersion: '5.15.102-1', newVersion: '5.15.107-1', priority: 'security', type: 'Kernel' },
            { package: 'openssl', currentVersion: '3.0.9-1', newVersion: '3.0.11-1', priority: 'security', type: 'System' },
            { package: 'qemu-server', currentVersion: '7.2.0-3', newVersion: '7.2.0-5', priority: 'important', type: 'System' }
          ],
          vms: [
            { id: 101, name: 'web-server', status: 'running', package: 'linux-image-generic', currentVersion: '5.15.0-78', newVersion: '5.15.0-82', priority: 'security' },
            { id: 101, name: 'web-server', status: 'running', package: 'openssl', currentVersion: '3.0.2-0ubuntu1.9', newVersion: '3.0.2-0ubuntu1.10', priority: 'security' },
            { id: 102, name: 'db-server', status: 'running', package: 'mysql-server', currentVersion: '8.0.32-0ubuntu0.22.04.2', newVersion: '8.0.34-0ubuntu0.22.04.1', priority: 'important' }
          ],
          containers: [
            { id: 201, name: 'nginx-proxy', status: 'running', package: 'nginx', currentVersion: '1.22.1-1~bookworm', newVersion: '1.24.0-2~bookworm', priority: 'important' },
            { id: 201, name: 'nginx-proxy', status: 'running', package: 'openssl', currentVersion: '3.0.9-1', newVersion: '3.0.11-1', priority: 'security' },
            { id: 202, name: 'redis-cache', status: 'running', package: 'redis-server', currentVersion: '6:7.0.11-1~deb12u1', newVersion: '6:7.0.15-1~deb12u1', priority: 'security' }
          ]
        };
        
        // Update the view with the updates
        const cardBody = document.querySelector('.card-body');
        if (cardBody) {
          cardBody.innerHTML = `
            <ul class="nav nav-tabs" id="updateTabs" role="tablist">
              <li class="nav-item" role="presentation">
                <button class="nav-link active" id="nodes-tab" data-bs-toggle="tab" data-bs-target="#nodes" type="button" role="tab">
                  Node Updates <span class="badge bg-warning ms-1">${updates.node.length}</span>
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="vms-tab" data-bs-toggle="tab" data-bs-target="#vms" type="button" role="tab">
                  VM Updates <span class="badge bg-warning ms-1">${updates.vms.length}</span>
                </button>
              </li>
              <li class="nav-item" role="presentation">
                <button class="nav-link" id="containers-tab" data-bs-toggle="tab" data-bs-target="#containers" type="button" role="tab">
                  Container Updates <span class="badge bg-warning ms-1">${updates.containers.length}</span>
                </button>
              </li>
            </ul>
            
            <div class="tab-content" id="updateTabsContent">
              <div class="tab-pane fade show active" id="nodes" role="tabpanel">
                <div class="table-responsive">
                  <table class="table table-dark table-hover mb-0">
                    <thead>
                      <tr>
                        <th style="width: 1%">
                          <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="selectAllNodes">
                          </div>
                        </th>
                        <th>Package</th>
                        <th>Current Version</th>
                        <th>New Version</th>
                        <th>Priority</th>
                        <th>Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${updates.node.map(update => `
                        <tr>
                          <td>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" ${update.priority === 'security' ? 'checked' : ''}>
                            </div>
                          </td>
                          <td>${update.package}</td>
                          <td>${update.currentVersion}</td>
                          <td>${update.newVersion}</td>
                          <td>
                            <span class="badge bg-${update.priority === 'security' ? 'danger' : update.priority === 'important' ? 'warning' : 'info'}">
                              ${update.priority.charAt(0).toUpperCase() + update.priority.slice(1)}
                            </span>
                          </td>
                          <td>${update.type}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div class="tab-pane fade" id="vms" role="tabpanel">
                <div class="table-responsive">
                  <table class="table table-dark table-hover mb-0">
                    <thead>
                      <tr>
                        <th style="width: 1%">
                          <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="selectAllVMs">
                          </div>
                        </th>
                        <th>VM</th>
                        <th>Status</th>
                        <th>Package</th>
                        <th>Current Version</th>
                        <th>New Version</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${updates.vms.map(update => `
                        <tr>
                          <td>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" ${update.priority === 'security' ? 'checked' : ''}>
                            </div>
                          </td>
                          <td>${update.name} (${update.id})</td>
                          <td>
                            <span class="badge bg-${update.status === 'running' ? 'success' : 'danger'}">
                              ${update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                            </span>
                          </td>
                          <td>${update.package}</td>
                          <td>${update.currentVersion}</td>
                          <td>${update.newVersion}</td>
                          <td>
                            <span class="badge bg-${update.priority === 'security' ? 'danger' : update.priority === 'important' ? 'warning' : 'info'}">
                              ${update.priority.charAt(0).toUpperCase() + update.priority.slice(1)}
                            </span>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div class="tab-pane fade" id="containers" role="tabpanel">
                <div class="table-responsive">
                  <table class="table table-dark table-hover mb-0">
                    <thead>
                      <tr>
                        <th style="width: 1%">
                          <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="selectAllContainers">
                          </div>
                        </th>
                        <th>Container</th>
                        <th>Status</th>
                        <th>Package</th>
                        <th>Current Version</th>
                        <th>New Version</th>
                        <th>Priority</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${updates.containers.map(update => `
                        <tr>
                          <td>
                            <div class="form-check">
                              <input class="form-check-input" type="checkbox" ${update.priority === 'security' ? 'checked' : ''}>
                            </div>
                          </td>
                          <td>${update.name} (${update.id})</td>
                          <td>
                            <span class="badge bg-${update.status === 'running' ? 'success' : 'danger'}">
                              ${update.status.charAt(0).toUpperCase() + update.status.slice(1)}
                            </span>
                          </td>
                          <td>${update.package}</td>
                          <td>${update.currentVersion}</td>
                          <td>${update.newVersion}</td>
                          <td>
                            <span class="badge bg-${update.priority === 'security' ? 'danger' : update.priority === 'important' ? 'warning' : 'info'}">
                              ${update.priority.charAt(0).toUpperCase() + update.priority.slice(1)}
                            </span>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div class="card-footer d-flex justify-content-between align-items-center">
              <div>
                <span class="badge bg-danger me-1">Security: ${updates.node.filter(u => u.priority === 'security').length + 
                                                           updates.vms.filter(u => u.priority === 'security').length + 
                                                           updates.containers.filter(u => u.priority === 'security').length}</span>
                <span class="badge bg-warning me-1">Important: ${updates.node.filter(u => u.priority === 'important').length + 
                                                             updates.vms.filter(u => u.priority === 'important').length + 
                                                             updates.containers.filter(u => u.priority === 'important').length}</span>
              </div>
              <div>
                <button class="btn btn-outline-success glow-border">
                  <i class="fas fa-sync me-1"></i> Apply Selected Updates
                </button>
              </div>
            </div>
          `;
        }
        
        // Add the update history section
        mainContent.innerHTML += `
          <div class="row">
            <div class="col-md-6">
              <div class="card glow-border mb-4">
                <div class="card-header">
                  <h5 class="mb-0"><i class="fas fa-history me-2"></i> UPDATE HISTORY</h5>
                </div>
                <div class="card-body p-0">
                  <div class="list-group list-group-flush">
                    <div class="list-group-item bg-transparent text-light border-bottom border-secondary">
                      <div class="d-flex">
                        <div class="text-success me-3">
                          <i class="fas fa-check-circle fa-lg"></i>
                        </div>
                        <div>
                          <div class="d-flex justify-content-between align-items-center">
                            <strong>Security Updates Applied</strong>
                            <small class="text-dim">2023-04-10 14:32</small>
                          </div>
                          <p class="mb-1 text-dim">Applied 8 security updates to ${selectedNode.name}</p>
                          <span class="badge bg-dark me-1">openssl 3.0.8-1</span>
                          <span class="badge bg-dark me-1">pve-kernel-5.15.100-1</span>
                          <span class="badge bg-dark">+6 more</span>
                        </div>
                      </div>
                    </div>
                    <div class="list-group-item bg-transparent text-light border-bottom border-secondary">
                      <div class="d-flex">
                        <div class="text-danger me-3">
                          <i class="fas fa-times-circle fa-lg"></i>
                        </div>
                        <div>
                          <div class="d-flex justify-content-between align-items-center">
                            <strong>Failed Update</strong>
                            <small class="text-dim">2023-04-09 18:15</small>
                          </div>
                          <p class="mb-1 text-dim">Failed to update debian-packages on db-server (102)</p>
                          <span class="badge bg-dark me-1">mysql-server</span>
                          <button class="btn btn-sm btn-outline-danger">View Error Log</button>
                        </div>
                      </div>
                    </div>
                    <div class="list-group-item bg-transparent text-light">
                      <div class="d-flex">
                        <div class="text-success me-3">
                          <i class="fas fa-check-circle fa-lg"></i>
                        </div>
                        <div>
                          <div class="d-flex justify-content-between align-items-center">
                            <strong>Full System Update</strong>
                            <small class="text-dim">2023-04-01 10:00</small>
                          </div>
                          <p class="mb-1 text-dim">Applied 42 updates across all nodes and containers</p>
                          <span class="badge bg-dark me-1">pve-manager 7.4-3</span>
                          <span class="badge bg-dark me-1">pve-kernel-5.15.98-1</span>
                          <span class="badge bg-dark">+40 more</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="col-md-6">
              <div class="card glow-border">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0"><i class="fas fa-calendar-alt me-2"></i> UPDATE SCHEDULES</h5>
                  <button class="btn btn-sm btn-outline-primary glow-border">
                    <i class="fas fa-plus me-1"></i> New Schedule
                  </button>
                </div>
                <div class="card-body p-0">
                  <div class="table-responsive">
                    <table class="table table-dark table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Target</th>
                          <th>Type</th>
                          <th>Frequency</th>
                          <th>Next Run</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Security Updates</td>
                          <td>${selectedNode.name}</td>
                          <td>Security Only</td>
                          <td>Daily @ 01:00</td>
                          <td>2023-04-14 01:00</td>
                          <td><span class="badge bg-success">Active</span></td>
                          <td>
                            <div class="btn-group btn-group-sm" role="group">
                              <button class="btn btn-outline-info" title="Edit"><i class="fas fa-edit"></i></button>
                              <button class="btn btn-outline-danger" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td>VM Updates</td>
                          <td>All VMs</td>
                          <td>All Updates</td>
                          <td>Weekly @ Sunday 03:00</td>
                          <td>2023-04-16 03:00</td>
                          <td><span class="badge bg-success">Active</span></td>
                          <td>
                            <div class="btn-group btn-group-sm" role="group">
                              <button class="btn btn-outline-info" title="Edit"><i class="fas fa-edit"></i></button>
                              <button class="btn btn-outline-danger" title="Delete"><i class="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
      }, 1500);
      
      // Add event listener for check updates button
      setTimeout(() => {
        const checkUpdatesBtn = document.getElementById('check-updates-btn');
        if (checkUpdatesBtn) {
          checkUpdatesBtn.addEventListener('click', () => {
            loadUpdatesView();
          });
        }
      }, 100);
    }
  }
  
  // Load Settings view
  function loadSettingsView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Settings')}
      
      <div class="row">
        <div class="col-md-6 mb-4">
          <div class="card glow-border">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-user me-2"></i> USER SETTINGS</h5>
            </div>
            <div class="card-body">
              <form id="user-settings-form">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username" value="admin" disabled>
                  <div class="form-text">Username cannot be changed</div>
                </div>
                <div class="mb-3">
                  <label for="current-password" class="form-label">Current Password</label>
                  <input type="password" class="form-control" id="current-password" placeholder="Enter current password">
                </div>
                <div class="mb-3">
                  <label for="new-password" class="form-label">New Password</label>
                  <input type="password" class="form-control" id="new-password" placeholder="Enter new password">
                </div>
                <div class="mb-3">
                  <label for="confirm-password" class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" id="confirm-password" placeholder="Confirm new password">
                </div>
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-2"></i> Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card glow-border">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-cog me-2"></i> APPLICATION SETTINGS</h5>
            </div>
            <div class="card-body">
              <form id="app-settings-form">
                <div class="mb-3">
                  <label class="form-label">Appearance</label>
                  <div class="form-check mb-2">
                    <input class="form-check-input" type="radio" name="theme" id="theme-dark" checked>
                    <label class="form-check-label" for="theme-dark">
                      Dark Theme (Default)
                    </label>
                  </div>
                  <div class="form-check">
                    <input class="form-check-input" type="radio" name="theme" id="theme-light">
                    <label class="form-check-label" for="theme-light">
                      Light Theme
                    </label>
                  </div>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Data Refresh</label>
                  <select class="form-select" id="refresh-interval">
                    <option value="0">Manual Refresh Only</option>
                    <option value="30" selected>Every 30 seconds</option>
                    <option value="60">Every minute</option>
                    <option value="300">Every 5 minutes</option>
                  </select>
                </div>
                
                <div class="mb-3">
                  <label class="form-label">Security</label>
                  <div class="form-check form-switch mb-2">
                    <input class="form-check-input" type="checkbox" id="verify-ssl">
                    <label class="form-check-label" for="verify-ssl">Verify SSL Certificates</label>
                  </div>
                  <div class="form-check form-switch mb-2">
                    <input class="form-check-input" type="checkbox" id="store-credentials" checked>
                    <label class="form-check-label" for="store-credentials">Store Credentials</label>
                  </div>
                  <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="auto-logout">
                    <label class="form-check-label" for="auto-logout">Auto Logout (30 min inactivity)</label>
                  </div>
                </div>
                
                <div class="d-grid">
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-save me-2"></i> Save Settings
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-12">
          <div class="card glow-border">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-info-circle me-2"></i> ABOUT</h5>
            </div>
            <div class="card-body">
              <h4>Proxmox Infrastructure Manager v1.0.0</h4>
              <p>A comprehensive management application for Proxmox infrastructure.</p>
              <p><strong>Features:</strong></p>
              <ul>
                <li>VM and LXC container management</li>
                <li>Network configuration</li>
                <li>Update management</li>
                <li>Application deployment</li>
              </ul>
              <p>&copy; 2023 Proxmox Infrastructure Manager</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for settings forms
    document.getElementById('user-settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('Password updated successfully', 'success');
    });
    
    document.getElementById('app-settings-form').addEventListener('submit', (e) => {
      e.preventDefault();
      showNotification('Application settings saved', 'success');
    });
  }
  
  // Load a generic "under development" view for unimplemented features
  function loadUnderDevelopmentView(viewName) {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader(viewName)}
      
      <div class="card glow-border">
        <div class="card-body">
          <div class="text-center py-5">
            <i class="fas fa-code text-info mb-3" style="font-size: 3rem;"></i>
            <h3 class="glow-text">This section is under development</h3>
            <p class="text-dim">The ${viewName} module will be implemented in the next version.</p>
          </div>
        </div>
      </div>
    `;
  }
  
  // VM Create View
  function loadVMCreateView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Create Virtual Machine')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i> NEW VIRTUAL MACHINE</h5>
        </div>
        <div class="card-body">
          <form id="vm-create-form">
            <!-- Basic Information -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-info-circle me-2"></i> Basic Information</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label for="vm-node" class="form-label">Target Node</label>
                  <select class="form-select" id="vm-node" required>
                    <option value="" selected disabled>Select a node</option>
                    ${state.nodes.map(node => `<option value="${node.id}">${node.name} (${node.hostname})</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="vm-id" class="form-label">VM ID</label>
                  <input type="number" class="form-control" id="vm-id" placeholder="e.g., 100" value="100" required>
                  <div class="form-text">Usually starts from 100</div>
                </div>
                <div class="col-md-4">
                  <label for="vm-name" class="form-label">VM Name</label>
                  <input type="text" class="form-control" id="vm-name" placeholder="e.g., web-server" required>
                </div>
              </div>
            </div>
            
            <!-- OS and Boot Options -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-compact-disc me-2"></i> OS and Boot Options</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="vm-iso" class="form-label">ISO Image</label>
                  <select class="form-select" id="vm-iso">
                    <option value="" selected disabled>Select an ISO</option>
                    <option value="debian-12.iso">Debian 12 (bookworm)</option>
                    <option value="ubuntu-22.04-live-server-amd64.iso">Ubuntu 22.04 LTS Server</option>
                    <option value="CentOS-Stream-9-latest-x86_64-dvd1.iso">CentOS Stream 9</option>
                    <option value="Windows_Server_2022_x64.iso">Windows Server 2022</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label for="vm-storage" class="form-label">Storage</label>
                  <select class="form-select" id="vm-storage">
                    <option value="local-lvm">local-lvm</option>
                    <option value="local-zfs">local-zfs</option>
                    <option value="ceph">ceph</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Hardware Configuration -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">
                <i class="fas fa-microchip me-2"></i> Hardware Configuration
                <div class="float-end">
                  <div class="btn-group btn-group-sm" role="group">
                    <input type="radio" class="btn-check" name="vm-resource-option" id="vm-resource-predefined" autocomplete="off" checked>
                    <label class="btn btn-outline-primary" for="vm-resource-predefined">Predefined Profiles</label>
                    <input type="radio" class="btn-check" name="vm-resource-option" id="vm-resource-custom" autocomplete="off">
                    <label class="btn btn-outline-primary" for="vm-resource-custom">Custom</label>
                  </div>
                </div>
              </h6>
              
              <!-- Predefined Resource Profiles -->
              <div id="vm-predefined-resources">
                <div class="mb-3">
                  <label for="vm-profile" class="form-label">Resource Profile</label>
                  <select class="form-select" id="vm-profile">
                    <option value="minimal" data-cores="1" data-memory="1024" data-disk="10">Minimal (1 CPU, 1 GB RAM, 10 GB Disk)</option>
                    <option value="small" data-cores="1" data-memory="2048" data-disk="20">Small (1 CPU, 2 GB RAM, 20 GB Disk)</option>
                    <option value="medium" data-cores="2" data-memory="4096" data-disk="40" selected>Medium (2 CPU, 4 GB RAM, 40 GB Disk)</option>
                    <option value="large" data-cores="4" data-memory="8192" data-disk="80">Large (4 CPU, 8 GB RAM, 80 GB Disk)</option>
                    <option value="xlarge" data-cores="8" data-memory="16384" data-disk="160">Extra Large (8 CPU, 16 GB RAM, 160 GB Disk)</option>
                  </select>
                  <div class="form-text">Select a predefined resource profile based on your workload needs</div>
                </div>
              </div>
              
              <!-- Custom Resource Configuration -->
              <div id="vm-custom-resources" style="display: none;">
                <div class="row g-3">
                  <div class="col-md-3">
                    <label for="vm-cores" class="form-label">CPU Cores</label>
                    <input type="number" class="form-control" id="vm-cores" value="2" min="1" max="32" required>
                  </div>
                  <div class="col-md-3">
                    <label for="vm-memory" class="form-label">Memory (MB)</label>
                    <input type="number" class="form-control" id="vm-memory" value="4096" min="512" step="512" required>
                  </div>
                  <div class="col-md-3">
                    <label for="vm-disk" class="form-label">Disk Size (GB)</label>
                    <input type="number" class="form-control" id="vm-disk" value="40" min="8" required>
                  </div>
                  <div class="col-md-3">
                    <label for="vm-cpu-type" class="form-label">CPU Type</label>
                    <select class="form-select" id="vm-cpu-type">
                      <option value="host">Use host CPU (recommended)</option>
                      <option value="kvm64">Generic KVM CPU</option>
                      <option value="qemu64">Generic QEMU 64-bit CPU</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Network Configuration -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-network-wired me-2"></i> Network Configuration</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label for="vm-network-model" class="form-label">Network Model</label>
                  <select class="form-select" id="vm-network-model">
                    <option value="virtio">VirtIO (recommended)</option>
                    <option value="e1000">Intel E1000</option>
                    <option value="rtl8139">Realtek RTL8139</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="vm-bridge" class="form-label">Bridge</label>
                  <select class="form-select" id="vm-bridge">
                    <option value="vmbr0">vmbr0</option>
                    <option value="vmbr1">vmbr1</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="vm-vlan" class="form-label">VLAN Tag</label>
                  <input type="number" class="form-control" id="vm-vlan" placeholder="Leave empty for none">
                  <div class="form-text">Optional VLAN tag</div>
                </div>
              </div>
            </div>
            
            <!-- Advanced Options -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">
                <i class="fas fa-sliders-h me-2"></i> Advanced Options
                <button type="button" class="btn btn-sm btn-outline-secondary float-end" data-bs-toggle="collapse" data-bs-target="#advanced-options">
                  <i class="fas fa-chevron-down"></i> Toggle
                </button>
              </h6>
              <div id="advanced-options" class="collapse">
                <div class="row g-3">
                  <div class="col-md-4">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="vm-start-after-create" checked>
                      <label class="form-check-label" for="vm-start-after-create">Start after creation</label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="vm-qemu-agent" checked>
                      <label class="form-check-label" for="vm-qemu-agent">Enable QEMU agent</label>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="vm-bios-uefi">
                      <label class="form-check-label" for="vm-bios-uefi">Use UEFI (otherwise BIOS)</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Submit Button -->
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button type="button" class="btn btn-outline-secondary me-md-2" onclick="loadView('vm-list')">
                <i class="fas fa-times me-2"></i> Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-plus-circle me-2"></i> Create Virtual Machine
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Add event listener for toggling between predefined and custom resources
    document.getElementById('vm-resource-predefined').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('vm-predefined-resources').style.display = 'block';
        document.getElementById('vm-custom-resources').style.display = 'none';
      }
    });
    
    document.getElementById('vm-resource-custom').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('vm-predefined-resources').style.display = 'none';
        document.getElementById('vm-custom-resources').style.display = 'block';
      }
    });
    
    // Add event listener for profile selection to update form values
    document.getElementById('vm-profile').addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      console.log(`Selected profile: ${selectedOption.value}`);
      console.log(`Cores: ${selectedOption.dataset.cores}, Memory: ${selectedOption.dataset.memory}, Disk: ${selectedOption.dataset.disk}`);
    });
    
    // Add event listener for form submission
    document.getElementById('vm-create-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get resource configuration based on selected option
      let resources = {};
      if (document.getElementById('vm-resource-predefined').checked) {
        const selectedProfile = document.getElementById('vm-profile');
        const option = selectedProfile.options[selectedProfile.selectedIndex];
        resources = {
          cores: option.dataset.cores,
          memory: option.dataset.memory,
          disk: option.dataset.disk
        };
      } else {
        resources = {
          cores: document.getElementById('vm-cores').value,
          memory: document.getElementById('vm-memory').value,
          disk: document.getElementById('vm-disk').value
        };
      }
      
      console.log('VM creation with resources:', resources);
      showNotification('This is a demo. VM creation is not implemented in this version.', 'info');
    });
  }
  
  // LXC Create View
  function loadLXCCreateView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Create LXC Container')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-box me-2"></i> NEW LXC CONTAINER</h5>
        </div>
        <div class="card-body">
          <form id="lxc-create-form">
            <!-- Basic Information -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-info-circle me-2"></i> Basic Information</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label for="lxc-node" class="form-label">Target Node</label>
                  <select class="form-select" id="lxc-node" required>
                    <option value="" selected disabled>Select a node</option>
                    ${state.nodes.map(node => `<option value="${node.id}">${node.name} (${node.hostname})</option>`).join('')}
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="lxc-id" class="form-label">Container ID</label>
                  <input type="number" class="form-control" id="lxc-id" placeholder="e.g., 200" value="200" required>
                  <div class="form-text">Usually starts from 200</div>
                </div>
                <div class="col-md-4">
                  <label for="lxc-name" class="form-label">Container Name</label>
                  <input type="text" class="form-control" id="lxc-name" placeholder="e.g., web-server" required>
                </div>
              </div>
            </div>
            
            <!-- Template and Storage -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-compact-disc me-2"></i> Template and Storage</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="lxc-template" class="form-label">Template</label>
                  <select class="form-select" id="lxc-template" required>
                    <option value="" selected disabled>Select a template</option>
                    <option value="debian-12-standard">Debian 12 (Bookworm)</option>
                    <option value="ubuntu-22.04-standard">Ubuntu 22.04 LTS</option>
                    <option value="centos-9-stream-default">CentOS Stream 9</option>
                    <option value="alpine-3.18-default">Alpine 3.18</option>
                  </select>
                </div>
                <div class="col-md-6">
                  <label for="lxc-storage" class="form-label">Storage</label>
                  <select class="form-select" id="lxc-storage" required>
                    <option value="local-lvm">local-lvm</option>
                    <option value="local-zfs">local-zfs</option>
                    <option value="ceph">ceph</option>
                  </select>
                </div>
              </div>
            </div>
            
            <!-- Resources Configuration -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2">
                <i class="fas fa-microchip me-2"></i> Resources Configuration
                <div class="float-end">
                  <div class="btn-group btn-group-sm" role="group">
                    <input type="radio" class="btn-check" name="lxc-resource-option" id="lxc-resource-predefined" autocomplete="off" checked>
                    <label class="btn btn-outline-primary" for="lxc-resource-predefined">Predefined Profiles</label>
                    <input type="radio" class="btn-check" name="lxc-resource-option" id="lxc-resource-custom" autocomplete="off">
                    <label class="btn btn-outline-primary" for="lxc-resource-custom">Custom</label>
                  </div>
                </div>
              </h6>
              
              <!-- Predefined Resource Profiles -->
              <div id="lxc-predefined-resources">
                <div class="mb-3">
                  <label for="lxc-profile" class="form-label">Resource Profile</label>
                  <select class="form-select" id="lxc-profile">
                    <option value="micro" data-cores="1" data-memory="256" data-swap="0" data-disk="4">Micro (1 CPU, 256 MB RAM, 4 GB Disk)</option>
                    <option value="minimal" data-cores="1" data-memory="512" data-swap="0" data-disk="8" selected>Minimal (1 CPU, 512 MB RAM, 8 GB Disk)</option>
                    <option value="small" data-cores="1" data-memory="1024" data-swap="512" data-disk="10">Small (1 CPU, 1 GB RAM, 512 MB Swap, 10 GB Disk)</option>
                    <option value="medium" data-cores="2" data-memory="2048" data-swap="1024" data-disk="20">Medium (2 CPU, 2 GB RAM, 1 GB Swap, 20 GB Disk)</option>
                    <option value="large" data-cores="4" data-memory="4096" data-swap="2048" data-disk="40">Large (4 CPU, 4 GB RAM, 2 GB Swap, 40 GB Disk)</option>
                  </select>
                  <div class="form-text">LXC containers are typically more lightweight than VMs</div>
                </div>
              </div>
              
              <!-- Custom Resource Configuration -->
              <div id="lxc-custom-resources" style="display: none;">
                <div class="row g-3">
                  <div class="col-md-3">
                    <label for="lxc-cores" class="form-label">CPU Cores</label>
                    <input type="number" class="form-control" id="lxc-cores" value="1" min="1" max="32" required>
                  </div>
                  <div class="col-md-3">
                    <label for="lxc-memory" class="form-label">Memory (MB)</label>
                    <input type="number" class="form-control" id="lxc-memory" value="512" min="128" step="128" required>
                  </div>
                  <div class="col-md-3">
                    <label for="lxc-swap" class="form-label">Swap (MB)</label>
                    <input type="number" class="form-control" id="lxc-swap" value="0" min="0" step="128">
                  </div>
                  <div class="col-md-3">
                    <label for="lxc-disk" class="form-label">Disk Size (GB)</label>
                    <input type="number" class="form-control" id="lxc-disk" value="8" min="1" required>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Network Configuration -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-network-wired me-2"></i> Network Configuration</h6>
              <div class="row g-3">
                <div class="col-md-4">
                  <label for="lxc-net-name" class="form-label">Network Name</label>
                  <input type="text" class="form-control" id="lxc-net-name" value="eth0" required>
                </div>
                <div class="col-md-4">
                  <label for="lxc-bridge" class="form-label">Bridge</label>
                  <select class="form-select" id="lxc-bridge" required>
                    <option value="vmbr0">vmbr0</option>
                    <option value="vmbr1">vmbr1</option>
                  </select>
                </div>
                <div class="col-md-4">
                  <label for="lxc-ip-config" class="form-label">IP Configuration</label>
                  <select class="form-select" id="lxc-ip-config" required>
                    <option value="dhcp">DHCP</option>
                    <option value="static">Static IP</option>
                  </select>
                </div>
                <div class="col-md-6 static-ip-fields" style="display: none;">
                  <label for="lxc-ip" class="form-label">IP Address/CIDR</label>
                  <input type="text" class="form-control" id="lxc-ip" placeholder="e.g., 192.168.1.100/24">
                </div>
                <div class="col-md-6 static-ip-fields" style="display: none;">
                  <label for="lxc-gateway" class="form-label">Gateway</label>
                  <input type="text" class="form-control" id="lxc-gateway" placeholder="e.g., 192.168.1.1">
                </div>
              </div>
            </div>
            
            <!-- DNS Configuration -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-globe me-2"></i> DNS Configuration</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="lxc-hostname" class="form-label">Hostname</label>
                  <input type="text" class="form-control" id="lxc-hostname" placeholder="Container hostname" required>
                </div>
                <div class="col-md-6">
                  <label for="lxc-dns" class="form-label">DNS Servers</label>
                  <input type="text" class="form-control" id="lxc-dns" value="8.8.8.8 8.8.4.4" placeholder="Space separated DNS servers">
                </div>
              </div>
            </div>
            
            <!-- Password and SSH -->
            <div class="mb-4">
              <h6 class="mb-3 border-bottom pb-2"><i class="fas fa-key me-2"></i> Authentication</h6>
              <div class="row g-3">
                <div class="col-md-6">
                  <label for="lxc-password" class="form-label">Root Password</label>
                  <input type="password" class="form-control" id="lxc-password" required>
                </div>
                <div class="col-md-6">
                  <label for="lxc-confirm-password" class="form-label">Confirm Password</label>
                  <input type="password" class="form-control" id="lxc-confirm-password" required>
                </div>
              </div>
              <div class="form-check mt-3">
                <input class="form-check-input" type="checkbox" id="lxc-ssh-keys">
                <label class="form-check-label" for="lxc-ssh-keys">
                  Configure SSH keys (you'll be prompted to add them later)
                </label>
              </div>
            </div>
            
            <!-- Submit Button -->
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button type="button" class="btn btn-outline-secondary me-md-2" onclick="loadView('lxc-list')">
                <i class="fas fa-times me-2"></i> Cancel
              </button>
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-plus-circle me-2"></i> Create Container
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
    
    // Add event listener for IP configuration to toggle static IP fields
    document.getElementById('lxc-ip-config').addEventListener('change', function(e) {
      const staticFields = document.querySelectorAll('.static-ip-fields');
      if (e.target.value === 'static') {
        staticFields.forEach(field => field.style.display = 'block');
      } else {
        staticFields.forEach(field => field.style.display = 'none');
      }
    });
    
    // Add event listener for toggling between predefined and custom resources
    document.getElementById('lxc-resource-predefined').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('lxc-predefined-resources').style.display = 'block';
        document.getElementById('lxc-custom-resources').style.display = 'none';
      }
    });
    
    document.getElementById('lxc-resource-custom').addEventListener('change', function() {
      if (this.checked) {
        document.getElementById('lxc-predefined-resources').style.display = 'none';
        document.getElementById('lxc-custom-resources').style.display = 'block';
      }
    });
    
    // Add event listener for profile selection to update form values
    document.getElementById('lxc-profile').addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      console.log(`Selected profile: ${selectedOption.value}`);
      console.log(`Cores: ${selectedOption.dataset.cores}, Memory: ${selectedOption.dataset.memory}, Swap: ${selectedOption.dataset.swap}, Disk: ${selectedOption.dataset.disk}`);
    });
    
    // Add event listener for form submission
    document.getElementById('lxc-create-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get resource configuration based on selected option
      let resources = {};
      if (document.getElementById('lxc-resource-predefined').checked) {
        const selectedProfile = document.getElementById('lxc-profile');
        const option = selectedProfile.options[selectedProfile.selectedIndex];
        resources = {
          cores: option.dataset.cores,
          memory: option.dataset.memory,
          swap: option.dataset.swap,
          disk: option.dataset.disk
        };
      } else {
        resources = {
          cores: document.getElementById('lxc-cores').value,
          memory: document.getElementById('lxc-memory').value,
          swap: document.getElementById('lxc-swap').value,
          disk: document.getElementById('lxc-disk').value
        };
      }
      
      console.log('Container creation with resources:', resources);
      showNotification('This is a demo. Container creation is not implemented in this version.', 'info');
    });
  }
  
  // Storage View
  function loadStorageView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Storage Management')}
      
      <div class="row mb-4">
        <div class="col-md-6">
          <div class="card glow-border h-100">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-hdd me-2"></i> STORAGE OVERVIEW</h5>
            </div>
            <div class="card-body">
              ${state.nodes.length === 0 ? 
                `<div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i> Please add a node to view available storage.
                </div>` :
                `<div class="table-responsive">
                  <table class="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>Node</th>
                        <th>Total Space</th>
                        <th>Used Space</th>
                        <th>Free Space</th>
                        <th>Usage</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${state.nodes.map(node => `
                        <tr>
                          <td>${node.name}</td>
                          <td>3.0 TB</td>
                          <td>1.2 TB</td>
                          <td>1.8 TB</td>
                          <td>
                            <div class="progress" style="height: 10px;">
                              <div class="progress-bar bg-primary" role="progressbar" style="width: 40%"></div>
                            </div>
                            <small class="text-muted">40%</small>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>`
              }
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card glow-border h-100">
            <div class="card-header">
              <h5 class="mb-0"><i class="fas fa-database me-2"></i> STORAGE POOLS</h5>
            </div>
            <div class="card-body">
              ${state.nodes.length === 0 ? 
                `<div class="alert alert-info">
                  <i class="fas fa-info-circle me-2"></i> Please add a node to view storage pools.
                </div>` :
                `<div class="table-responsive">
                  <table class="table table-dark table-hover">
                    <thead>
                      <tr>
                        <th>Pool</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>local-lvm</td>
                        <td>LVM-Thin</td>
                        <td><span class="badge bg-success">Active</span></td>
                        <td>1.0 TB</td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                        </td>
                      </tr>
                      <tr>
                        <td>local-zfs</td>
                        <td>ZFS</td>
                        <td><span class="badge bg-success">Active</span></td>
                        <td>1.5 TB</td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                        </td>
                      </tr>
                      <tr>
                        <td>ceph-pool</td>
                        <td>RBD</td>
                        <td><span class="badge bg-success">Active</span></td>
                        <td>500 GB</td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i></button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>`
              }
            </div>
          </div>
        </div>
      </div>
      
      <div class="row mb-4">
        <div class="col-12">
          <div class="card glow-border">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-plus-circle me-2"></i> ADD STORAGE</h5>
              <button class="btn btn-sm btn-outline-primary"><i class="fas fa-plus me-2"></i> New Storage</button>
            </div>
            <div class="card-body">
              <form id="add-storage-form">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label for="storage-node" class="form-label">Target Node</label>
                    <select class="form-select" id="storage-node" required>
                      <option value="" selected disabled>Select a node</option>
                      ${state.nodes.map(node => `<option value="${node.id}">${node.name} (${node.hostname})</option>`).join('')}
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label for="storage-id" class="form-label">Storage ID</label>
                    <input type="text" class="form-control" id="storage-id" placeholder="e.g., ceph-pool" required>
                  </div>
                  <div class="col-md-4">
                    <label for="storage-type" class="form-label">Storage Type</label>
                    <select class="form-select" id="storage-type" required>
                      <option value="" selected disabled>Select type</option>
                      <option value="dir">Directory</option>
                      <option value="lvm">LVM</option>
                      <option value="lvmthin">LVM-Thin</option>
                      <option value="zfs">ZFS</option>
                      <option value="ceph">Ceph RBD</option>
                      <option value="nfs">NFS</option>
                      <option value="cifs">CIFS/SMB</option>
                      <option value="glusterfs">GlusterFS</option>
                    </select>
                  </div>
                </div>
                
                <!-- Type-specific fields will be shown here based on selection -->
                <div id="storage-type-fields" class="mt-3">
                  <!-- These fields will be populated dynamically -->
                </div>
                
                <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                  <button type="button" class="btn btn-outline-secondary me-md-2">
                    <i class="fas fa-times me-2"></i> Cancel
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus-circle me-2"></i> Add Storage
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listener for storage form submission
    document.getElementById('add-storage-form').addEventListener('submit', function(e) {
      e.preventDefault();
      showNotification('This is a demo. Storage creation is not implemented in this version.', 'info');
    });
    
    // Add event listener for storage type change
    document.getElementById('storage-type').addEventListener('change', function(e) {
      const storageType = e.target.value;
      const fieldsContainer = document.getElementById('storage-type-fields');
      
      // Different fields based on storage type
      let fields = '';
      switch(storageType) {
        case 'dir':
          fields = `
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Directory Path</label>
                <input type="text" class="form-control" placeholder="/path/to/storage" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Content Types</label>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" checked>
                  <label class="form-check-label">Disk image</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" checked>
                  <label class="form-check-label">ISO image</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="checkbox" checked>
                  <label class="form-check-label">Container template</label>
                </div>
              </div>
            </div>
          `;
          break;
        case 'ceph':
          fields = `
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">Monitor Hosts</label>
                <input type="text" class="form-control" placeholder="mon1.example.com mon2.example.com" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Pool Name</label>
                <input type="text" class="form-control" placeholder="rbd_pool" required>
              </div>
              <div class="col-md-4">
                <label class="form-label">Client ID</label>
                <input type="text" class="form-control" placeholder="admin" required>
              </div>
            </div>
          `;
          break;
        case 'nfs':
          fields = `
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label">Server</label>
                <input type="text" class="form-control" placeholder="nfs.example.com" required>
              </div>
              <div class="col-md-6">
                <label class="form-label">Export Path</label>
                <input type="text" class="form-control" placeholder="/export/path" required>
              </div>
            </div>
          `;
          break;
        default:
          fields = `
            <div class="alert alert-info">
              <i class="fas fa-info-circle me-2"></i> Please select a storage type to see the configuration options.
            </div>
          `;
      }
      
      fieldsContainer.innerHTML = fields;
    });
  }
  
  // Template management view
  function loadTemplatesView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Template Management')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-clone me-2"></i> RESOURCE TEMPLATES</h5>
        </div>
        <div class="card-body">
          <!-- Templates container -->
          <div id="template-container">
            <div class="text-center py-4">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading templates...</span>
              </div>
              <p class="mt-2">Loading templates...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Load templates data from server
    loadTemplateData();
  }
  
  // Function to load template data from API
  async function loadTemplateData() {
    try {
      // Fetch VM templates
      const vmResponse = await fetch('/api/templates/vm');
      if (!vmResponse.ok) {
        throw new Error(`Failed to fetch VM templates: ${vmResponse.statusText}`);
      }
      const vmTemplates = await vmResponse.json();
      
      // Fetch LXC templates
      const lxcResponse = await fetch('/api/templates/lxc');
      if (!lxcResponse.ok) {
        throw new Error(`Failed to fetch LXC templates: ${lxcResponse.statusText}`);
      }
      const lxcTemplates = await lxcResponse.json();
      
      // Render templates
      renderTemplates(vmTemplates, lxcTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      showNotification(`Error loading templates: ${error.message}`, 'error');
      
      // Show error in UI
      const templateContainer = document.getElementById('template-container');
      templateContainer.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i> Error loading templates: ${error.message}
          <div class="mt-3">
            <button class="btn btn-sm btn-outline-danger" onclick="loadTemplateData()">
              <i class="fas fa-sync me-2"></i> Retry
            </button>
          </div>
        </div>
      `;
    }
  }
  
  // Function to render templates in UI
  function renderTemplates(vmTemplates, lxcTemplates) {
    const templateContainer = document.getElementById('template-container');
    if (!templateContainer) return;
    
    templateContainer.innerHTML = `
      <ul class="nav nav-tabs mb-4" id="templateTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button class="nav-link active" id="vm-templates-tab" data-bs-toggle="tab" data-bs-target="#vm-templates" 
            type="button" role="tab" aria-controls="vm-templates" aria-selected="true">
            <i class="fas fa-server me-2"></i> VM Templates
          </button>
        </li>
        <li class="nav-item" role="presentation">
          <button class="nav-link" id="lxc-templates-tab" data-bs-toggle="tab" data-bs-target="#lxc-templates" 
            type="button" role="tab" aria-controls="lxc-templates" aria-selected="false">
            <i class="fas fa-box me-2"></i> LXC Templates
          </button>
        </li>
      </ul>
      
      <div class="tab-content" id="templateTabsContent">
        <div class="tab-pane fade show active" id="vm-templates" role="tabpanel" aria-labelledby="vm-templates-tab">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">
              <i class="fas fa-server me-2"></i> Virtual Machine Templates
              <i class="fas fa-info-circle ms-2 text-info" 
                 data-bs-toggle="tooltip" 
                 title="VM templates define pre-configured resource profiles that can be applied when creating new virtual machines. These templates help standardize VM deployments and save time."></i>
            </h5>
            <button class="btn btn-primary btn-sm" id="add-vm-template" 
                    data-bs-toggle="tooltip" 
                    title="Create a new VM resource template with predefined CPU, memory and disk allocations">
              <i class="fas fa-plus me-2"></i> Add VM Template
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Profile Type</th>
                  <th>CPU Cores</th>
                  <th>Memory (MB)</th>
                  <th>Disk (GB)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="vm-templates-table">
                ${vmTemplates.length === 0 ? 
                  `<tr><td colspan="7" class="text-center">No VM templates found</td></tr>` : 
                  vmTemplates.map(template => `
                    <tr data-template-id="${template.id}">
                      <td>${template.name}</td>
                      <td>${template.profile_type}</td>
                      <td>${template.cores}</td>
                      <td>${template.memory}</td>
                      <td>${template.disk}</td>
                      <td>${template.template_description || ''}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-info edit-vm-template" data-template-id="${template.id}" title="Edit template">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger delete-vm-template" data-template-id="${template.id}" title="Delete template">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
        
        <div class="tab-pane fade" id="lxc-templates" role="tabpanel" aria-labelledby="lxc-templates-tab">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="mb-0">
              <i class="fas fa-box me-2"></i> LXC Container Templates
              <i class="fas fa-info-circle ms-2 text-info" 
                 data-bs-toggle="tooltip" 
                 title="LXC templates are lightweight resource profiles for container creation. They define CPU, memory, swap, and disk allocations for standardized container deployments."></i>
            </h5>
            <button class="btn btn-primary btn-sm" id="add-lxc-template"
                    data-bs-toggle="tooltip" 
                    title="Create a new LXC container resource template with predefined parameters">
              <i class="fas fa-plus me-2"></i> Add LXC Template
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Profile Type</th>
                  <th>CPU Cores</th>
                  <th>Memory (MB)</th>
                  <th>Swap (MB)</th>
                  <th>Disk (GB)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="lxc-templates-table">
                ${lxcTemplates.length === 0 ? 
                  `<tr><td colspan="8" class="text-center">No LXC templates found</td></tr>` : 
                  lxcTemplates.map(template => `
                    <tr data-template-id="${template.id}">
                      <td>${template.name}</td>
                      <td>${template.profile_type}</td>
                      <td>${template.cores}</td>
                      <td>${template.memory}</td>
                      <td>${template.swap}</td>
                      <td>${template.disk}</td>
                      <td>${template.template_description || ''}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-outline-info edit-lxc-template" data-template-id="${template.id}" title="Edit template">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-outline-danger delete-lxc-template" data-template-id="${template.id}" title="Delete template">
                            <i class="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners for template actions
    setupTemplateEventListeners();
  }
  
  // Set up event listeners for template management
  function setupTemplateEventListeners() {
    // Initialize tooltips
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(tooltipTriggerEl => {
      new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Add VM template button
    const addVMTemplateBtn = document.getElementById('add-vm-template');
    if (addVMTemplateBtn) {
      addVMTemplateBtn.addEventListener('click', () => showVMTemplateModal());
    }
    
    // Add LXC template button
    const addLXCTemplateBtn = document.getElementById('add-lxc-template');
    if (addLXCTemplateBtn) {
      addLXCTemplateBtn.addEventListener('click', () => showLXCTemplateModal());
    }
    
    // Edit VM template buttons
    document.querySelectorAll('.edit-vm-template').forEach(button => {
      button.addEventListener('click', (e) => {
        const templateId = e.currentTarget.dataset.templateId;
        editVMTemplate(templateId);
      });
    });
    
    // Delete VM template buttons
    document.querySelectorAll('.delete-vm-template').forEach(button => {
      button.addEventListener('click', (e) => {
        const templateId = e.currentTarget.dataset.templateId;
        deleteVMTemplate(templateId);
      });
    });
    
    // Edit LXC template buttons
    document.querySelectorAll('.edit-lxc-template').forEach(button => {
      button.addEventListener('click', (e) => {
        const templateId = e.currentTarget.dataset.templateId;
        editLXCTemplate(templateId);
      });
    });
    
    // Delete LXC template buttons
    document.querySelectorAll('.delete-lxc-template').forEach(button => {
      button.addEventListener('click', (e) => {
        const templateId = e.currentTarget.dataset.templateId;
        deleteLXCTemplate(templateId);
      });
    });
  }
  
  // Show VM template modal for create/edit
  function showVMTemplateModal(template = null) {
    // Create modal HTML
    const modalId = 'vm-template-modal';
    const modalTitle = template ? 'Edit VM Template' : 'Add VM Template';
    const modalAction = template ? 'update' : 'create';
    
    // Remove existing modal if any
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal element
    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header">
              <h5 class="modal-title" id="${modalId}-label">
                <i class="fas fa-server me-2"></i> ${modalTitle}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="vm-template-form" data-action="${modalAction}" ${template ? `data-template-id="${template.id}"` : ''}>
                <div class="mb-3">
                  <label for="vm-template-name" class="form-label">Template Name</label>
                  <input type="text" class="form-control" id="vm-template-name" value="${template ? template.name : ''}" required>
                  <div class="form-text">A descriptive name for this template</div>
                </div>
                
                <div class="mb-3">
                  <label for="vm-template-profile-type" class="form-label">Profile Type</label>
                  <input type="text" class="form-control" id="vm-template-profile-type" value="${template ? template.profile_type : ''}" required>
                  <div class="form-text">Short identifier for this template (e.g., 'small', 'medium', 'large')</div>
                </div>
                
                <div class="mb-3">
                  <label for="vm-template-cores" class="form-label">CPU Cores</label>
                  <input type="number" class="form-control" id="vm-template-cores" value="${template ? template.cores : '1'}" min="1" max="32" required>
                </div>
                
                <div class="mb-3">
                  <label for="vm-template-memory" class="form-label">Memory (MB)</label>
                  <input type="number" class="form-control" id="vm-template-memory" value="${template ? template.memory : '1024'}" min="512" step="512" required>
                </div>
                
                <div class="mb-3">
                  <label for="vm-template-disk" class="form-label">Disk Size (GB)</label>
                  <input type="number" class="form-control" id="vm-template-disk" value="${template ? template.disk : '10'}" min="1" required>
                </div>
                
                <div class="mb-3">
                  <label for="vm-template-description" class="form-label">Description</label>
                  <textarea class="form-control" id="vm-template-description" rows="3">${template ? template.template_description || '' : ''}</textarea>
                  <div class="form-text">Optional description of the template's purpose or configuration</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="save-vm-template">Save Template</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    
    // Add save event listener
    document.getElementById('save-vm-template').addEventListener('click', async function() {
      await saveVMTemplate();
      modal.hide();
    });
  }
  
  // Save VM template (create or update)
  async function saveVMTemplate() {
    try {
      const form = document.getElementById('vm-template-form');
      const action = form.dataset.action;
      const templateId = form.dataset.templateId;
      
      // Validate form
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      // Get form data
      const templateData = {
        name: document.getElementById('vm-template-name').value,
        profile_type: document.getElementById('vm-template-profile-type').value,
        cores: parseInt(document.getElementById('vm-template-cores').value),
        memory: parseInt(document.getElementById('vm-template-memory').value),
        disk: parseInt(document.getElementById('vm-template-disk').value),
        template_description: document.getElementById('vm-template-description').value
      };
      
      // Create or update template
      let url = '/api/templates/vm';
      let method = 'POST';
      
      if (action === 'update') {
        url = `/api/templates/vm/${templateId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} VM template: ${response.statusText}`);
      }
      
      // Show success notification
      const actionText = action === 'create' ? 'created' : 'updated';
      showNotification(`VM template successfully ${actionText}`, 'success');
      
      // Reload templates
      loadTemplateData();
    } catch (error) {
      console.error('Error saving VM template:', error);
      showNotification(`Failed to save VM template: ${error.message}`, 'error');
    }
  }
  
  // Edit VM template
  async function editVMTemplate(templateId) {
    try {
      const response = await fetch(`/api/templates/vm/${templateId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch VM template: ${response.statusText}`);
      }
      
      const template = await response.json();
      showVMTemplateModal(template);
    } catch (error) {
      console.error('Error editing VM template:', error);
      showNotification(`Failed to edit VM template: ${error.message}`, 'error');
    }
  }
  
  // Delete VM template
  async function deleteVMTemplate(templateId) {
    try {
      // Show confirmation dialog
      if (!confirm('Are you sure you want to delete this VM template? This action cannot be undone.')) {
        return;
      }
      
      const response = await fetch(`/api/templates/vm/${templateId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete VM template: ${response.statusText}`);
      }
      
      // Show success notification
      showNotification('VM template successfully deleted', 'success');
      
      // Reload templates
      loadTemplateData();
    } catch (error) {
      console.error('Error deleting VM template:', error);
      showNotification(`Failed to delete VM template: ${error.message}`, 'error');
    }
  }
  
  // Show LXC template modal for create/edit
  function showLXCTemplateModal(template = null) {
    // Create modal HTML
    const modalId = 'lxc-template-modal';
    const modalTitle = template ? 'Edit LXC Template' : 'Add LXC Template';
    const modalAction = template ? 'update' : 'create';
    
    // Remove existing modal if any
    const existingModal = document.getElementById(modalId);
    if (existingModal) {
      existingModal.remove();
    }
    
    // Create modal element
    const modalHTML = `
      <div class="modal fade" id="${modalId}" tabindex="-1" aria-labelledby="${modalId}-label" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header">
              <h5 class="modal-title" id="${modalId}-label">
                <i class="fas fa-box me-2"></i> ${modalTitle}
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="lxc-template-form" data-action="${modalAction}" ${template ? `data-template-id="${template.id}"` : ''}>
                <div class="mb-3">
                  <label for="lxc-template-name" class="form-label">Template Name</label>
                  <input type="text" class="form-control" id="lxc-template-name" value="${template ? template.name : ''}" required>
                  <div class="form-text">A descriptive name for this template</div>
                </div>
                
                <div class="mb-3">
                  <label for="lxc-template-profile-type" class="form-label">Profile Type</label>
                  <input type="text" class="form-control" id="lxc-template-profile-type" value="${template ? template.profile_type : ''}" required>
                  <div class="form-text">Short identifier for this template (e.g., 'micro', 'small', 'medium')</div>
                </div>
                
                <div class="mb-3">
                  <label for="lxc-template-cores" class="form-label">CPU Cores</label>
                  <input type="number" class="form-control" id="lxc-template-cores" value="${template ? template.cores : '1'}" min="1" max="32" required>
                </div>
                
                <div class="mb-3">
                  <label for="lxc-template-memory" class="form-label">Memory (MB)</label>
                  <input type="number" class="form-control" id="lxc-template-memory" value="${template ? template.memory : '512'}" min="128" step="128" required>
                </div>
                
                <div class="mb-3">
                  <label for="lxc-template-swap" class="form-label">Swap (MB)</label>
                  <input type="number" class="form-control" id="lxc-template-swap" value="${template ? template.swap : '0'}" min="0" step="128" required>
                </div>
                
                <div class="mb-3">
                  <label for="lxc-template-disk" class="form-label">Disk Size (GB)</label>
                  <input type="number" class="form-control" id="lxc-template-disk" value="${template ? template.disk : '8'}" min="1" required>
                </div>
                
                <div class="mb-3">
                  <label for="lxc-template-description" class="form-label">Description</label>
                  <textarea class="form-control" id="lxc-template-description" rows="3">${template ? template.template_description || '' : ''}</textarea>
                  <div class="form-text">Optional description of the template's purpose or configuration</div>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="save-lxc-template">Save Template</button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Initialize modal
    const modal = new bootstrap.Modal(document.getElementById(modalId));
    modal.show();
    
    // Add save event listener
    document.getElementById('save-lxc-template').addEventListener('click', async function() {
      await saveLXCTemplate();
      modal.hide();
    });
  }
  
  // Save LXC template (create or update)
  async function saveLXCTemplate() {
    try {
      const form = document.getElementById('lxc-template-form');
      const action = form.dataset.action;
      const templateId = form.dataset.templateId;
      
      // Validate form
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      
      // Get form data
      const templateData = {
        name: document.getElementById('lxc-template-name').value,
        profile_type: document.getElementById('lxc-template-profile-type').value,
        cores: parseInt(document.getElementById('lxc-template-cores').value),
        memory: parseInt(document.getElementById('lxc-template-memory').value),
        swap: parseInt(document.getElementById('lxc-template-swap').value),
        disk: parseInt(document.getElementById('lxc-template-disk').value),
        template_description: document.getElementById('lxc-template-description').value
      };
      
      // Create or update template
      let url = '/api/templates/lxc';
      let method = 'POST';
      
      if (action === 'update') {
        url = `/api/templates/lxc/${templateId}`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(templateData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} LXC template: ${response.statusText}`);
      }
      
      // Show success notification
      const actionText = action === 'create' ? 'created' : 'updated';
      showNotification(`LXC template successfully ${actionText}`, 'success');
      
      // Reload templates
      loadTemplateData();
    } catch (error) {
      console.error('Error saving LXC template:', error);
      showNotification(`Failed to save LXC template: ${error.message}`, 'error');
    }
  }
  
  // Edit LXC template
  async function editLXCTemplate(templateId) {
    try {
      const response = await fetch(`/api/templates/lxc/${templateId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch LXC template: ${response.statusText}`);
      }
      
      const template = await response.json();
      showLXCTemplateModal(template);
    } catch (error) {
      console.error('Error editing LXC template:', error);
      showNotification(`Failed to edit LXC template: ${error.message}`, 'error');
    }
  }
  
  // Delete LXC template
  async function deleteLXCTemplate(templateId) {
    try {
      // Show confirmation dialog
      if (!confirm('Are you sure you want to delete this LXC template? This action cannot be undone.')) {
        return;
      }
      
      const response = await fetch(`/api/templates/lxc/${templateId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete LXC template: ${response.statusText}`);
      }
      
      // Show success notification
      showNotification('LXC template successfully deleted', 'success');
      
      // Reload templates
      loadTemplateData();
    } catch (error) {
      console.error('Error deleting LXC template:', error);
      showNotification(`Failed to delete LXC template: ${error.message}`, 'error');
    }
  }
  
  // Monitoring view
  function loadMonitoringView() {
    const mainContent = document.querySelector('.main-content');
    
    mainContent.innerHTML = `
      ${getCommonHeader('Resource Monitoring')}
      
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i> SYSTEM PERFORMANCE</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> The monitoring system is being implemented. This will provide real-time charts for CPU, memory, network, and storage usage across your Proxmox infrastructure.
          </div>
          
          <div class="row mt-4">
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0"><i class="fas fa-microchip me-2"></i> CPU Usage</h6>
                </div>
                <div class="card-body">
                  <canvas id="cpu-chart" height="200"></canvas>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0"><i class="fas fa-memory me-2"></i> Memory Usage</h6>
                </div>
                <div class="card-body">
                  <canvas id="memory-chart" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0"><i class="fas fa-network-wired me-2"></i> Network Traffic</h6>
                </div>
                <div class="card-body">
                  <canvas id="network-chart" height="200"></canvas>
                </div>
              </div>
            </div>
            
            <div class="col-md-6 mb-4">
              <div class="card">
                <div class="card-header">
                  <h6 class="mb-0"><i class="fas fa-hdd me-2"></i> Disk I/O</h6>
                </div>
                <div class="card-body">
                  <canvas id="disk-chart" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="card glow-border">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-bell me-2"></i> ALERTS & NOTIFICATIONS</h5>
        </div>
        <div class="card-body">
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i> The alert system is being implemented. This will allow you to set thresholds for resource usage and receive notifications when they are exceeded.
          </div>
          
          <div class="table-responsive mt-4">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Resource</th>
                  <th>Threshold</th>
                  <th>Current Value</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>CPU</td>
                  <td>Node: pve1</td>
                  <td>80%</td>
                  <td>45%</td>
                  <td><span class="badge bg-success">Normal</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
                <tr>
                  <td>Memory</td>
                  <td>Node: pve2</td>
                  <td>90%</td>
                  <td>87%</td>
                  <td><span class="badge bg-warning">Warning</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
                <tr>
                  <td>Disk</td>
                  <td>Storage: local-lvm</td>
                  <td>95%</td>
                  <td>96%</td>
                  <td><span class="badge bg-danger">Critical</span></td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-outline-danger"><i class="fas fa-trash"></i></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Initialize charts if chart.js is loaded
    if (typeof Chart !== 'undefined') {
      initializeCharts();
    } else {
      console.warn('Chart.js is not loaded, charts will not be displayed');
    }
  }
  
  // Initialize resource monitoring charts
  function initializeCharts() {
    try {
      // CPU Chart
      const cpuCtx = document.getElementById('cpu-chart').getContext('2d');
      const cpuChart = new Chart(cpuCtx, {
        type: 'line',
        data: {
          labels: ['5m ago', '4m ago', '3m ago', '2m ago', '1m ago', 'Now'],
          datasets: [{
            label: 'CPU Usage %',
            data: [25, 30, 45, 40, 35, 45],
            borderColor: 'rgba(0, 123, 255, 1)',
            backgroundColor: 'rgba(0, 123, 255, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
      
      // Memory Chart
      const memoryCtx = document.getElementById('memory-chart').getContext('2d');
      const memoryChart = new Chart(memoryCtx, {
        type: 'line',
        data: {
          labels: ['5m ago', '4m ago', '3m ago', '2m ago', '1m ago', 'Now'],
          datasets: [{
            label: 'Memory Usage %',
            data: [60, 65, 70, 75, 80, 87],
            borderColor: 'rgba(40, 167, 69, 1)',
            backgroundColor: 'rgba(40, 167, 69, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              max: 100,
              ticks: {
                callback: function(value) {
                  return value + '%';
                }
              }
            }
          }
        }
      });
      
      // Network Chart
      const networkCtx = document.getElementById('network-chart').getContext('2d');
      const networkChart = new Chart(networkCtx, {
        type: 'line',
        data: {
          labels: ['5m ago', '4m ago', '3m ago', '2m ago', '1m ago', 'Now'],
          datasets: [
            {
              label: 'In (MB/s)',
              data: [2.5, 3.1, 4.2, 3.8, 2.9, 3.5],
              borderColor: 'rgba(23, 162, 184, 1)',
              backgroundColor: 'rgba(23, 162, 184, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Out (MB/s)',
              data: [1.8, 2.2, 2.5, 2.1, 1.9, 2.3],
              borderColor: 'rgba(255, 193, 7, 1)',
              backgroundColor: 'rgba(255, 193, 7, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value + ' MB/s';
                }
              }
            }
          }
        }
      });
      
      // Disk Chart
      const diskCtx = document.getElementById('disk-chart').getContext('2d');
      const diskChart = new Chart(diskCtx, {
        type: 'line',
        data: {
          labels: ['5m ago', '4m ago', '3m ago', '2m ago', '1m ago', 'Now'],
          datasets: [
            {
              label: 'Read (MB/s)',
              data: [8.2, 7.5, 9.1, 12.4, 10.8, 8.6],
              borderColor: 'rgba(111, 66, 193, 1)',
              backgroundColor: 'rgba(111, 66, 193, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            },
            {
              label: 'Write (MB/s)',
              data: [5.1, 6.8, 7.2, 8.5, 7.9, 6.2],
              borderColor: 'rgba(220, 53, 69, 1)',
              backgroundColor: 'rgba(220, 53, 69, 0.1)',
              borderWidth: 2,
              tension: 0.3,
              fill: true
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value + ' MB/s';
                }
              }
            }
          }
        }
      });
      
      // Simulate real-time updates
      setInterval(() => {
        // Update chart data (for demonstration purposes)
        const newCpuValue = Math.floor(Math.random() * 30) + 30; // Random value between 30-60
        cpuChart.data.datasets[0].data.shift();
        cpuChart.data.datasets[0].data.push(newCpuValue);
        cpuChart.update();
        
        const newMemoryValue = Math.floor(Math.random() * 15) + 75; // Random value between 75-90
        memoryChart.data.datasets[0].data.shift();
        memoryChart.data.datasets[0].data.push(newMemoryValue);
        memoryChart.update();
        
        const newNetInValue = Math.random() * 3 + 2; // Random value between 2-5
        const newNetOutValue = Math.random() * 2 + 1; // Random value between 1-3
        networkChart.data.datasets[0].data.shift();
        networkChart.data.datasets[0].data.push(newNetInValue.toFixed(1));
        networkChart.data.datasets[1].data.shift();
        networkChart.data.datasets[1].data.push(newNetOutValue.toFixed(1));
        networkChart.update();
        
        const newDiskReadValue = Math.random() * 8 + 6; // Random value between 6-14
        const newDiskWriteValue = Math.random() * 6 + 4; // Random value between 4-10
        diskChart.data.datasets[0].data.shift();
        diskChart.data.datasets[0].data.push(newDiskReadValue.toFixed(1));
        diskChart.data.datasets[1].data.shift();
        diskChart.data.datasets[1].data.push(newDiskWriteValue.toFixed(1));
        diskChart.update();
      }, 5000);
    } catch (error) {
      console.error('Error initializing charts:', error);
    }
  }
  
  // Start the application with the login screen
  displayLogin();
});