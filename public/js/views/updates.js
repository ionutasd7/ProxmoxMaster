/**
 * Updates View
 * Displays system updates available for Proxmox nodes
 */
export class UpdatesView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the updates view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes } = this.app.state.getState();
    
    if (!nodes || nodes.length === 0) {
      mainContent.innerHTML = `
        ${this.app.ui.createPageHeader('Updates', 'sync')}
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          No nodes available. Please add a node first.
        </div>
      `;
      return;
    }
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Updates', 'sync')}
      
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">System Updates</h5>
          <div>
            <button type="button" class="btn btn-sm btn-primary me-2" id="refresh-updates-btn">
              <i class="fas fa-sync me-1"></i> Refresh
            </button>
            <select class="form-select form-select-sm d-inline-block w-auto" id="node-select">
              ${nodes.map(node => `<option value="${node.id}">${node.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body">
          <div id="updates-data">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Checking for updates...</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="row">
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Update Settings</h5>
            </div>
            <div class="card-body">
              <form id="update-settings-form">
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="auto-updates" checked>
                  <label class="form-check-label" for="auto-updates">Enable automatic updates</label>
                </div>
                
                <div class="mb-3">
                  <label for="update-schedule" class="form-label">Update Schedule</label>
                  <select class="form-select" id="update-schedule">
                    <option value="daily">Daily</option>
                    <option value="weekly" selected>Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="never">Never</option>
                  </select>
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="security-only" checked>
                  <label class="form-check-label" for="security-only">Security updates only</label>
                </div>
                
                <div class="mb-3 form-check">
                  <input type="checkbox" class="form-check-input" id="reboot-after-update">
                  <label class="form-check-label" for="reboot-after-update">Reboot after updates if needed</label>
                </div>
                
                <button type="submit" class="btn btn-primary">Save Settings</button>
              </form>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-header">
              <h5 class="mb-0">Update History</h5>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-striped">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody id="update-history">
                    <tr>
                      <td colspan="4" class="text-center">No update history available</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
    
    // Load updates data for the first node
    if (nodes.length > 0) {
      this.simulateUpdatesCheck(nodes[0].id);
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Node select change
    document.getElementById('node-select')?.addEventListener('change', (e) => {
      const nodeId = e.target.value;
      this.simulateUpdatesCheck(nodeId);
    });
    
    // Refresh button
    document.getElementById('refresh-updates-btn')?.addEventListener('click', () => {
      const nodeId = document.getElementById('node-select').value;
      this.simulateUpdatesCheck(nodeId);
    });
    
    // Update settings form
    document.getElementById('update-settings-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.app.ui.showSuccess('Update settings saved successfully');
    });
  }
  
  /**
   * Simulate checking for updates
   * @param {number} nodeId - Node ID
   */
  async simulateUpdatesCheck(nodeId) {
    try {
      const updatesDataElement = document.getElementById('updates-data');
      
      // Show loading
      updatesDataElement.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Checking for updates...</p>
        </div>
      `;
      
      // Get node details
      const node = this.app.state.getState().nodes.find(n => n.id == nodeId);
      
      if (!node) {
        updatesDataElement.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            Node not found.
          </div>
        `;
        return;
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Display placeholder data
      updatesDataElement.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle me-2"></i>
          Your Proxmox node <strong>${node.name}</strong> is up to date.
        </div>
        
        <div class="mt-4">
          <h6>System Information</h6>
          <div class="row mt-3">
            <div class="col-md-6">
              <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Proxmox VE Version</span>
                  <span class="badge bg-secondary">8.0.3</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Kernel Version</span>
                  <span class="badge bg-secondary">6.5.11-1-pve</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Last Update Check</span>
                  <span class="badge bg-secondary">Today at ${new Date().toLocaleTimeString()}</span>
                </li>
              </ul>
            </div>
            <div class="col-md-6">
              <ul class="list-group">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Security Updates</span>
                  <span class="badge bg-success">0 available</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Package Updates</span>
                  <span class="badge bg-success">0 available</span>
                </li>
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>Next Scheduled Update</span>
                  <span class="badge bg-secondary">Sunday, Apr 20</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="mt-4">
          <div class="d-flex justify-content-center">
            <button class="btn btn-primary me-2">
              <i class="fas fa-download me-1"></i> Check for Updates
            </button>
            <button class="btn btn-outline-primary">
              <i class="fas fa-history me-1"></i> View Update History
            </button>
          </div>
        </div>
      `;
      
      // Update the update history table for demonstration
      document.getElementById('update-history').innerHTML = `
        <tr>
          <td>Apr 06, 2025</td>
          <td>Security</td>
          <td><span class="badge bg-success">Completed</span></td>
          <td><button class="btn btn-sm btn-outline-info">Details</button></td>
        </tr>
        <tr>
          <td>Mar 23, 2025</td>
          <td>System</td>
          <td><span class="badge bg-success">Completed</span></td>
          <td><button class="btn btn-sm btn-outline-info">Details</button></td>
        </tr>
        <tr>
          <td>Mar 09, 2025</td>
          <td>Security</td>
          <td><span class="badge bg-success">Completed</span></td>
          <td><button class="btn btn-sm btn-outline-info">Details</button></td>
        </tr>
      `;
      
      // Add event listeners for the new buttons
      document.querySelector('button.btn-primary').addEventListener('click', () => {
        this.simulateUpdatesCheck(nodeId);
      });
      
      document.querySelector('button.btn-outline-primary').addEventListener('click', () => {
        this.app.ui.showSuccess('Update history view will be available in a future release');
      });
      
      document.querySelectorAll('.btn-outline-info').forEach(btn => {
        btn.addEventListener('click', () => {
          this.app.ui.showSuccess('Update details view will be available in a future release');
        });
      });
      
    } catch (error) {
      console.error('Error checking for updates:', error);
      document.getElementById('updates-data').innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          Failed to check for updates: ${error.message}
        </div>
      `;
    }
  }
}