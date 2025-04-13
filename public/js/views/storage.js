/**
 * Storage View
 * Displays node storage resources and configurations
 */
export class StorageView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the storage view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes } = this.app.state.getState();
    
    if (!nodes || nodes.length === 0) {
      mainContent.innerHTML = `
        ${this.app.ui.createPageHeader('Storage', 'hdd')}
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          No nodes available. Please add a node first.
        </div>
      `;
      return;
    }
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Storage', 'hdd')}
      
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Storage Resources</h5>
          <div>
            <button type="button" class="btn btn-sm btn-primary me-2" id="refresh-storage-btn">
              <i class="fas fa-sync me-1"></i> Refresh
            </button>
            <select class="form-select form-select-sm d-inline-block w-auto" id="node-select">
              ${nodes.map(node => `<option value="${node.id}">${node.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body">
          <div id="storage-data">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading storage data...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
    
    // Load storage data for the first node
    if (nodes.length > 0) {
      this.loadStorageData(nodes[0].id);
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Node select change
    document.getElementById('node-select')?.addEventListener('change', (e) => {
      const nodeId = e.target.value;
      this.loadStorageData(nodeId);
    });
    
    // Refresh button
    document.getElementById('refresh-storage-btn')?.addEventListener('click', () => {
      const nodeId = document.getElementById('node-select').value;
      this.loadStorageData(nodeId);
    });
  }
  
  /**
   * Load storage data for a node
   * @param {number} nodeId - Node ID
   */
  async loadStorageData(nodeId) {
    try {
      const storageDataElement = document.getElementById('storage-data');
      
      // Show loading
      storageDataElement.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading storage data...</p>
        </div>
      `;
      
      // Get node details
      const node = this.app.state.getState().nodes.find(n => n.id == nodeId);
      
      if (!node) {
        storageDataElement.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            Node not found.
          </div>
        `;
        return;
      }
      
      // Get storage data
      const storageData = await this.app.api.getNodeStorage(nodeId);
      
      if (!storageData.success || !storageData.storage || storageData.storage.length === 0) {
        storageDataElement.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No storage resources found for this node.
          </div>
        `;
        return;
      }
      
      // Render storage data
      storageDataElement.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover table-striped">
            <thead>
              <tr>
                <th>Storage</th>
                <th>Type</th>
                <th>Status</th>
                <th>Total</th>
                <th>Used</th>
                <th>Available</th>
                <th>% Used</th>
                <th>Content</th>
              </tr>
            </thead>
            <tbody>
              ${storageData.storage.map(storage => {
                const usedPercent = storage.maxdisk > 0 ? Math.round((storage.disk / storage.maxdisk) * 100) : 0;
                const statusColor = storage.active ? 'success' : 'danger';
                const statusText = storage.active ? 'Active' : 'Inactive';
                
                return `
                  <tr>
                    <td>${storage.storage}</td>
                    <td>${storage.type}</td>
                    <td><span class="badge bg-${statusColor}">${statusText}</span></td>
                    <td>${this.app.ui.formatBytes(storage.maxdisk)}</td>
                    <td>${this.app.ui.formatBytes(storage.disk)}</td>
                    <td>${this.app.ui.formatBytes(storage.maxdisk - storage.disk)}</td>
                    <td>
                      <div class="progress" style="height: 5px;">
                        <div class="progress-bar ${usedPercent > 85 ? 'bg-danger' : usedPercent > 70 ? 'bg-warning' : 'bg-success'}" 
                             role="progressbar" 
                             style="width: ${usedPercent}%"
                             aria-valuenow="${usedPercent}" 
                             aria-valuemin="0" 
                             aria-valuemax="100"></div>
                      </div>
                      <small class="mt-1 d-block">${usedPercent}%</small>
                    </td>
                    <td>${storage.content.join(', ')}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load storage data:', error);
      document.getElementById('storage-data').innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          Failed to load storage data: ${error.message}
        </div>
      `;
    }
  }
}