/**
 * API Service
 * Handles all API requests to the server
 */
export class API {
  constructor() {
    this.baseUrl = ''; // Empty for relative paths
  }
  
  /**
   * Send a request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} Response data
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Default options
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'same-origin' // Include cookies for session auth
    };
    
    // Merge options
    const fetchOptions = { ...defaultOptions, ...options };
    
    // Add body if present
    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }
    
    console.log(`API Request: ${options.method || 'GET'} ${url}`);
    
    try {
      // Add retry logic for better stability
      let retries = 2;
      let response;
      
      while (retries >= 0) {
        try {
          response = await fetch(url, fetchOptions);
          break;
        } catch (fetchError) {
          if (retries <= 0) throw fetchError;
          console.warn(`Retrying API request to ${url}, attempts remaining: ${retries}`);
          retries--;
          // Wait a bit before retrying
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = `HTTP Error: ${response.status}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If we can't parse the error as JSON, just use the status text
          errorMessage = `${errorMessage} ${response.statusText}`;
        }
        
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }
      
      // Parse JSON response
      const data = await response.json();
      console.log(`API Response from ${url}:`, data);
      return data;
    } catch (error) {
      console.error(`API Error (${url}):`, error);
      throw error;
    }
  }
  
  /**
   * Get API status
   * @returns {Promise<Object>} Status data
   */
  async getStatus() {
    return this.request('/api/status');
  }
  
  /**
   * Login user
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User data
   */
  async login(username, password) {
    return this.request('/api/login', {
      method: 'POST',
      body: { username, password }
    });
  }
  
  /**
   * Get current user
   * @returns {Promise<Object>} User data
   */
  async getCurrentUser() {
    return this.request('/api/user');
  }
  
  /**
   * Get all nodes
   * @returns {Promise<Array>} Nodes array
   */
  async getNodes() {
    return this.request('/api/nodes');
  }
  
  /**
   * Add a new node
   * @param {Object} nodeData - Node data
   * @returns {Promise<Object>} Created node
   */
  async addNode(nodeData) {
    return this.request('/api/nodes', {
      method: 'POST',
      body: nodeData
    });
  }
  
  /**
   * Delete a node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Object>} Status
   */
  async deleteNode(nodeId) {
    return this.request(`/api/nodes/${nodeId}`, {
      method: 'DELETE'
    });
  }
  
  /**
   * Get node details
   * @param {number} nodeId - Node ID
   * @returns {Promise<Object>} Node details
   */
  async getNodeDetails(nodeId) {
    return this.request(`/api/nodes/${nodeId}`);
  }
  
  /**
   * Get all VMs for a specific node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Array>} VMs array
   */
  async getNodeVMs(nodeId) {
    return this.request(`/api/nodes/${nodeId}/vms`);
  }
  
  /**
   * Get all containers for a specific node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Array>} Containers array
   */
  async getNodeContainers(nodeId) {
    return this.request(`/api/nodes/${nodeId}/containers`);
  }
  
  /**
   * Get all VMs across all nodes
   * @returns {Promise<Object>} VMs data
   */
  async getVMs() {
    return this.request('/api/vms');
  }
  
  /**
   * Get all containers across all nodes
   * @returns {Promise<Object>} Containers data
   */
  async getContainers() {
    return this.request('/api/containers');
  }
  
  /**
   * Test connection to a node
   * @param {Object} connectionData - Connection settings
   * @returns {Promise<Object>} Connection test results
   */
  async testConnection(connectionData) {
    return this.request('/api/test-connection', {
      method: 'POST',
      body: connectionData
    });
  }
  
  /**
   * Test SSH connection to a node
   * @param {Object} sshData - SSH settings
   * @returns {Promise<Object>} SSH test results
   */
  async testSSH(sshData) {
    return this.request('/api/test-ssh', {
      method: 'POST',
      body: sshData
    });
  }
}