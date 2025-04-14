/**
 * API Service
 * Handles all API requests to the server
 */
export class API {
  constructor() {
    this.baseUrl = '/api';
  }
  
  /**
   * Send a request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    try {
      console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });
      
      const data = await response.json();
      console.log(`API Response from ${endpoint}:`, data);
      
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * Get API status
   * @returns {Promise<Object>} Status data
   */
  async getStatus() {
    return this.request('/status');
  }
  
  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User data
   */
  async login(username, password) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }
  
  /**
   * Get current user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    return this.request('/user');
  }
  
  /**
   * Update user settings
   * @param {Object} userData - User data to update
   * @returns {Promise<Object>} Updated user data
   */
  async updateUserSettings(userData) {
    return this.request('/user', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
  
  /**
   * Logout user
   * @returns {Promise<Object>} Logout status
   */
  async logout() {
    return this.request('/logout', {
      method: 'POST',
    });
  }
  
  /**
   * Get all nodes
   * @returns {Promise<Array>} Nodes array
   */
  async getNodes() {
    return this.request('/nodes');
  }
  
  /**
   * Add a new node
   * @param {Object} nodeData - Node data
   * @returns {Promise<Object>} Created node
   */
  async addNode(nodeData) {
    return this.request('/nodes', {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  }
  
  /**
   * Delete a node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Object>} Status
   */
  async deleteNode(nodeId) {
    return this.request(`/nodes/${nodeId}`, {
      method: 'DELETE',
    });
  }
  
  /**
   * Get node details
   * @param {number} nodeId - Node ID
   * @returns {Promise<Object>} Node details
   */
  async getNodeDetails(nodeId) {
    return this.request(`/nodes/${nodeId}`);
  }
  
  /**
   * Get all VMs for a specific node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Array>} VMs array
   */
  async getNodeVMs(nodeId) {
    return this.request(`/nodes/${nodeId}/qemu`);
  }
  
  /**
   * Perform action on a VM (start, stop, restart)
   * @param {number} nodeId - Node ID
   * @param {string} vmId - VM ID
   * @param {string} action - Action to perform (start, stop, restart)
   * @returns {Promise<Object>} Action result
   */
  async performVMAction(nodeId, vmId, action) {
    return this.request(`/nodes/${nodeId}/qemu/${vmId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }
  
  /**
   * Get all containers for a specific node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Array>} Containers array
   */
  async getNodeContainers(nodeId) {
    return this.request(`/nodes/${nodeId}/lxc`);
  }
  
  /**
   * Perform action on a container (start, stop, restart)
   * @param {number} nodeId - Node ID
   * @param {string} containerId - Container ID
   * @param {string} action - Action to perform (start, stop, restart)
   * @returns {Promise<Object>} Action result
   */
  async performContainerAction(nodeId, containerId, action) {
    return this.request(`/nodes/${nodeId}/lxc/${containerId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
  }
  
  /**
   * Get dashboard data including cluster stats
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData() {
    return this.request('/dashboard');
  }
  
  /**
   * Get all VMs across all nodes
   * @returns {Promise<Object>} VMs data
   */
  async getVMs() {
    return this.request('/vms');
  }
  
  /**
   * Get all containers across all nodes
   * @returns {Promise<Object>} Containers data
   */
  async getContainers() {
    return this.request('/containers');
  }
  
  /**
   * Test connection to a node
   * @param {Object} connectionData - Connection settings
   * @returns {Promise<Object>} Connection test results
   */
  async testConnection(connectionData) {
    return this.request('/nodes/test-connection', {
      method: 'POST',
      body: JSON.stringify(connectionData),
    });
  }
  
  /**
   * Get VM templates
   * @returns {Promise<Array>} VM templates
   */
  async getVMTemplates() {
    return this.request('/templates/vm');
  }
  
  /**
   * Add VM template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async addVMTemplate(templateData) {
    return this.request('/templates/vm', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }
  
  /**
   * Get LXC templates
   * @returns {Promise<Array>} LXC templates
   */
  async getLXCTemplates() {
    return this.request('/templates/lxc');
  }
  
  /**
   * Add LXC template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async addLXCTemplate(templateData) {
    return this.request('/templates/lxc', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }
}