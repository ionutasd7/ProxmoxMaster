/**
 * Template Manager Component
 * Provides UI for managing VM and LXC templates
 */

function TemplateManager({ authData, refreshData, setError }) {
  /**
   * Initializes template manager component
   * Displays VM and LXC templates with CRUD operations
   */
  function init() {
    // Load data from server
    loadTemplateData();
    
    // Setup event listeners
    setupEventListeners();
  }
  
  /**
   * Load template data from server
   */
  async function loadTemplateData() {
    try {
      // Get VM templates
      const vmTemplatesResponse = await fetch('/api/templates/vm', {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      if (!vmTemplatesResponse.ok) {
        throw new Error(`Failed to fetch VM templates: ${vmTemplatesResponse.statusText}`);
      }
      
      const vmTemplates = await vmTemplatesResponse.json();
      
      // Get LXC templates
      const lxcTemplatesResponse = await fetch('/api/templates/lxc', {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      if (!lxcTemplatesResponse.ok) {
        throw new Error(`Failed to fetch LXC templates: ${lxcTemplatesResponse.statusText}`);
      }
      
      const lxcTemplates = await lxcTemplatesResponse.json();
      
      // Render templates
      renderTemplates(vmTemplates, lxcTemplates);
    } catch (error) {
      console.error('Error loading template data:', error);
      setError(`Failed to load templates: ${error.message}`);
    }
  }
  
  /**
   * Render templates in UI
   * @param {Array} vmTemplates - VM templates
   * @param {Array} lxcTemplates - LXC templates
   */
  function renderTemplates(vmTemplates, lxcTemplates) {
    const templateContainer = document.getElementById('template-container');
    if (!templateContainer) return;
    
    // Create tabs for VM and LXC templates
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
            <h5 class="mb-0"><i class="fas fa-server me-2"></i> Virtual Machine Templates</h5>
            <button class="btn btn-primary btn-sm" id="add-vm-template">
              <i class="fas fa-plus me-2"></i> Add VM Template
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Cores</th>
                  <th>Memory (MB)</th>
                  <th>Disk (GB)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="vm-templates-table">
                ${vmTemplates.length === 0 ? 
                  `<tr><td colspan="6" class="text-center">No VM templates found</td></tr>` : 
                  vmTemplates.map(template => `
                    <tr data-template-id="${template.id}">
                      <td>${template.name}</td>
                      <td>${template.cores}</td>
                      <td>${template.memory}</td>
                      <td>${template.disk}</td>
                      <td>${template.template_description || ''}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-info edit-vm-template" data-template-id="${template.id}" title="Edit template">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-danger delete-vm-template" data-template-id="${template.id}" title="Delete template">
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
            <h5 class="mb-0"><i class="fas fa-box me-2"></i> LXC Container Templates</h5>
            <button class="btn btn-primary btn-sm" id="add-lxc-template">
              <i class="fas fa-plus me-2"></i> Add LXC Template
            </button>
          </div>
          
          <div class="table-responsive">
            <table class="table table-dark table-hover">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Cores</th>
                  <th>Memory (MB)</th>
                  <th>Swap (MB)</th>
                  <th>Disk (GB)</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="lxc-templates-table">
                ${lxcTemplates.length === 0 ? 
                  `<tr><td colspan="7" class="text-center">No LXC templates found</td></tr>` : 
                  lxcTemplates.map(template => `
                    <tr data-template-id="${template.id}">
                      <td>${template.name}</td>
                      <td>${template.cores}</td>
                      <td>${template.memory}</td>
                      <td>${template.swap}</td>
                      <td>${template.disk}</td>
                      <td>${template.template_description || ''}</td>
                      <td>
                        <div class="btn-group btn-group-sm">
                          <button class="btn btn-info edit-lxc-template" data-template-id="${template.id}" title="Edit template">
                            <i class="fas fa-edit"></i>
                          </button>
                          <button class="btn btn-danger delete-lxc-template" data-template-id="${template.id}" title="Delete template">
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
  }
  
  /**
   * Setup event listeners for template management
   */
  function setupEventListeners() {
    // Event delegation for dynamic elements
    document.addEventListener('click', function(event) {
      // Add VM template
      if (event.target.id === 'add-vm-template' || event.target.closest('#add-vm-template')) {
        showVMTemplateModal();
      }
      
      // Edit VM template
      if (event.target.classList.contains('edit-vm-template') || event.target.closest('.edit-vm-template')) {
        const button = event.target.closest('.edit-vm-template');
        const templateId = button.dataset.templateId;
        editVMTemplate(templateId);
      }
      
      // Delete VM template
      if (event.target.classList.contains('delete-vm-template') || event.target.closest('.delete-vm-template')) {
        const button = event.target.closest('.delete-vm-template');
        const templateId = button.dataset.templateId;
        deleteVMTemplate(templateId);
      }
      
      // Add LXC template
      if (event.target.id === 'add-lxc-template' || event.target.closest('#add-lxc-template')) {
        showLXCTemplateModal();
      }
      
      // Edit LXC template
      if (event.target.classList.contains('edit-lxc-template') || event.target.closest('.edit-lxc-template')) {
        const button = event.target.closest('.edit-lxc-template');
        const templateId = button.dataset.templateId;
        editLXCTemplate(templateId);
      }
      
      // Delete LXC template
      if (event.target.classList.contains('delete-lxc-template') || event.target.closest('.delete-lxc-template')) {
        const button = event.target.closest('.delete-lxc-template');
        const templateId = button.dataset.templateId;
        deleteLXCTemplate(templateId);
      }
    });
  }
  
  /**
   * Show VM template modal for create/edit
   * @param {Object} template - Template data for edit, null for create
   */
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
  
  /**
   * Save VM template (create or update)
   */
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
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
      setError(`Failed to save VM template: ${error.message}`);
    }
  }
  
  /**
   * Edit VM template
   * @param {string} templateId - Template ID
   */
  async function editVMTemplate(templateId) {
    try {
      const response = await fetch(`/api/templates/vm/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch VM template: ${response.statusText}`);
      }
      
      const template = await response.json();
      showVMTemplateModal(template);
    } catch (error) {
      console.error('Error editing VM template:', error);
      setError(`Failed to edit VM template: ${error.message}`);
    }
  }
  
  /**
   * Delete VM template
   * @param {string} templateId - Template ID
   */
  async function deleteVMTemplate(templateId) {
    try {
      // Show confirmation dialog
      if (!confirm('Are you sure you want to delete this VM template? This action cannot be undone.')) {
        return;
      }
      
      const response = await fetch(`/api/templates/vm/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
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
      setError(`Failed to delete VM template: ${error.message}`);
    }
  }
  
  /**
   * Show LXC template modal for create/edit
   * @param {Object} template - Template data for edit, null for create
   */
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
  
  /**
   * Save LXC template (create or update)
   */
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
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authData.token}`
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
      setError(`Failed to save LXC template: ${error.message}`);
    }
  }
  
  /**
   * Edit LXC template
   * @param {string} templateId - Template ID
   */
  async function editLXCTemplate(templateId) {
    try {
      const response = await fetch(`/api/templates/lxc/${templateId}`, {
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch LXC template: ${response.statusText}`);
      }
      
      const template = await response.json();
      showLXCTemplateModal(template);
    } catch (error) {
      console.error('Error editing LXC template:', error);
      setError(`Failed to edit LXC template: ${error.message}`);
    }
  }
  
  /**
   * Delete LXC template
   * @param {string} templateId - Template ID
   */
  async function deleteLXCTemplate(templateId) {
    try {
      // Show confirmation dialog
      if (!confirm('Are you sure you want to delete this LXC template? This action cannot be undone.')) {
        return;
      }
      
      const response = await fetch(`/api/templates/lxc/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authData.token}`
        }
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
      setError(`Failed to delete LXC template: ${error.message}`);
    }
  }
  
  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, info, warning, danger)
   */
  function showNotification(message, type = 'info') {
    const event = new CustomEvent('show-notification', {
      detail: { message, type }
    });
    document.dispatchEvent(event);
  }
  
  // Initialize component
  init();
  
  // Return component interface
  return {
    loadTemplateData
  };
}

module.exports = TemplateManager;