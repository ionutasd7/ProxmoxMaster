/**
 * Network View
 * Displays network interfaces and configurations
 */
export class NetworkView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the network view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes } = this.app.state.getState();
    
    if (!nodes || nodes.length === 0) {
      mainContent.innerHTML = `
        ${this.app.ui.createPageHeader('Network', 'network-wired')}
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i>
          No nodes available. Please add a node first.
        </div>
      `;
      return;
    }
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Network', 'network-wired')}
      
      <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0">Network Interfaces</h5>
          <div>
            <button type="button" class="btn btn-sm btn-primary me-2" id="refresh-network-btn">
              <i class="fas fa-sync me-1"></i> Refresh
            </button>
            <select class="form-select form-select-sm d-inline-block w-auto" id="node-select">
              ${nodes.map(node => `<option value="${node.id}">${node.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="card-body">
          <div id="network-data">
            <div class="text-center py-5">
              <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Loading network data...</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add event listeners
    this.addEventListeners();
    
    // Load network data for the first node
    if (nodes.length > 0) {
      this.loadNetworkData(nodes[0].id);
    }
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Node select change
    document.getElementById('node-select')?.addEventListener('change', (e) => {
      const nodeId = e.target.value;
      this.loadNetworkData(nodeId);
    });
    
    // Refresh button
    document.getElementById('refresh-network-btn')?.addEventListener('click', () => {
      const nodeId = document.getElementById('node-select').value;
      this.loadNetworkData(nodeId);
    });
  }
  
  /**
   * Load network data for a node
   * @param {number} nodeId - Node ID
   */
  async loadNetworkData(nodeId) {
    try {
      const networkDataElement = document.getElementById('network-data');
      
      // Show loading
      networkDataElement.innerHTML = `
        <div class="text-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Loading network data...</p>
        </div>
      `;
      
      // Get node details
      const node = this.app.state.getState().nodes.find(n => n.id == nodeId);
      
      if (!node) {
        networkDataElement.innerHTML = `
          <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            Node not found.
          </div>
        `;
        return;
      }
      
      // Get network data
      const networkData = await this.app.api.getNodeNetwork(nodeId);
      
      if (!networkData.success || !networkData.network || networkData.network.length === 0) {
        networkDataElement.innerHTML = `
          <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            No network interfaces found for this node.
          </div>
        `;
        return;
      }
      
      // Render network data
      networkDataElement.innerHTML = `
        <div class="table-responsive">
          <table class="table table-hover table-striped">
            <thead>
              <tr>
                <th>Interface</th>
                <th>Type</th>
                <th>Status</th>
                <th>IP Address</th>
                <th>Subnet</th>
                <th>MAC Address</th>
                <th>MTU</th>
                <th>Bridge Ports</th>
              </tr>
            </thead>
            <tbody>
              ${networkData.network.map(iface => {
                const statusColor = iface.active ? 'success' : 'danger';
                const statusText = iface.active ? 'Up' : 'Down';
                
                return `
                  <tr>
                    <td>${iface.iface}</td>
                    <td>${iface.type}</td>
                    <td><span class="badge bg-${statusColor}">${statusText}</span></td>
                    <td>${iface.address || '-'}</td>
                    <td>${iface.netmask || '-'}</td>
                    <td>${iface.hwaddr || '-'}</td>
                    <td>${iface.mtu || '-'}</td>
                    <td>${iface.bridge_ports || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="mt-4">
          <h6>Network Statistics</h6>
          <div class="row mt-3">
            <div class="col-md-6">
              <div class="card border-0 bg-dark mb-3">
                <div class="card-body">
                  <h6 class="text-muted mb-3">Traffic In</h6>
                  <div class="d-flex align-items-center">
                    <i class="fas fa-arrow-down text-success me-3" style="font-size: 24px;"></i>
                    <div>
                      <h4 class="mb-0">
                        ${this.formatNetworkTraffic(networkData.network.reduce((sum, iface) => sum + (iface.statistics?.rx_bytes || 0), 0))}
                      </h4>
                      <small class="text-muted">
                        ${this.formatNetworkRate(networkData.network.reduce((sum, iface) => sum + (iface.statistics?.rx_rate || 0), 0))}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="card border-0 bg-dark mb-3">
                <div class="card-body">
                  <h6 class="text-muted mb-3">Traffic Out</h6>
                  <div class="d-flex align-items-center">
                    <i class="fas fa-arrow-up text-primary me-3" style="font-size: 24px;"></i>
                    <div>
                      <h4 class="mb-0">
                        ${this.formatNetworkTraffic(networkData.network.reduce((sum, iface) => sum + (iface.statistics?.tx_bytes || 0), 0))}
                      </h4>
                      <small class="text-muted">
                        ${this.formatNetworkRate(networkData.network.reduce((sum, iface) => sum + (iface.statistics?.tx_rate || 0), 0))}
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to load network data:', error);
      document.getElementById('network-data').innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle me-2"></i>
          Failed to load network data: ${error.message}
        </div>
      `;
    }
  }
  
  /**
   * Format network traffic in a human-readable format
   * @param {number} bytes - Traffic in bytes
   * @returns {string} Formatted traffic
   */
  formatNetworkTraffic(bytes) {
    return this.app.ui.formatBytes(bytes);
  }
  
  /**
   * Format network rate in a human-readable format
   * @param {number} bytesPerSecond - Traffic rate in bytes per second
   * @returns {string} Formatted traffic rate
   */
  formatNetworkRate(bytesPerSecond) {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(2)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else if (bytesPerSecond < 1024 * 1024 * 1024) {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024 * 1024)).toFixed(2)} GB/s`;
    }
  }
}