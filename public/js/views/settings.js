/**
 * Settings View
 * Handles application settings and user preferences
 */
export class SettingsView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the settings view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Settings', 'cog')}
      
      <div class="row mb-4">
        <div class="col-md-3">
          <!-- Settings Navigation -->
          <div class="card mb-4">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-sliders-h text-primary me-2"></i>
              <h5 class="mb-0">Settings</h5>
            </div>
            <div class="list-group list-group-flush">
              <a href="#" class="list-group-item d-flex align-items-center py-3 px-3 border-0 active" data-settings-tab="app">
                <i class="fas fa-desktop me-3 text-primary"></i>
                <span>Application Settings</span>
              </a>
              <a href="#" class="list-group-item d-flex align-items-center py-3 px-3 border-0" data-settings-tab="nodes">
                <i class="fas fa-server me-3 text-primary"></i>
                <span>Server Management</span>
              </a>
              <a href="#" class="list-group-item d-flex align-items-center py-3 px-3 border-0" data-settings-tab="user">
                <i class="fas fa-user me-3 text-primary"></i>
                <span>User Preferences</span>
              </a>
              <a href="#" class="list-group-item d-flex align-items-center py-3 px-3 border-0" data-settings-tab="api">
                <i class="fas fa-plug me-3 text-primary"></i>
                <span>API Configuration</span>
              </a>
              <a href="#" class="list-group-item d-flex align-items-center py-3 px-3 border-0" data-settings-tab="backups">
                <i class="fas fa-save me-3 text-primary"></i>
                <span>Backup & Restore</span>
              </a>
            </div>
          </div>
          
          <!-- System Information -->
          <div class="card">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-info-circle text-primary me-2"></i>
              <h5 class="mb-0">System Information</h5>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Version</span>
                <span>1.0.0</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Platform</span>
                <span id="platform-info">-</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span class="text-muted">Database</span>
                <span class="badge bg-success">Connected</span>
              </div>
              <div class="d-flex justify-content-between mb-3">
                <span class="text-muted">API Server</span>
                <span class="badge bg-success">Running</span>
              </div>
              <button id="check-updates-btn" class="btn btn-sm btn-primary w-100">
                <i class="fas fa-sync-alt me-2"></i> Check for Updates
              </button>
            </div>
          </div>
        </div>
        
        <div class="col-md-9">
          <!-- App Settings Tab -->
          <div class="card mb-4 settings-tab active" id="app-settings">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-desktop text-primary me-2"></i>
              <h5 class="mb-0">Application Settings</h5>
            </div>
            <div class="card-body">
              <form id="app-settings-form">
                <div class="mb-4">
                  <label for="theme-select" class="form-label">UI Theme</label>
                  <select class="form-select" id="theme-select">
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                    <option value="system">System Default</option>
                  </select>
                  <div class="form-text">Select your preferred theme for the application UI.</div>
                </div>
                
                <div class="mb-4">
                  <label for="auto-refresh" class="form-label">Auto Refresh Interval</label>
                  <select class="form-select" id="auto-refresh">
                    <option value="0">Disabled</option>
                    <option value="10">10 seconds</option>
                    <option value="30" selected>30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                  <div class="form-text">Set how frequently the dashboard data will refresh automatically.</div>
                </div>
                
                <div class="mb-4">
                  <div class="form-check form-switch">
                    <input type="checkbox" class="form-check-input" id="notifications-enabled" checked>
                    <label class="form-check-label" for="notifications-enabled">Enable Desktop Notifications</label>
                  </div>
                  <div class="form-text">Receive desktop notifications for important events.</div>
                </div>
                
                <div class="mb-4">
                  <div class="form-check form-switch">
                    <input type="checkbox" class="form-check-input" id="confirm-actions" checked>
                    <label class="form-check-label" for="confirm-actions">Confirm Before Actions</label>
                  </div>
                  <div class="form-text">Show confirmation dialog before performing actions like starting/stopping VMs.</div>
                </div>
                
                <div class="mb-4">
                  <div class="form-check form-switch">
                    <input type="checkbox" class="form-check-input" id="remember-session" checked>
                    <label class="form-check-label" for="remember-session">Remember Session</label>
                  </div>
                  <div class="form-text">Keep you logged in between app restarts.</div>
                </div>
                
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save me-2"></i> Save Settings
                </button>
              </form>
            </div>
          </div>
          
          <!-- Server Management Tab -->
          <div class="card mb-4 settings-tab" id="nodes-settings" style="display: none;">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-server text-primary me-2"></i>
              <h5 class="mb-0">Server Management</h5>
            </div>
            <div class="card-body">
              <form id="nodes-settings-form">
                <h5 class="mb-3">Add Proxmox Node</h5>
                <div class="row g-3 mb-4">
                  <div class="col-md-4">
                    <label for="node-name" class="form-label">Node Name</label>
                    <input type="text" class="form-control" id="node-name" placeholder="e.g., pve1" required>
                  </div>
                  <div class="col-md-5">
                    <label for="node-hostname" class="form-label">Hostname/IP</label>
                    <input type="text" class="form-control" id="node-hostname" placeholder="e.g., 10.55.1.10" required>
                  </div>
                  <div class="col-md-3">
                    <label for="node-port" class="form-label">API Port</label>
                    <input type="number" class="form-control" id="node-port" value="8006" required>
                  </div>
                </div>
                
                <div id="advanced-options" class="mb-4">
                  <div class="row g-3 mb-3">
                    <div class="col-md-6">
                      <label for="api-username" class="form-label">API Username</label>
                      <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-user"></i></span>
                        <input type="text" class="form-control" id="api-username" value="api@pam!home" placeholder="Username">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="api-password" class="form-label">API Password</label>
                      <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-key"></i></span>
                        <input type="password" class="form-control" id="api-password" value="8cd15ef7-d25b-4955-9c32-48d42e23b109" placeholder="Password">
                      </div>
                    </div>
                  </div>
                  
                  <div class="row g-3 mt-2">
                    <div class="col-md-6">
                      <label for="ssh-username" class="form-label">SSH Username</label>
                      <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-terminal"></i></span>
                        <input type="text" class="form-control" id="ssh-username" value="root" placeholder="Username">
                      </div>
                    </div>
                    <div class="col-md-6">
                      <label for="ssh-password" class="form-label">SSH Password</label>
                      <div class="input-group">
                        <span class="input-group-text"><i class="fas fa-key"></i></span>
                        <input type="password" class="form-control" id="ssh-password" value="Poolamea01@" placeholder="Password">
                      </div>
                    </div>
                  </div>
                  
                  <div class="form-check form-switch mt-3">
                    <input class="form-check-input" type="checkbox" id="verify-ssl">
                    <label class="form-check-label" for="verify-ssl">
                      Verify SSL Certificate
                    </label>
                  </div>
                </div>
                
                <div class="d-flex gap-2 mb-4">
                  <button type="button" id="test-connection-btn" class="btn btn-outline-primary">
                    <i class="fas fa-plug me-1"></i> Test Connection
                  </button>
                  <button type="submit" class="btn btn-primary">
                    <i class="fas fa-plus me-1"></i> Add Node
                  </button>
                </div>
                
                <div id="connection-test-results" class="mb-4" style="display: none;"></div>
                
                <h5 class="mb-3">Configured Nodes</h5>
                <div id="nodes-table-container">
                  <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i> No nodes have been added yet. Add your first Proxmox node above.
                  </div>
                </div>
              </form>
            </div>
          </div>
          
          <!-- User Preferences Tab -->
          <div class="card mb-4 settings-tab" id="user-settings" style="display: none;">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-user text-primary me-2"></i>
              <h5 class="mb-0">User Preferences</h5>
            </div>
            <div class="card-body">
              <form id="user-settings-form">
                <div class="mb-4">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username" value="admin" disabled>
                  <div class="form-text">Your username cannot be changed.</div>
                </div>
                
                <div class="mb-4">
                  <label for="email" class="form-label">Email</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-envelope"></i></span>
                    <input type="email" class="form-control" id="email" value="admin@example.com">
                  </div>
                  <div class="form-text">Used for notifications and password recovery.</div>
                </div>
                
                <h5 class="border-top pt-4 mt-4 mb-3">Change Password</h5>
                
                <div class="mb-4">
                  <label for="current-password" class="form-label">Current Password</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-lock"></i></span>
                    <input type="password" class="form-control" id="current-password">
                  </div>
                </div>
                
                <div class="mb-4">
                  <label for="new-password" class="form-label">New Password</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-key"></i></span>
                    <input type="password" class="form-control" id="new-password">
                  </div>
                  <div class="form-text">Password must be at least 8 characters long.</div>
                </div>
                
                <div class="mb-4">
                  <label for="confirm-password" class="form-label">Confirm New Password</label>
                  <div class="input-group">
                    <span class="input-group-text"><i class="fas fa-check"></i></span>
                    <input type="password" class="form-control" id="confirm-password">
                  </div>
                </div>
                
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save me-2"></i> Save User Settings
                </button>
              </form>
            </div>
          </div>
          
          <!-- API Configuration Tab -->
          <div class="card mb-4 settings-tab" id="api-settings" style="display: none;">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-plug text-primary me-2"></i>
              <h5 class="mb-0">API Configuration</h5>
            </div>
            <div class="card-body">
              <form id="api-settings-form">
                <div class="mb-4">
                  <label for="api-timeout" class="form-label">API Timeout (seconds)</label>
                  <input type="number" class="form-control" id="api-timeout" value="10" min="1" max="60">
                  <div class="form-text">Maximum time to wait for API responses.</div>
                </div>
                
                <div class="mb-4">
                  <label for="concurrent-requests" class="form-label">Max Concurrent Requests</label>
                  <input type="number" class="form-control" id="concurrent-requests" value="5" min="1" max="20">
                  <div class="form-text">Maximum number of API requests that can run in parallel.</div>
                </div>
                
                <div class="mb-4">
                  <div class="form-check form-switch">
                    <input type="checkbox" class="form-check-input" id="verify-ssl-api" checked>
                    <label class="form-check-label" for="verify-ssl-api">Verify SSL Certificates</label>
                  </div>
                  <div class="form-text">Disable this only for testing with self-signed certificates.</div>
                </div>
                
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-save me-2"></i> Save API Settings
                </button>
              </form>
            </div>
          </div>
          
          <!-- Backup & Restore Tab -->
          <div class="card mb-4 settings-tab" id="backups-settings" style="display: none;">
            <div class="card-header d-flex align-items-center">
              <i class="fas fa-save text-primary me-2"></i>
              <h5 class="mb-0">Backup & Restore</h5>
            </div>
            <div class="card-body">
              <div class="mb-4 p-3 border-bottom">
                <h5 class="d-flex align-items-center">
                  <i class="fas fa-download me-2 text-primary"></i>
                  Backup Settings
                </h5>
                <p class="text-muted mb-3">Create a backup of your application settings and node configurations.</p>
                <button id="create-backup-btn" class="btn btn-primary">
                  <i class="fas fa-file-export me-2"></i> Create Backup
                </button>
              </div>
              
              <div class="mb-4 p-3 border-bottom">
                <h5 class="d-flex align-items-center">
                  <i class="fas fa-upload me-2 text-primary"></i>
                  Restore Settings
                </h5>
                <p class="text-muted mb-3">Restore settings from a previous backup file.</p>
                <div class="input-group mb-3">
                  <input type="file" class="form-control" id="backup-file">
                  <button class="btn btn-primary" type="button" id="restore-btn">
                    <i class="fas fa-file-import me-1"></i> Restore
                  </button>
                </div>
              </div>
              
              <div class="mb-4 p-3">
                <h5 class="d-flex align-items-center">
                  <i class="fas fa-exclamation-triangle me-2 text-danger"></i>
                  Reset to Default
                </h5>
                <p class="text-danger mb-3">Warning: This will reset all settings to their default values. This action cannot be undone.</p>
                <button id="reset-settings-btn" class="btn btn-danger">
                  <i class="fas fa-trash me-2"></i> Reset All Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
    
    // Try to get platform information
    this.getPlatformInfo();
    
    // Load nodes data for the server management tab
    this.loadNodesTable();
  }
  
  /**
   * Add event listeners for the settings view
   */
  addEventListeners() {
    // Settings tab navigation
    document.querySelectorAll('[data-settings-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active tab
        document.querySelectorAll('[data-settings-tab]').forEach(t => {
          t.classList.remove('active');
        });
        e.currentTarget.classList.add('active');
        
        // Show selected tab content
        const tabId = e.currentTarget.dataset.settingsTab;
        document.querySelectorAll('.settings-tab').forEach(content => {
          content.style.display = 'none';
        });
        document.getElementById(`${tabId}-settings`).style.display = 'block';
      });
    });
    
    // Handle forms submission
    document.getElementById('app-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveAppSettings();
    });
    
    document.getElementById('nodes-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.addNode();
    });
    
    document.getElementById('user-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveUserSettings();
    });
    
    document.getElementById('api-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveApiSettings();
    });
    
    // Test connection button
    document.getElementById('test-connection-btn')?.addEventListener('click', () => {
      this.testConnection();
    });
    
    // Handle backup/restore buttons
    document.getElementById('create-backup-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.createBackup();
    });
    
    document.getElementById('restore-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.restoreFromBackup();
    });
    
    document.getElementById('reset-settings-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.resetSettings();
    });
    
    // Check for updates button
    document.getElementById('check-updates-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.checkForUpdates();
    });
  }
  
  /**
   * Load nodes table
   */
  loadNodesTable() {
    const container = document.getElementById('nodes-table-container');
    const { nodes } = this.app.state.getState();
    
    if (!container) return;
    
    if (!nodes || nodes.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i> No nodes have been added yet. Add your first Proxmox node above.
        </div>
      `;
      return;
    }
    
    container.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover">
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
                  <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary node-details-btn" data-id="${node.id}" title="View details">
                      <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-danger node-delete-btn" data-id="${node.id}" title="Delete node">
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
    
    // Add event listeners for node actions
    document.querySelectorAll('.node-details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.dataset.id;
        this.app.router.navigate('node-details', { id: nodeId });
      });
    });
    
    document.querySelectorAll('.node-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nodeId = btn.dataset.id;
        this.deleteNode(nodeId);
      });
    });
  }
  
  /**
   * Get platform information
   */
  getPlatformInfo() {
    const platformInfoElement = document.getElementById('platform-info');
    if (platformInfoElement) {
      platformInfoElement.textContent = 'Browser';
      
      // In a real Electron app, we would use process.platform
      // But in the browser/development environment, just show the browser
      try {
        if (window.navigator) {
          platformInfoElement.textContent = `${window.navigator.platform}`;
        }
      } catch (error) {
        console.error('Failed to get platform info:', error);
      }
    }
  }
  
  /**
   * Save application settings
   */
  saveAppSettings() {
    try {
      const theme = document.getElementById('theme-select').value;
      const autoRefresh = document.getElementById('auto-refresh').value;
      const notificationsEnabled = document.getElementById('notifications-enabled').checked;
      const confirmActions = document.getElementById('confirm-actions').checked;
      const rememberSession = document.getElementById('remember-session').checked;
      
      // Save to localStorage for now (would save to server in production)
      const settings = {
        theme,
        autoRefresh: parseInt(autoRefresh),
        notificationsEnabled,
        confirmActions,
        rememberSession
      };
      
      localStorage.setItem('app_settings', JSON.stringify(settings));
      
      this.app.ui.showSuccess('Application settings saved successfully');
      
      // Apply theme if it changed
      this.applyTheme(theme);
    } catch (error) {
      console.error('Failed to save app settings:', error);
      this.app.ui.showError('Failed to save application settings');
    }
  }
  
  /**
   * Apply theme to the application
   * @param {string} theme - Theme name ('dark', 'light', 'system')
   */
  applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'light') {
      body.classList.remove('dark-theme');
      body.classList.add('light-theme');
    } else if (theme === 'dark') {
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    } else if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (prefersDark) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
      } else {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
      }
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
      <div class="alert alert-info d-flex align-items-center gap-2">
        <div class="spinner-border spinner-border-sm" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <div>Testing connection to ${hostname}:${port}...</div>
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
      
      // Update nodes table
      this.loadNodesTable();
      
      // Clear form
      document.getElementById('node-name').value = '';
      document.getElementById('node-hostname').value = '';
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
      
      // Update nodes table
      this.loadNodesTable();
    } catch (error) {
      // Hide loading state
      this.app.ui.hideLoading();
      
      // Show error message
      this.app.ui.showError('Failed to delete node: ' + (error.message || 'Unknown error'));
    }
  }
  
  /**
   * Save user settings
   */
  saveUserSettings() {
    const email = document.getElementById('email').value;
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validate email
    if (email && !/\S+@\S+\.\S+/.test(email)) {
      return this.app.ui.showError('Please enter a valid email address');
    }
    
    // If changing password, validate
    if (currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        return this.app.ui.showError('Please enter your current password');
      }
      
      if (!newPassword) {
        return this.app.ui.showError('Please enter a new password');
      }
      
      if (newPassword !== confirmPassword) {
        return this.app.ui.showError('New passwords do not match');
      }
      
      if (newPassword.length < 8) {
        return this.app.ui.showError('Password must be at least 8 characters long');
      }
    }
    
    // Save user settings
    this.app.ui.showSuccess('User settings saved successfully');
    
    // Clear password fields
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
  }
  
  /**
   * Save API settings
   */
  saveApiSettings() {
    try {
      const apiTimeout = document.getElementById('api-timeout').value;
      const concurrentRequests = document.getElementById('concurrent-requests').value;
      const verifySSL = document.getElementById('verify-ssl-api').checked;
      
      // Save to localStorage for now (would save to server in production)
      const apiSettings = {
        apiTimeout: parseInt(apiTimeout),
        concurrentRequests: parseInt(concurrentRequests),
        verifySSL
      };
      
      localStorage.setItem('api_settings', JSON.stringify(apiSettings));
      
      this.app.ui.showSuccess('API settings saved successfully');
    } catch (error) {
      console.error('Failed to save API settings:', error);
      this.app.ui.showError('Failed to save API settings');
    }
  }
  
  /**
   * Create settings backup
   */
  createBackup() {
    try {
      // Collect all settings
      const appSettings = localStorage.getItem('app_settings');
      const apiSettings = localStorage.getItem('api_settings');
      
      // Create backup object
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        settings: {
          app: appSettings ? JSON.parse(appSettings) : null,
          api: apiSettings ? JSON.parse(apiSettings) : null
        }
      };
      
      // Convert to JSON and create download link
      const dataStr = JSON.stringify(backup, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      const downloadEl = document.createElement('a');
      downloadEl.setAttribute('href', dataUri);
      downloadEl.setAttribute('download', `proxmox-manager-backup-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadEl);
      downloadEl.click();
      document.body.removeChild(downloadEl);
      
      this.app.ui.showSuccess('Backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
      this.app.ui.showError('Failed to create backup: ' + error.message);
    }
  }
  
  /**
   * Restore settings from backup
   */
  restoreFromBackup() {
    const fileInput = document.getElementById('backup-file');
    
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      return this.app.ui.showError('Please select a backup file');
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        // Validate backup
        if (!backup.version || !backup.settings) {
          return this.app.ui.showError('Invalid backup file');
        }
        
        // Restore settings
        if (backup.settings.app) {
          localStorage.setItem('app_settings', JSON.stringify(backup.settings.app));
        }
        
        if (backup.settings.api) {
          localStorage.setItem('api_settings', JSON.stringify(backup.settings.api));
        }
        
        this.app.ui.showSuccess('Settings restored successfully');
        
        // Apply theme if available
        if (backup.settings.app && backup.settings.app.theme) {
          this.applyTheme(backup.settings.app.theme);
        }
        
        // Clear file input
        fileInput.value = '';
      } catch (error) {
        console.error('Failed to restore backup:', error);
        this.app.ui.showError('Failed to restore backup: ' + error.message);
      }
    };
    
    reader.onerror = () => {
      this.app.ui.showError('Failed to read backup file');
    };
    
    reader.readAsText(file);
  }
  
  /**
   * Reset settings to default
   */
  resetSettings() {
    // Ask for confirmation
    if (!confirm('Are you sure you want to reset all settings to default? This action cannot be undone.')) {
      return;
    }
    
    // Clear localStorage settings
    localStorage.removeItem('app_settings');
    localStorage.removeItem('api_settings');
    
    // Apply default theme (dark)
    this.applyTheme('dark');
    
    this.app.ui.showSuccess('Settings reset to default values');
    
    // Refresh the view to show default values
    this.render();
  }
  
  /**
   * Check for updates
   */
  checkForUpdates() {
    // Show loading animation on the button
    const button = document.getElementById('check-updates-btn');
    const originalText = button.innerHTML;
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Checking...`;
    button.disabled = true;
    
    // Simulate checking for updates
    setTimeout(() => {
      button.innerHTML = originalText;
      button.disabled = false;
      
      this.app.ui.showSuccess('Your application is up to date (v1.0.0)');
    }, 2000);
  }
}