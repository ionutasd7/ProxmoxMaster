/**
 * VM List View Component
 * Renders the list of virtual machines for a selected node
 */

const VMListView = {
  /**
   * Render the VM list view
   * @param {HTMLElement} container - The container element
   * @param {Object} params - View parameters including selectedNode and auth
   */
  render(container, params = {}) {
    const { selectedNode, auth } = params;
    
    // Create dashboard container
    const dashboardContainer = createElement('div', { className: 'dashboard-container' });
    
    // Add sidebar
    dashboardContainer.appendChild(DashboardView.renderSidebar(auth, selectedNode));
    
    // Create main content element
    const mainContent = createElement('div', { className: 'main-content' });
    
    // Add grid background
    mainContent.appendChild(createElement('div', { className: 'grid-bg' }));
    
    // Check if a node is selected
    if (!selectedNode) {
      mainContent.innerHTML += this.renderNoNodeSelected();
    } else {
      mainContent.innerHTML += this.renderVMListContent(selectedNode);
    }
    
    // Add main content to dashboard container
    dashboardContainer.appendChild(mainContent);
    
    // Add the dashboard container to the main container
    container.appendChild(dashboardContainer);
    
    // If a node is selected, load VM data
    if (selectedNode) {
      this.loadVMsData(selectedNode);
    }
  },
  
  /**
   * Render content for when no node is selected
   * @returns {string} HTML string for no node selected content
   */
  renderNoNodeSelected() {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-desktop me-3"></i> VIRTUAL MACHINES</h1>
      </div>
      
      <div class="alert alert-warning">
        <h4 class="alert-heading"><i class="fas fa-exclamation-triangle me-2"></i> No Node Selected</h4>
        <p>Please select a Proxmox node to view virtual machines.</p>
        <button class="btn btn-primary" data-action="navigate:nodes">
          <i class="fas fa-server me-2"></i> Select Node
        </button>
      </div>
    `;
  },
  
  /**
   * Render VM list content
   * @param {Object} selectedNode - The selected node
   * @returns {string} HTML string for VM list content
   */
  renderVMListContent(selectedNode) {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-desktop me-3"></i> VIRTUAL MACHINES</h1>
        <div class="d-flex align-items-center">
          <div class="me-3 glow-border px-3 py-2 rounded">
            <i class="fas fa-server me-1"></i> ${selectedNode.name}
          </div>
          <div class="dropdown">
            <button class="btn btn-outline-primary dropdown-toggle" type="button" id="vmActionsDropdown" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="fas fa-cog me-2"></i> Actions
            </button>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="vmActionsDropdown">
              <li>
                <button class="dropdown-item" data-action="navigate:vm-create">
                  <i class="fas fa-plus-circle me-2"></i> Create VM
                </button>
              </li>
              <li>
                <button class="dropdown-item" id="refresh-vms-btn">
                  <i class="fas fa-sync me-2"></i> Refresh List
                </button>
              </li>
              <li><hr class="dropdown-divider"></li>
              <li>
                <button class="dropdown-item" data-action="navigate:templates">
                  <i class="fas fa-copy me-2"></i> Manage Templates
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- VM Filters and Search -->
      <div class="card mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-filter me-2"></i> Filters</h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-4 mb-3">
              <label for="vm-status-filter" class="form-label">Status</label>
              <select class="form-select" id="vm-status-filter">
                <option value="all" selected>All</option>
                <option value="running">Running</option>
                <option value="stopped">Stopped</option>
                <option value="paused">Paused</option>
              </select>
            </div>
            <div class="col-md-8 mb-3">
              <label for="vm-search" class="form-label">Search</label>
              <input type="text" class="form-control" id="vm-search" placeholder="Search by name, ID, or description...">
            </div>
          </div>
          <div class="text-end">
            <button class="btn btn-outline-primary" id="apply-vm-filters">
              <i class="fas fa-search me-2"></i> Apply Filters
            </button>
          </div>
        </div>
      </div>
      
      <!-- VM List -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-desktop me-2"></i> Virtual Machines</h5>
          <span class="badge bg-primary" id="vm-count">Loading...</span>
        </div>
        <div class="card-body p-0">
          <div id="vm-loading" class="text-center p-4">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading virtual machines...</p>
          </div>
          <div id="vm-list-container" style="display: none;">
            <div class="table-responsive">
              <table class="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>VMID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th>vCPU</th>
                    <th>Memory</th>
                    <th>Disk</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="vm-table-body">
                  <!-- VM rows will be inserted here -->
                </tbody>
              </table>
            </div>
          </div>
          <div id="no-vms-message" class="alert alert-info m-3" style="display: none;">
            <i class="fas fa-info-circle me-2"></i> No virtual machines found on this node.
          </div>
        </div>
      </div>
      
      <!-- VM Details Modal -->
      <div class="modal fade" id="vm-details-modal" tabindex="-1" aria-labelledby="vm-details-modal-label" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="vm-details-modal-label">VM Details</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body" id="vm-details-content">
              <!-- VM details will be inserted here -->
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <div class="btn-group">
                <button type="button" class="btn btn-success" id="vm-start-btn">
                  <i class="fas fa-play me-2"></i> Start
                </button>
                <button type="button" class="btn btn-warning" id="vm-stop-btn">
                  <i class="fas fa-stop me-2"></i> Stop
                </button>
                <button type="button" class="btn btn-danger" id="vm-shutdown-btn">
                  <i class="fas fa-power-off me-2"></i> Shutdown
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },
  
  /**
   * Load VMs data for a node
   * @param {Object} node - The node to load VMs from
   */
  async loadVMsData(node) {
    try {
      // Show loading state
      const loadingElement = document.getElementById('vm-loading');
      const vmListContainer = document.getElementById('vm-list-container');
      const noVmsMessage = document.getElementById('no-vms-message');
      
      if (loadingElement) loadingElement.style.display = 'block';
      if (vmListContainer) vmListContainer.style.display = 'none';
      if (noVmsMessage) noVmsMessage.style.display = 'none';
      
      // Load VMs from API
      // Note: In future API implementation, these parameters will be used correctly
      const vms = await api.getVMs(node.id, node.name);
      
      // Hide loading state
      if (loadingElement) loadingElement.style.display = 'none';
      
      // Update VM count
      const vmCountElement = document.getElementById('vm-count');
      if (vmCountElement) {
        vmCountElement.textContent = `${vms.length} VMs`;
      }
      
      // If no VMs found, show message
      if (vms.length === 0) {
        if (noVmsMessage) noVmsMessage.style.display = 'block';
        return;
      }
      
      // Show VM list container
      if (vmListContainer) vmListContainer.style.display = 'block';
      
      // Render VM rows
      const vmTableBody = document.getElementById('vm-table-body');
      if (vmTableBody) {
        vmTableBody.innerHTML = vms.map(vm => this.renderVMRow(vm)).join('');
      }
      
      // Set up event listeners for VM actions
      this.setupVMActionListeners(vms);
    } catch (error) {
      console.error('Error loading VMs data:', error);
      showNotification('Failed to load virtual machines', 'danger');
      
      // Hide loading state
      const loadingElement = document.getElementById('vm-loading');
      if (loadingElement) loadingElement.style.display = 'none';
      
      // Show error message
      const noVmsMessage = document.getElementById('no-vms-message');
      if (noVmsMessage) {
        noVmsMessage.className = 'alert alert-danger m-3';
        noVmsMessage.innerHTML = `
          <i class="fas fa-exclamation-circle me-2"></i> Error loading virtual machines: ${error.message}
        `;
        noVmsMessage.style.display = 'block';
      }
    }
  },
  
  /**
   * Render a VM table row
   * @param {Object} vm - The VM data
   * @returns {string} HTML string for VM row
   */
  renderVMRow(vm) {
    const statusObj = getStatusObject(vm.status);
    
    return `
      <tr data-vmid="${vm.vmid}">
        <td>${vm.vmid}</td>
        <td>
          <strong>${vm.name || `VM ${vm.vmid}`}</strong>
          ${vm.description ? `<br><small class="text-muted">${vm.description}</small>` : ''}
        </td>
        <td>
          <span class="badge ${statusObj.class}">
            <i class="fas fa-${statusObj.icon} me-1"></i> ${statusObj.label}
          </span>
        </td>
        <td>${vm.cpus || '-'}</td>
        <td>${vm.maxmem ? formatBytes(vm.maxmem) : '-'}</td>
        <td>${vm.maxdisk ? formatBytes(vm.maxdisk) : '-'}</td>
        <td>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary vm-details-btn" data-vmid="${vm.vmid}">
              <i class="fas fa-info-circle"></i>
            </button>
            <button class="btn btn-outline-success vm-start-btn" data-vmid="${vm.vmid}" ${vm.status === 'running' ? 'disabled' : ''}>
              <i class="fas fa-play"></i>
            </button>
            <button class="btn btn-outline-warning vm-stop-btn" data-vmid="${vm.vmid}" ${vm.status === 'stopped' ? 'disabled' : ''}>
              <i class="fas fa-stop"></i>
            </button>
            <button class="btn btn-outline-danger vm-delete-btn" data-vmid="${vm.vmid}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  },
  
  /**
   * Set up event listeners for VM actions
   * @param {Array} vms - The list of VMs
   */
  setupVMActionListeners(vms) {
    // Refresh button
    const refreshButton = document.getElementById('refresh-vms-btn');
    if (refreshButton && App.selectedNode) {
      refreshButton.addEventListener('click', () => {
        this.loadVMsData(App.selectedNode);
        showNotification('Refreshing virtual machines...', 'info');
      });
    }
    
    // Filter application
    const applyFiltersButton = document.getElementById('apply-vm-filters');
    if (applyFiltersButton) {
      applyFiltersButton.addEventListener('click', () => {
        this.applyVMFilters(vms);
      });
    }
    
    // VM search input
    const searchInput = document.getElementById('vm-search');
    if (searchInput) {
      searchInput.addEventListener('keyup', (event) => {
        if (event.key === 'Enter') {
          this.applyVMFilters(vms);
        }
      });
    }
    
    // VM details buttons
    const detailsButtons = document.querySelectorAll('.vm-details-btn');
    detailsButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const vmid = event.currentTarget.dataset.vmid;
        const vm = vms.find(v => v.vmid === parseInt(vmid));
        if (vm) {
          this.showVMDetailsModal(vm);
        }
      });
    });
    
    // VM start buttons
    const startButtons = document.querySelectorAll('.vm-start-btn');
    startButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const vmid = event.currentTarget.dataset.vmid;
        showNotification(`Starting VM ${vmid}... (API implementation pending)`, 'info');
      });
    });
    
    // VM stop buttons
    const stopButtons = document.querySelectorAll('.vm-stop-btn');
    stopButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const vmid = event.currentTarget.dataset.vmid;
        showNotification(`Stopping VM ${vmid}... (API implementation pending)`, 'info');
      });
    });
    
    // VM delete buttons
    const deleteButtons = document.querySelectorAll('.vm-delete-btn');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const vmid = event.currentTarget.dataset.vmid;
        showNotification(`Delete VM ${vmid} (API implementation pending)`, 'warning');
      });
    });
  },
  
  /**
   * Apply filters to the VM list
   * @param {Array} vms - The complete list of VMs
   */
  applyVMFilters(vms) {
    // Get filter values
    const statusFilter = document.getElementById('vm-status-filter')?.value || 'all';
    const searchValue = document.getElementById('vm-search')?.value.toLowerCase() || '';
    
    // Filter VMs
    const filteredVMs = vms.filter(vm => {
      // Status filter
      if (statusFilter !== 'all') {
        const vmStatus = vm.status?.toLowerCase() || '';
        if (statusFilter === 'running' && vmStatus !== 'running') return false;
        if (statusFilter === 'stopped' && vmStatus !== 'stopped') return false;
        if (statusFilter === 'paused' && vmStatus !== 'paused') return false;
      }
      
      // Search filter
      if (searchValue) {
        const vmName = vm.name?.toLowerCase() || '';
        const vmDesc = vm.description?.toLowerCase() || '';
        const vmId = vm.vmid.toString();
        
        if (!vmName.includes(searchValue) && 
            !vmDesc.includes(searchValue) && 
            !vmId.includes(searchValue)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Update VM table
    const vmTableBody = document.getElementById('vm-table-body');
    if (vmTableBody) {
      vmTableBody.innerHTML = filteredVMs.map(vm => this.renderVMRow(vm)).join('');
    }
    
    // Update count
    const vmCountElement = document.getElementById('vm-count');
    if (vmCountElement) {
      vmCountElement.textContent = `${filteredVMs.length} / ${vms.length} VMs`;
    }
    
    // Show/hide no VMs message
    const vmListContainer = document.getElementById('vm-list-container');
    const noVmsMessage = document.getElementById('no-vms-message');
    
    if (filteredVMs.length === 0) {
      if (vmListContainer) vmListContainer.style.display = 'none';
      if (noVmsMessage) {
        noVmsMessage.className = 'alert alert-info m-3';
        noVmsMessage.innerHTML = `
          <i class="fas fa-info-circle me-2"></i> No virtual machines match the current filters.
        `;
        noVmsMessage.style.display = 'block';
      }
    } else {
      if (vmListContainer) vmListContainer.style.display = 'block';
      if (noVmsMessage) noVmsMessage.style.display = 'none';
      
      // Re-attach event listeners
      this.setupVMActionListeners(vms);
    }
    
    showNotification(`Filters applied: ${filteredVMs.length} VMs found`, 'success');
  },
  
  /**
   * Show VM details modal
   * @param {Object} vm - The VM data
   */
  showVMDetailsModal(vm) {
    const modal = document.getElementById('vm-details-modal');
    const modalTitle = document.getElementById('vm-details-modal-label');
    const modalContent = document.getElementById('vm-details-content');
    
    if (!modal || !modalTitle || !modalContent) return;
    
    // Set modal title
    modalTitle.textContent = vm.name || `VM ${vm.vmid}`;
    
    // Set modal content
    modalContent.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="mb-3">
            <h6 class="fw-bold">General Information</h6>
            <table class="table table-sm">
              <tr>
                <td width="40%">VMID</td>
                <td>${vm.vmid}</td>
              </tr>
              <tr>
                <td>Name</td>
                <td>${vm.name || '-'}</td>
              </tr>
              <tr>
                <td>Description</td>
                <td>${vm.description || '-'}</td>
              </tr>
              <tr>
                <td>Status</td>
                <td>${getStatusBadgeHTML(vm.status)}</td>
              </tr>
              <tr>
                <td>Node</td>
                <td>${vm.node || '-'}</td>
              </tr>
              <tr>
                <td>Uptime</td>
                <td>${vm.uptime ? this.formatUptime(vm.uptime) : '-'}</td>
              </tr>
            </table>
          </div>
        </div>
        <div class="col-md-6">
          <div class="mb-3">
            <h6 class="fw-bold">Resources</h6>
            <table class="table table-sm">
              <tr>
                <td width="40%">CPUs</td>
                <td>${vm.cpus || '-'}</td>
              </tr>
              <tr>
                <td>Memory</td>
                <td>${vm.maxmem ? formatBytes(vm.maxmem) : '-'}</td>
              </tr>
              <tr>
                <td>Disk</td>
                <td>${vm.maxdisk ? formatBytes(vm.maxdisk) : '-'}</td>
              </tr>
              <tr>
                <td>Network</td>
                <td>${vm.netin ? formatBytes(vm.netin) + '/s' : '-'} in / ${vm.netout ? formatBytes(vm.netout) + '/s' : '-'} out</td>
              </tr>
              <tr>
                <td>CPU Usage</td>
                <td>
                  <div class="progress" style="height: 15px;">
                    <div class="progress-bar bg-primary" role="progressbar" style="width: ${vm.cpu ? Math.round(vm.cpu * 100) : 0}%;">
                      ${vm.cpu ? Math.round(vm.cpu * 100) + '%' : 'N/A'}
                    </div>
                  </div>
                </td>
              </tr>
              <tr>
                <td>Memory Usage</td>
                <td>
                  <div class="progress" style="height: 15px;">
                    <div class="progress-bar bg-success" role="progressbar" 
                         style="width: ${vm.mem && vm.maxmem ? Math.round((vm.mem / vm.maxmem) * 100) : 0}%;">
                      ${vm.mem && vm.maxmem ? Math.round((vm.mem / vm.maxmem) * 100) + '%' : 'N/A'}
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </div>
      </div>
      <div class="row">
        <div class="col-12">
          <div class="mb-3">
            <h6 class="fw-bold">Configuration</h6>
            <table class="table table-sm">
              <tr>
                <td width="20%">OS Type</td>
                <td>${vm.ostype || '-'}</td>
              </tr>
              <tr>
                <td>Boot Order</td>
                <td>${vm.boot || '-'}</td>
              </tr>
              <tr>
                <td>BIOS</td>
                <td>${vm.bios || '-'}</td>
              </tr>
              <tr>
                <td>Machine</td>
                <td>${vm.machine || '-'}</td>
              </tr>
              <tr>
                <td>CPU Type</td>
                <td>${vm.cputype || '-'}</td>
              </tr>
            </table>
          </div>
        </div>
      </div>
    `;
    
    // Set button states based on VM status
    const startButton = document.getElementById('vm-start-btn');
    const stopButton = document.getElementById('vm-stop-btn');
    const shutdownButton = document.getElementById('vm-shutdown-btn');
    
    if (startButton) {
      startButton.disabled = vm.status === 'running';
    }
    
    if (stopButton) {
      stopButton.disabled = vm.status === 'stopped';
    }
    
    if (shutdownButton) {
      shutdownButton.disabled = vm.status === 'stopped';
    }
    
    // Show the modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  },
  
  /**
   * Format uptime in seconds to a human-readable string
   * @param {number} seconds - Uptime in seconds
   * @returns {string} Formatted uptime
   */
  formatUptime(seconds) {
    if (!seconds) return '-';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    let result = '';
    if (days > 0) result += `${days}d `;
    if (hours > 0 || days > 0) result += `${hours}h `;
    result += `${minutes}m`;
    
    return result.trim();
  }
};