/**
 * API Utility Functions
 * Contains functions for interacting with the backend API
 */

/**
 * Send a fetch request to the API
 * @param {string} url - The API endpoint URL
 * @param {Object} options - Fetch options including method, headers, and body
 * @returns {Promise<Object>} The response data
 * @throws {Error} If the request fails
 */
async function fetchAPI(url, options = {}) {
  try {
    // Set default headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    // Send the request
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Check if the request was successful
    if (!response.ok) {
      // Try to get error message from response
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error ${response.status}`);
      } catch (parseError) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
    }
    
    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return { success: true };
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/**
 * API object with methods for different endpoints
 */
const api = {
  /**
   * Authenticate user
   * @param {string} username - User username
   * @param {string} password - User password
   * @returns {Promise<Object>} User data
   */
  async login(username, password) {
    return fetchAPI(API.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },
  
  /**
   * Get all nodes
   * @returns {Promise<Array>} List of nodes
   */
  async getNodes() {
    return fetchAPI(API.NODES);
  },
  
  /**
   * Add a new node
   * @param {Object} nodeData - Node data
   * @returns {Promise<Object>} Created node
   */
  async addNode(nodeData) {
    return fetchAPI(API.NODES, {
      method: 'POST',
      body: JSON.stringify(nodeData)
    });
  },
  
  /**
   * Delete a node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Object>} Success status
   */
  async deleteNode(nodeId) {
    return fetchAPI(`${API.NODES}/${nodeId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Test connection to a Proxmox API
   * @param {Object} connectionData - Connection details
   * @returns {Promise<Object>} Connection test result
   */
  async testConnection(connectionData) {
    return fetchAPI(API.TEST_CONNECTION, {
      method: 'POST',
      body: JSON.stringify(connectionData)
    });
  },
  
  /**
   * Test SSH connection
   * @param {Object} sshData - SSH connection details
   * @returns {Promise<Object>} SSH test result
   */
  async testSSH(sshData) {
    return fetchAPI(API.TEST_SSH, {
      method: 'POST',
      body: JSON.stringify(sshData)
    });
  },
  
  /**
   * Get VM list for a node
   * @param {number} nodeId - Node ID
   * @param {string} nodeName - Node name
   * @returns {Promise<Array>} List of VMs
   */
  async getVMs(nodeId, nodeName) {
    const url = getUrl(API.VMS, { id: nodeId, nodename: nodeName });
    return fetchAPI(url);
  },
  
  /**
   * Get container list for a node
   * @param {number} nodeId - Node ID
   * @param {string} nodeName - Node name
   * @returns {Promise<Array>} List of containers
   */
  async getContainers(nodeId, nodeName) {
    const url = getUrl(API.CONTAINERS, { id: nodeId, nodename: nodeName });
    return fetchAPI(url);
  },
  
  /**
   * Get VM templates
   * @returns {Promise<Array>} List of VM templates
   */
  async getVMTemplates() {
    return fetchAPI(API.VM_TEMPLATES);
  },
  
  /**
   * Create a VM template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createVMTemplate(templateData) {
    return fetchAPI(API.VM_TEMPLATES, {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  },
  
  /**
   * Delete a VM template
   * @param {number} templateId - Template ID
   * @returns {Promise<Object>} Success status
   */
  async deleteVMTemplate(templateId) {
    return fetchAPI(`${API.VM_TEMPLATES}/${templateId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Get LXC templates
   * @returns {Promise<Array>} List of LXC templates
   */
  async getLXCTemplates() {
    return fetchAPI(API.LXC_TEMPLATES);
  },
  
  /**
   * Create an LXC template
   * @param {Object} templateData - Template data
   * @returns {Promise<Object>} Created template
   */
  async createLXCTemplate(templateData) {
    return fetchAPI(API.LXC_TEMPLATES, {
      method: 'POST',
      body: JSON.stringify(templateData)
    });
  },
  
  /**
   * Delete an LXC template
   * @param {number} templateId - Template ID
   * @returns {Promise<Object>} Success status
   */
  async deleteLXCTemplate(templateId) {
    return fetchAPI(`${API.LXC_TEMPLATES}/${templateId}`, {
      method: 'DELETE'
    });
  },
  
  /**
   * Get monitoring data for a node
   * @param {number} nodeId - Node ID
   * @returns {Promise<Object>} Monitoring data
   */
  async getMonitoringData(nodeId) {
    const url = getUrl(API.MONITORING, { id: nodeId });
    return fetchAPI(url);
  }
};