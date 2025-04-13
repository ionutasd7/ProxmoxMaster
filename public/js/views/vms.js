/**
 * VMs View
 * Displays a list of all virtual machines across all nodes
 */
export class VMsView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the VMs view
   */
  render() {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Get current state
    const { nodes, vms } = this.app.state.getState();
    
    // Set main content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('Virtual Machines', 'desktop')}
      
      <!-- VM Management -->
      ${this.getVMManagementHTML(nodes)}
      
      <!-- VMs List -->
      ${this.getVMsListHTML(vms, nodes)}
    `;
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Render VM details
   * @param {number} vmId - VM ID
   */
  renderDetails(vmId) {
    // Create main layout
    const mainContent = this.app.ui.createLayout();
    
    // Set content
    mainContent.innerHTML = `
      ${this.app.ui.createPageHeader('VM Details', 'desktop')}
      
      <div class="alert alert-info mb-4">
        <i class="fas fa-info-circle me-2"></i> VM details functionality is under development.
      </div>
      
      <div class="text-center">
        <button class="btn btn-primary" id="back-to-vms-btn">
          <i class="fas fa-arrow-left me-2"></i> Back to VMs
        </button>
      </div>
    `;
    
    // Add back button listener
    document.getElementById('back-to-vms-btn').addEventListener('click', () => {
      this.app.router.navigate('vms');
    });
  }
  
  /**
   * Get VM management HTML
   * @param {Array} nodes - Nodes
   * @returns {string} VM management HTML
   */
  getVMManagementHTML(nodes) {
    return this.app.ui.createCard('VM Management', `
      <div class="row mb-4">
        <div class="col-md-8">
          <h5 class="mb-3">Quick Actions</h5>
          <div class="btn-group">
            <button class="btn btn-outline-primary" id="create-vm-btn">
              <i class="fas fa-plus me-1"></i> Create VM
            </button>
            <button class="btn btn-outline-primary" id="templates-btn">
              <i class="fas fa-clone me-1"></i> Templates
            </button>
            <button class="btn btn-outline-primary" id="batch-actions-btn">
              <i class="fas fa-tasks me-1"></i> Batch Actions
            </button>
          </div>
        </div>
        <div class="col-md-4">
          <h5 class="mb-3">Filter by Node</h5>
          <select class="form-control" id="node-filter">
            <option value="all">All Nodes</option>
            ${nodes.map(node => `<option value="${node.id}">${node.name}</option>`).join('')}
          </select>
        </div>
      </div>
      
      <div class="row">
        <div class="col-12">
          <div class="mb-3">
            <div class="input-group">
              <span class="input-group-text bg-dark border-secondary">
                <i class="fas fa-search text-muted"></i>
              </span>
              <input type="text" class="form-control" id="vm-search" placeholder="Search VMs...">
            </div>
          </div>
        </div>
      </div>
    `, 'cogs');
  }
  
  /**
   * Get VMs list HTML
   * @param {Array} vms - VMs
   * @param {Array} nodes - Nodes
   * @returns {string} VMs list HTML
   */
  getVMsListHTML(vms, nodes) {
    // Create a node name lookup
    const nodeMap = {};
    nodes.forEach(node => {
      nodeMap[node.id] = node.name;
    });
    
    if (vms.length === 0) {
      return this.app.ui.createCard('No Virtual Machines Found', `
        <div class="alert alert-info mb-0">
          <i class="fas fa-info-circle me-2"></i> No virtual machines have been found on any node.
        </div>
        <div class="text-center mt-3">
          <button class="btn btn-primary" id="create-first-vm-btn">
            <i class="fas fa-plus me-2"></i> Create Your First VM
          </button>
        </div>
      `, 'desktop');
    }
    
    return this.app.ui.createCard('Virtual Machines', `
      <div class="table-responsive">
        <table class="custom-table" id="vms-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Node</th>
              <th>Status</th>
              <th>Memory</th>
              <th>CPU</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${vms.map(vm => `
              <tr data-vm-id="${vm.vmid}" data-node-id="${vm.node || ''}">
                <td>${vm.vmid}</td>
                <td>${vm.name || `VM ${vm.vmid}`}</td>
                <td>${vm.node ? (nodeMap[vm.node] || vm.node) : 'Unknown'}</td>
                <td>${this.app.ui.getStatusBadge(vm.status || 'Unknown')}</td>
                <td>${vm.maxmem ? this.app.ui.formatBytes(vm.maxmem) : 'Unknown'}</td>
                <td>${vm.maxcpu || 'Unknown'} vCPU</td>
                <td>
                  <div class="btn-group">
                    <button class="btn btn-sm btn-outline-primary vm-details-btn" data-id="${vm.vmid}" title="View details">
                      <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-success vm-start-btn ${vm.status === 'running' ? 'disabled' : ''}" data-id="${vm.vmid}" data-node="${vm.node || ''}" title="Start VM">
                      <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning vm-stop-btn ${vm.status !== 'running' ? 'disabled' : ''}" data-id="${vm.vmid}" data-node="${vm.node || ''}" title="Stop VM">
                      <i class="fas fa-stop"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger vm-delete-btn" data-id="${vm.vmid}" data-node="${vm.node || ''}" title="Delete VM">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `, 'desktop');
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Create VM button
    const createVMBtn = document.getElementById('create-vm-btn');
    if (createVMBtn) {
      createVMBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Create VM functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Create first VM button
    const createFirstVMBtn = document.getElementById('create-first-vm-btn');
    if (createFirstVMBtn) {
      createFirstVMBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Create VM functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Templates button
    const templatesBtn = document.getElementById('templates-btn');
    if (templatesBtn) {
      templatesBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Templates functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Batch actions button
    const batchActionsBtn = document.getElementById('batch-actions-btn');
    if (batchActionsBtn) {
      batchActionsBtn.addEventListener('click', () => {
        this.app.ui.showNotification('Batch actions functionality is under development.', 'info', 'Coming Soon');
      });
    }
    
    // Node filter
    const nodeFilter = document.getElementById('node-filter');
    if (nodeFilter) {
      nodeFilter.addEventListener('change', () => {
        this.filterVMs();
      });
    }
    
    // VM search
    const vmSearch = document.getElementById('vm-search');
    if (vmSearch) {
      vmSearch.addEventListener('input', () => {
        this.filterVMs();
      });
    }
    
    // VM details buttons
    const vmDetailsBtns = document.querySelectorAll('.vm-details-btn');
    vmDetailsBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        this.app.router.navigate('vm-details', { id: vmId });
      });
    });
    
    // VM start buttons
    const vmStartBtns = document.querySelectorAll('.vm-start-btn:not(.disabled)');
    vmStartBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        const nodeId = btn.dataset.node;
        this.app.ui.showNotification('Start VM functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // VM stop buttons
    const vmStopBtns = document.querySelectorAll('.vm-stop-btn:not(.disabled)');
    vmStopBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        const nodeId = btn.dataset.node;
        this.app.ui.showNotification('Stop VM functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // VM delete buttons
    const vmDeleteBtns = document.querySelectorAll('.vm-delete-btn');
    vmDeleteBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const vmId = btn.dataset.id;
        const nodeId = btn.dataset.node;
        this.app.ui.showNotification('Delete VM functionality is under development.', 'info', 'Coming Soon');
      });
    });
    
    // Refresh button
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.app.loadAppData().then(() => {
          this.render();
          this.app.ui.showSuccess('Data refreshed successfully');
        });
      });
    }
  }
  
  /**
   * Filter VMs based on search and node filter
   */
  filterVMs() {
    const nodeFilter = document.getElementById('node-filter');
    const vmSearch = document.getElementById('vm-search');
    const vmsTable = document.getElementById('vms-table');
    
    if (!nodeFilter || !vmSearch || !vmsTable) {
      return;
    }
    
    const nodeValue = nodeFilter.value;
    const searchValue = vmSearch.value.toLowerCase();
    
    // Get all VM rows
    const rows = vmsTable.querySelectorAll('tbody tr');
    
    // Filter rows
    rows.forEach(row => {
      const vmId = row.dataset.vmId;
      const nodeId = row.dataset.nodeId;
      const vmName = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      
      // Check if row matches filters
      const matchesNode = nodeValue === 'all' || nodeId === nodeValue;
      const matchesSearch = !searchValue || vmId.includes(searchValue) || vmName.includes(searchValue);
      
      // Show/hide row
      row.style.display = matchesNode && matchesSearch ? '' : 'none';
    });
  }
}