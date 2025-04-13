/**
 * Main Application Entry Point
 * Initializes the application and handles routing
 */

// Application state
const App = {
  // Current view
  currentView: null,
  
  // Authentication data
  auth: null,
  
  // Nodes data
  nodes: [],
  
  // Selected node
  selectedNode: null,
  
  /**
   * Initialize the application
   */
  init() {
    console.log('Initializing Proxmox Manager...');
    
    // Load authentication data from storage
    this.auth = getFromStorage(STORAGE.AUTH_DATA);
    this.selectedNode = getFromStorage(STORAGE.SELECTED_NODE);
    
    // Initialize the UI
    this.initializeUI();
    
    // Handle page load
    this.handlePageLoad();
  },
  
  /**
   * Initialize the UI
   */
  initializeUI() {
    // Get the app container
    this.appContainer = document.getElementById('app');
    
    // Set up event delegation for navigation
    this.appContainer.addEventListener('click', this.handleClick.bind(this));
  },
  
  /**
   * Handle the initial page load
   */
  handlePageLoad() {
    // If the user is authenticated, load the dashboard, otherwise load the login view
    if (this.auth) {
      this.navigateTo(VIEWS.DASHBOARD);
    } else {
      this.navigateTo(VIEWS.LOGIN);
    }
  },
  
  /**
   * Handle clicks on the application
   * @param {Event} event - The click event
   */
  handleClick(event) {
    // Get the clicked element
    const target = event.target.closest('[data-action]');
    
    // If the clicked element has a data-action attribute, handle it
    if (target) {
      const action = target.dataset.action;
      
      // Prevent default behavior
      event.preventDefault();
      
      // Handle the action
      this.handleAction(action, target);
    }
  },
  
  /**
   * Handle an action
   * @param {string} action - The action to handle
   * @param {HTMLElement} element - The element that triggered the action
   */
  handleAction(action, element) {
    // Handle navigation actions
    if (action.startsWith('navigate:')) {
      const view = action.replace('navigate:', '');
      this.navigateTo(view);
      return;
    }
    
    // Handle login
    if (action === 'login') {
      this.handleLogin();
      return;
    }
    
    // Handle logout
    if (action === 'logout') {
      this.handleLogout();
      return;
    }
    
    // Handle adding a node
    if (action === 'add-node') {
      this.handleAddNode();
      return;
    }
    
    // Handle selecting a node
    if (action === 'select-node') {
      const nodeId = Number(element.dataset.nodeId);
      this.selectNode(nodeId);
      return;
    }
    
    // Handle testing a connection
    if (action === 'test-connection') {
      this.handleTestConnection();
      return;
    }
    
    // Other actions can be added here
    console.log(`Unhandled action: ${action}`);
  },
  
  /**
   * Navigate to a view
   * @param {string} view - The view to navigate to
   * @param {Object} params - Parameters for the view
   */
  navigateTo(view, params = {}) {
    // Update current view
    this.currentView = view;
    
    // Render the view
    this.renderView(view, params);
    
    // Update active navigation item
    this.updateActiveNavItem(view);
  },
  
  /**
   * Render a view
   * @param {string} view - The view to render
   * @param {Object} params - Parameters for the view
   */
  renderView(view, params = {}) {
    // Clear the app container
    this.appContainer.innerHTML = '';
    
    // Render the appropriate view
    switch (view) {
      case VIEWS.LOGIN:
        LoginView.render(this.appContainer, params);
        break;
      case VIEWS.DASHBOARD:
        DashboardView.render(this.appContainer, {
          auth: this.auth,
          nodes: this.nodes,
          selectedNode: this.selectedNode
        });
        break;
      case VIEWS.NODES:
        NodesView.render(this.appContainer, {
          nodes: this.nodes,
          auth: this.auth
        });
        break;
      case VIEWS.VM_LIST:
        VMListView.render(this.appContainer, {
          selectedNode: this.selectedNode,
          auth: this.auth
        });
        break;
      case VIEWS.VM_CREATE:
        VMCreateView.render(this.appContainer, {
          selectedNode: this.selectedNode,
          auth: this.auth
        });
        break;
      case VIEWS.LXC_LIST:
        LXCListView.render(this.appContainer, {
          selectedNode: this.selectedNode,
          auth: this.auth
        });
        break;
      case VIEWS.LXC_CREATE:
        LXCCreateView.render(this.appContainer, {
          selectedNode: this.selectedNode,
          auth: this.auth
        });
        break;
      case VIEWS.TEMPLATES:
        TemplatesView.render(this.appContainer, {
          auth: this.auth
        });
        break;
      case VIEWS.MONITORING:
        MonitoringView.render(this.appContainer, {
          nodes: this.nodes,
          selectedNode: this.selectedNode,
          auth: this.auth
        });
        break;
      case VIEWS.SETTINGS:
        SettingsView.render(this.appContainer, {
          auth: this.auth
        });
        break;
      default:
        this.renderErrorView('Page not found');
    }
  },
  
  /**
   * Update the active navigation item
   * @param {string} view - The current view
   */
  updateActiveNavItem(view) {
    // Get all navigation links
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Remove active class from all links
    navLinks.forEach(link => {
      link.classList.remove('active');
    });
    
    // Add active class to the current view's link
    const activeLink = document.querySelector(`[data-action="navigate:${view}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  },
  
  /**
   * Render an error view
   * @param {string} message - The error message
   */
  renderErrorView(message) {
    this.appContainer.innerHTML = `
      <div class="container mt-5">
        <div class="alert alert-danger">
          <h4 class="alert-heading">Error</h4>
          <p>${message}</p>
          <button class="btn btn-primary" data-action="navigate:dashboard">Go to Dashboard</button>
        </div>
      </div>
    `;
  },
  
  /**
   * Handle user login
   */
  async handleLogin() {
    try {
      // Get form data
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      if (!usernameInput || !passwordInput) {
        showNotification('Login form not found', 'danger');
        return;
      }
      
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      
      // Validate inputs
      if (!username || !password) {
        showNotification('Please enter both username and password', 'warning');
        return;
      }
      
      // Show loading state
      const loginButton = document.querySelector('[data-action="login"]');
      if (loginButton) {
        loginButton.disabled = true;
        loginButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Logging in...';
      }
      
      // Attempt to log in
      const response = await api.login(username, password);
      
      // Save authentication data
      this.auth = response.user;
      saveToStorage(STORAGE.AUTH_DATA, this.auth);
      
      // Load nodes
      await this.loadNodes();
      
      // Navigate to dashboard
      this.navigateTo(VIEWS.DASHBOARD);
      
      showNotification('Logged in successfully', 'success');
    } catch (error) {
      showNotification(error.message || 'Login failed', 'danger');
      
      // Reset login button state
      const loginButton = document.querySelector('[data-action="login"]');
      if (loginButton) {
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
      }
    }
  },
  
  /**
   * Handle user logout
   */
  handleLogout() {
    // Clear authentication data
    this.auth = null;
    this.nodes = [];
    this.selectedNode = null;
    
    // Clear storage
    removeFromStorage(STORAGE.AUTH_DATA);
    removeFromStorage(STORAGE.SELECTED_NODE);
    
    // Navigate to login view
    this.navigateTo(VIEWS.LOGIN);
    
    showNotification('Logged out successfully', 'success');
  },
  
  /**
   * Load nodes from the API
   */
  async loadNodes() {
    try {
      // Load nodes from API
      const nodes = await api.getNodes();
      this.nodes = nodes;
      
      // If there are nodes and no selected node, select the first one
      if (nodes.length > 0 && !this.selectedNode) {
        this.selectNode(nodes[0].id);
      }
      
      return nodes;
    } catch (error) {
      console.error('Error loading nodes:', error);
      showNotification('Failed to load nodes', 'danger');
      return [];
    }
  },
  
  /**
   * Select a node
   * @param {number} nodeId - The ID of the node to select
   */
  selectNode(nodeId) {
    // Find the node with the given ID
    const node = this.nodes.find(n => n.id === nodeId);
    
    if (node) {
      // Update selected node
      this.selectedNode = node;
      saveToStorage(STORAGE.SELECTED_NODE, node);
      
      // Update UI
      const selectedNodeElement = document.getElementById('selected-node');
      if (selectedNodeElement) {
        selectedNodeElement.textContent = node.name;
      }
      
      // If current view depends on selected node, refresh it
      if ([VIEWS.VM_LIST, VIEWS.VM_CREATE, VIEWS.LXC_LIST, VIEWS.LXC_CREATE, VIEWS.MONITORING].includes(this.currentView)) {
        this.navigateTo(this.currentView);
      }
      
      showNotification(`Selected node: ${node.name}`, 'success');
    }
  },
  
  /**
   * Handle adding a new node
   */
  async handleAddNode() {
    try {
      // Get form data
      const nameInput = document.getElementById('node-name');
      const hostInput = document.getElementById('api-host');
      const portInput = document.getElementById('api-port');
      const usernameInput = document.getElementById('api-username');
      const passwordInput = document.getElementById('api-password');
      const realmInput = document.getElementById('api-realm');
      const sshHostInput = document.getElementById('ssh-host');
      const sshPortInput = document.getElementById('ssh-port');
      const sshUsernameInput = document.getElementById('ssh-username');
      const sshPasswordInput = document.getElementById('ssh-password');
      const useSSLCheckbox = document.getElementById('use-ssl');
      const verifySSLCheckbox = document.getElementById('verify-ssl');
      
      if (!nameInput || !hostInput || !usernameInput || !passwordInput) {
        showNotification('Node form fields not found', 'danger');
        return;
      }
      
      // Create node object
      const nodeData = {
        name: nameInput.value.trim(),
        api_host: hostInput.value.trim(),
        api_port: portInput?.value ? parseInt(portInput.value, 10) : 8006,
        api_username: usernameInput.value.trim(),
        api_password: passwordInput.value,
        api_realm: realmInput?.value || 'pam',
        ssh_host: sshHostInput?.value?.trim() || hostInput.value.trim(),
        ssh_port: sshPortInput?.value ? parseInt(sshPortInput.value, 10) : 22,
        ssh_username: sshUsernameInput?.value?.trim() || '',
        ssh_password: sshPasswordInput?.value || '',
        use_ssl: useSSLCheckbox?.checked !== false,
        verify_ssl: verifySSLCheckbox?.checked === true,
        user_id: this.auth.id
      };
      
      // Validate required fields
      if (!nodeData.name || !nodeData.api_host || !nodeData.api_username || !nodeData.api_password) {
        showNotification('Please fill all required fields', 'warning');
        return;
      }
      
      // Show loading state
      const submitButton = document.querySelector('[data-action="add-node"]');
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Adding...';
      }
      
      // Add the node
      const node = await api.addNode(nodeData);
      
      // Reload nodes
      await this.loadNodes();
      
      // Close modal if it exists
      const modal = bootstrap.Modal.getInstance(document.getElementById('add-node-modal'));
      if (modal) {
        modal.hide();
      }
      
      // Navigate to nodes view
      this.navigateTo(VIEWS.NODES);
      
      showNotification(`Node "${node.name}" added successfully`, 'success');
    } catch (error) {
      showNotification(error.message || 'Failed to add node', 'danger');
      
      // Reset button state
      const submitButton = document.querySelector('[data-action="add-node"]');
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = 'Add Node';
      }
    }
  },
  
  /**
   * Handle testing connection to a Proxmox API
   */
  async handleTestConnection() {
    try {
      // Get form data
      const hostInput = document.getElementById('api-host');
      const portInput = document.getElementById('api-port');
      const usernameInput = document.getElementById('api-username');
      const passwordInput = document.getElementById('api-password');
      const realmInput = document.getElementById('api-realm');
      const useSSLCheckbox = document.getElementById('use-ssl');
      const verifySSLCheckbox = document.getElementById('verify-ssl');
      
      if (!hostInput || !usernameInput || !passwordInput) {
        showNotification('Connection form fields not found', 'danger');
        return;
      }
      
      // Create connection data object
      const connectionData = {
        host: hostInput.value.trim(),
        port: portInput?.value ? parseInt(portInput.value, 10) : 8006,
        username: usernameInput.value.trim(),
        password: passwordInput.value,
        realm: realmInput?.value || 'pam',
        ssl: useSSLCheckbox?.checked !== false,
        verify: verifySSLCheckbox?.checked === true
      };
      
      // Validate required fields
      if (!connectionData.host || !connectionData.username || !connectionData.password) {
        showNotification('Please fill all required fields', 'warning');
        return;
      }
      
      // Show loading state
      const testButton = document.querySelector('[data-action="test-connection"]');
      if (testButton) {
        testButton.disabled = true;
        testButton.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Testing...';
      }
      
      // Test the connection
      const result = await api.testConnection(connectionData);
      
      // Reset button state
      if (testButton) {
        testButton.disabled = false;
        testButton.innerHTML = '<i class="fas fa-plug me-2"></i> Test Connection';
      }
      
      // Display result
      showNotification(result.message, result.success ? 'success' : 'danger');
      
      // Update connection status if element exists
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        statusElement.innerHTML = result.success
          ? '<span class="badge bg-success"><i class="fas fa-check-circle me-1"></i> Connection Successful</span>'
          : '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Connection Failed</span>';
      }
      
      // Display version info if available
      if (result.success && result.data) {
        const versionElement = document.getElementById('api-version-info');
        if (versionElement) {
          versionElement.innerHTML = `
            <div class="alert alert-info mt-3">
              <h6 class="alert-heading">API Information:</h6>
              <p class="mb-0">
                <strong>Version:</strong> ${result.data.data.version || 'N/A'}<br>
                <strong>Release:</strong> ${result.data.data.release || 'N/A'}<br>
                <strong>API Version:</strong> ${result.data.data.apiversion || 'N/A'}
              </p>
            </div>
          `;
        }
      }
    } catch (error) {
      showNotification(error.message || 'Connection test failed', 'danger');
      
      // Reset button state
      const testButton = document.querySelector('[data-action="test-connection"]');
      if (testButton) {
        testButton.disabled = false;
        testButton.innerHTML = '<i class="fas fa-plug me-2"></i> Test Connection';
      }
      
      // Update connection status if element exists
      const statusElement = document.getElementById('connection-status');
      if (statusElement) {
        statusElement.innerHTML = '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Connection Failed</span>';
      }
    }
  }
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});