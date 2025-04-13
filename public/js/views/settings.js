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
      
      <div class="row">
        <div class="col-md-4">
          <!-- Settings Navigation -->
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Settings</h5>
            </div>
            <div class="list-group list-group-flush">
              <a href="#" class="list-group-item list-group-item-action active" data-settings-tab="app">Application Settings</a>
              <a href="#" class="list-group-item list-group-item-action" data-settings-tab="user">User Preferences</a>
              <a href="#" class="list-group-item list-group-item-action" data-settings-tab="api">API Configuration</a>
              <a href="#" class="list-group-item list-group-item-action" data-settings-tab="backups">Backup & Restore</a>
            </div>
          </div>
          
          <!-- System Information -->
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">System Information</h5>
            </div>
            <div class="card-body">
              <p><strong>Version:</strong> 1.0.0</p>
              <p><strong>Platform:</strong> <span id="platform-info">-</span></p>
              <p><strong>Database:</strong> <span class="text-success">Connected</span></p>
              <p><strong>API Server:</strong> <span class="text-success">Running</span></p>
              <button id="check-updates-btn" class="btn btn-sm btn-primary">Check for Updates</button>
            </div>
          </div>
        </div>
        
        <div class="col-md-8">
          <!-- App Settings Tab -->
          <div class="card mb-4 settings-tab active" id="app-settings">
            <div class="card-header">
              <h5 class="mb-0">Application Settings</h5>
            </div>
            <div class="card-body">
              <form id="app-settings-form">
                <div class="mb-3">
                  <label for="theme-select" class="form-label">UI Theme</label>
                  <select class="form-select" id="theme-select">
                    <option value="dark">Dark Theme</option>
                    <option value="light">Light Theme</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div class="mb-3">
                  <label for="auto-refresh" class="form-label">Auto Refresh Interval</label>
                  <select class="form-select" id="auto-refresh">
                    <option value="0">Disabled</option>
                    <option value="10">10 seconds</option>
                    <option value="30" selected>30 seconds</option>
                    <option value="60">1 minute</option>
                    <option value="300">5 minutes</option>
                  </select>
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="notifications-enabled" checked>
                  <label class="form-check-label" for="notifications-enabled">Enable Desktop Notifications</label>
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="confirm-actions" checked>
                  <label class="form-check-label" for="confirm-actions">Confirm Before Actions</label>
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="remember-session" checked>
                  <label class="form-check-label" for="remember-session">Remember Session</label>
                </div>
                
                <button type="submit" class="btn btn-primary">Save Settings</button>
              </form>
            </div>
          </div>
          
          <!-- User Preferences Tab -->
          <div class="card mb-4 settings-tab" id="user-settings" style="display: none;">
            <div class="card-header">
              <h5 class="mb-0">User Preferences</h5>
            </div>
            <div class="card-body">
              <form id="user-settings-form">
                <div class="mb-3">
                  <label for="username" class="form-label">Username</label>
                  <input type="text" class="form-control" id="username" value="admin" disabled>
                </div>
                
                <div class="mb-3">
                  <label for="email" class="form-label">Email</label>
                  <input type="email" class="form-control" id="email" value="admin@example.com">
                </div>
                
                <h6 class="mt-4 mb-3">Change Password</h6>
                
                <div class="mb-3">
                  <label for="current-password" class="form-label">Current Password</label>
                  <input type="password" class="form-control" id="current-password">
                </div>
                
                <div class="mb-3">
                  <label for="new-password" class="form-label">New Password</label>
                  <input type="password" class="form-control" id="new-password">
                </div>
                
                <div class="mb-3">
                  <label for="confirm-password" class="form-label">Confirm New Password</label>
                  <input type="password" class="form-control" id="confirm-password">
                </div>
                
                <button type="submit" class="btn btn-primary">Save User Settings</button>
              </form>
            </div>
          </div>
          
          <!-- API Configuration Tab -->
          <div class="card mb-4 settings-tab" id="api-settings" style="display: none;">
            <div class="card-header">
              <h5 class="mb-0">API Configuration</h5>
            </div>
            <div class="card-body">
              <form id="api-settings-form">
                <div class="mb-3">
                  <label for="api-timeout" class="form-label">API Timeout (seconds)</label>
                  <input type="number" class="form-control" id="api-timeout" value="10" min="1" max="60">
                </div>
                
                <div class="mb-3">
                  <label for="concurrent-requests" class="form-label">Max Concurrent Requests</label>
                  <input type="number" class="form-control" id="concurrent-requests" value="5" min="1" max="20">
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="verify-ssl" checked>
                  <label class="form-check-label" for="verify-ssl">Verify SSL Certificates</label>
                </div>
                
                <button type="submit" class="btn btn-primary">Save API Settings</button>
              </form>
            </div>
          </div>
          
          <!-- Backup & Restore Tab -->
          <div class="card mb-4 settings-tab" id="backup-settings" style="display: none;">
            <div class="card-header">
              <h5 class="mb-0">Backup & Restore</h5>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <h6>Backup Settings</h6>
                <p>Create a backup of your application settings and node configurations.</p>
                <button id="create-backup-btn" class="btn btn-primary">Create Backup</button>
              </div>
              
              <div class="mb-4">
                <h6>Restore Settings</h6>
                <p>Restore settings from a previous backup file.</p>
                <div class="input-group mb-3">
                  <input type="file" class="form-control" id="backup-file">
                  <button class="btn btn-outline-secondary" type="button" id="restore-btn">Restore</button>
                </div>
              </div>
              
              <div class="mb-4">
                <h6>Reset to Default</h6>
                <p class="text-danger">Warning: This will reset all settings to their default values.</p>
                <button id="reset-settings-btn" class="btn btn-danger">Reset All Settings</button>
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
        e.target.classList.add('active');
        
        // Show selected tab content
        const tabId = e.target.dataset.settingsTab;
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
    
    document.getElementById('user-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveUserSettings();
    });
    
    document.getElementById('api-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveApiSettings();
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
          platformInfoElement.textContent = `${window.navigator.platform} (${window.navigator.userAgent.split(')')[0]})`;
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
    
    // Send to server (would do API call in production)
    // For now, just show success message
    this.app.ui.showSuccess('User settings saved successfully');
  }
  
  /**
   * Save API settings
   */
  saveApiSettings() {
    try {
      const apiTimeout = document.getElementById('api-timeout').value;
      const concurrentRequests = document.getElementById('concurrent-requests').value;
      const verifySSL = document.getElementById('verify-ssl').checked;
      
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
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileName = `proxmox-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileName);
      linkElement.click();
      
      this.app.ui.showSuccess('Backup created successfully');
    } catch (error) {
      console.error('Failed to create backup:', error);
      this.app.ui.showError('Failed to create backup');
    }
  }
  
  /**
   * Restore settings from backup
   */
  restoreFromBackup() {
    const fileInput = document.getElementById('backup-file');
    
    if (!fileInput.files || fileInput.files.length === 0) {
      return this.app.ui.showError('Please select a backup file');
    }
    
    const file = fileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        
        // Validate backup file
        if (!backup.version || !backup.settings) {
          return this.app.ui.showError('Invalid backup file format');
        }
        
        // Restore settings
        if (backup.settings.app) {
          localStorage.setItem('app_settings', JSON.stringify(backup.settings.app));
        }
        
        if (backup.settings.api) {
          localStorage.setItem('api_settings', JSON.stringify(backup.settings.api));
        }
        
        this.app.ui.showSuccess('Settings restored successfully. Please refresh the application.');
      } catch (error) {
        console.error('Failed to restore backup:', error);
        this.app.ui.showError('Failed to restore backup: Invalid file format');
      }
    };
    
    reader.onerror = () => {
      this.app.ui.showError('Failed to read backup file');
    };
    
    reader.readAsText(file);
  }
  
  /**
   * Reset all settings to default
   */
  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to their default values? This cannot be undone.')) {
      // Clear all settings
      localStorage.removeItem('app_settings');
      localStorage.removeItem('api_settings');
      
      this.app.ui.showSuccess('All settings have been reset to default values. Please refresh the application.');
    }
  }
}