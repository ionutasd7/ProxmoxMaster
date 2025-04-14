/**
 * API Client
 * Handles all API requests to the server
 */
export class API {
  constructor() {
    this.baseUrl = '/api';
    this.token = localStorage.getItem('token');
  }
  
  /**
   * Set authentication token
   * @param {string} token - Authentication token
   */
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }
  
  /**
   * Clear authentication token
   */
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
  }
  
  /**
   * Get headers for API requests
   * @param {boolean} includeContentType - Whether to include content-type header
   * @returns {Object} Headers
   */
  getHeaders(includeContentType = true) {
    const headers = {};
    
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  /**
   * Make API request
   * @param {string} method - HTTP method
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @param {boolean} includeContentType - Whether to include content-type header
   * @returns {Promise<Object>} Response data
   */
  async request(method, endpoint, data = null, includeContentType = true) {
    const url = `${this.baseUrl}${endpoint}`;
    
    console.log(`API Request: ${method} ${endpoint}`);
    
    const options = {
      method,
      headers: this.getHeaders(includeContentType),
      credentials: 'same-origin'
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    try {
      const response = await fetch(url, options);
      const responseData = await response.json();
      
      console.log(`API Response from ${endpoint}:`, responseData);
      
      if (!response.ok) {
        if (response.status === 401) {
          // Clear token if unauthorized
          this.clearToken();
        }
        
        throw {
          status: response.status,
          data: responseData,
          message: responseData.message || responseData.error || 'API request failed'
        };
      }
      
      return responseData;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
  
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async get(endpoint) {
    return this.request('GET', endpoint);
  }
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async post(endpoint, data) {
    return this.request('POST', endpoint, data);
  }
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} Response data
   */
  async put(endpoint, data) {
    return this.request('PUT', endpoint, data);
  }
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} Response data
   */
  async delete(endpoint) {
    return this.request('DELETE', endpoint);
  }
  
  /**
   * Get API status
   * @returns {Promise<Object>} Status
   */
  async getStatus() {
    return this.get('/status');
  }
  
  /**
   * Login
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} Login response
   */
  async login(username, password) {
    const response = await this.post('/login', { username, password });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }
  
  /**
   * Logout
   * @returns {Promise<Object>} Logout response
   */
  async logout() {
    try {
      await this.post('/logout');
    } finally {
      this.clearToken();
    }
    
    return { success: true };
  }
  
  /**
   * Get current user
   * @returns {Promise<Object>} User
   */
  async getCurrentUser() {
    return this.get('/user');
  }
  
  /**
   * Get all nodes
   * @returns {Promise<Array>} Nodes
   */
  async getNodes() {
    return this.get('/nodes');
  }
  
  /**
   * Get node details
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Node details
   */
  async getNodeDetails(nodeId) {
    return this.get(`/nodes/${nodeId}`);
  }
  
  /**
   * Add a new node
   * @param {Object} node - Node
   * @returns {Promise<Object>} Added node
   */
  async addNode(node) {
    return this.post('/nodes', node);
  }
  
  /**
   * Test connection to a Proxmox API
   * @param {Object} connectionDetails - Connection details
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(connectionDetails) {
    return this.post('/nodes/test-connection', connectionDetails);
  }
  
  /**
   * Delete a node
   * @param {string} nodeId - Node ID
   * @returns {Promise<Object>} Delete response
   */
  async deleteNode(nodeId) {
    return this.delete(`/nodes/${nodeId}`);
  }
  
  /**
   * Get all VMs
   * @returns {Promise<Object>} VMs response
   */
  async getVMs() {
    return this.get('/vms');
  }
  
  /**
   * Get VM details
   * @param {string} nodeId - Node ID
   * @param {string} vmId - VM ID
   * @returns {Promise<Object>} VM details
   */
  async getVMDetails(nodeId, vmId) {
    return this.get(`/nodes/${nodeId}/vms/${vmId}`);
  }
  
  /**
   * Perform VM action
   * @param {string} nodeId - Node ID
   * @param {string} vmId - VM ID
   * @param {string} action - Action (start, stop, reset, etc.)
   * @returns {Promise<Object>} Action response
   */
  async performVMAction(nodeId, vmId, action) {
    return this.post(`/nodes/${nodeId}/vms/${vmId}/${action}`);
  }
  
  /**
   * Get all containers
   * @returns {Promise<Object>} Containers response
   */
  async getContainers() {
    return this.get('/containers');
  }
  
  /**
   * Perform container action
   * @param {string} nodeId - Node ID
   * @param {string} containerId - Container ID
   * @param {string} action - Action (start, stop, restart, etc.)
   * @returns {Promise<Object>} Action response
   */
  async performContainerAction(nodeId, containerId, action) {
    return this.post(`/nodes/${nodeId}/containers/${containerId}/${action}`);
  }
  
  /**
   * Get dashboard data
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboardData() {
    return this.get('/dashboard');
  }
  
  /**
   * Get VM templates
   * @returns {Promise<Array>} VM templates
   */
  async getVMTemplates() {
    return this.get('/templates/vm');
  }
  
  /**
   * Get LXC templates
   * @returns {Promise<Array>} LXC templates
   */
  async getLXCTemplates() {
    return this.get('/templates/lxc');
  }
}