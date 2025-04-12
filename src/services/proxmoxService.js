/**
 * Proxmox API Service
 * Handles communication with the Proxmox API
 */

import axios from 'axios';

class ProxmoxService {
  constructor() {
    this.authData = null;
  }

  /**
   * Set authentication data for API requests
   * @param {Object} authData - Authentication data {host, username, ticket, CSRFPreventionToken}
   */
  setAuthData(authData) {
    this.authData = authData;
  }

  /**
   * Get authentication data
   * @returns {Object} The current authentication data
   */
  getAuthData() {
    return this.authData;
  }

  /**
   * Create API request headers with authentication
   * @param {boolean} includeCSRF - Whether to include CSRF token
   * @returns {Object} Headers object
   */
  createHeaders(includeCSRF = false) {
    if (!this.authData) {
      throw new Error('Not authenticated');
    }

    const headers = {
      'Authorization': `PVEAuthCookie=${this.authData.ticket}`
    };

    if (includeCSRF) {
      headers['CSRFPreventionToken'] = this.authData.CSRFPreventionToken;
    }

    return headers;
  }

  /**
   * Make a GET request to the Proxmox API
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} API response
   */
  async get(endpoint) {
    if (!this.authData) {
      throw new Error('Not authenticated');
    }

    const url = `https://${this.authData.host}:8006/api2/json${endpoint}`;
    
    try {
      const response = await axios.get(url, {
        headers: this.createHeaders(),
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Proxmox API GET error:', error);
      throw error;
    }
  }

  /**
   * Make a POST request to the Proxmox API
   * @param {string} endpoint - API endpoint
   * @param {Object|string} data - Request data
   * @param {boolean} isFormEncoded - Whether data is form encoded
   * @returns {Promise<Object>} API response
   */
  async post(endpoint, data = {}, isFormEncoded = false) {
    if (!this.authData) {
      throw new Error('Not authenticated');
    }

    const url = `https://${this.authData.host}:8006/api2/json${endpoint}`;
    
    try {
      const headers = this.createHeaders(true);
      
      if (isFormEncoded) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
      
      const response = await axios.post(url, data, {
        headers,
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Proxmox API POST error:', error);
      throw error;
    }
  }

  /**
   * Make a PUT request to the Proxmox API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async put(endpoint, data = {}) {
    if (!this.authData) {
      throw new Error('Not authenticated');
    }

    const url = `https://${this.authData.host}:8006/api2/json${endpoint}`;
    
    try {
      const response = await axios.put(url, data, {
        headers: this.createHeaders(true),
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Proxmox API PUT error:', error);
      throw error;
    }
  }

  /**
   * Make a DELETE request to the Proxmox API
   * @param {string} endpoint - API endpoint
   * @returns {Promise<Object>} API response
   */
  async delete(endpoint) {
    if (!this.authData) {
      throw new Error('Not authenticated');
    }

    const url = `https://${this.authData.host}:8006/api2/json${endpoint}`;
    
    try {
      const response = await axios.delete(url, {
        headers: this.createHeaders(true),
        withCredentials: true
      });
      
      return response.data;
    } catch (error) {
      console.error('Proxmox API DELETE error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with the Proxmox API
   * @param {string} host - Proxmox host
   * @param {string} username - API username
   * @param {string} password - API password
   * @returns {Promise<Object>} Authentication data
   */
  async authenticate(host, username, password) {
    const url = `https://${host}:8006/api2/json/access/ticket`;
    
    try {
      const response = await axios.post(
        url, 
        `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          withCredentials: true
        }
      );
      
      if (response.data && response.data.data) {
        const { ticket, CSRFPreventionToken } = response.data.data;
        
        this.authData = {
          host,
          username,
          ticket,
          CSRFPreventionToken,
          timestamp: new Date().getTime()
        };
        
        return this.authData;
      } else {
        throw new Error('Invalid response from authentication server');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Check if the current authentication is valid
   * @returns {Promise<boolean>} Whether authentication is valid
   */
  async checkAuth() {
    if (!this.authData) {
      return false;
    }

    try {
      // Simple request to check if authentication is still valid
      await this.get('/version');
      return true;
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  /**
   * Get a list of nodes in the cluster
   * @returns {Promise<Array>} List of nodes
   */
  async getNodes() {
    try {
      const response = await this.get('/nodes');
      return response.data || [];
    } catch (error) {
      console.error('Failed to get nodes:', error);
      throw error;
    }
  }

  /**
   * Get details for a specific node
   * @param {string} node - Node name
   * @returns {Promise<Object>} Node details
   */
  async getNodeStatus(node) {
    try {
      const response = await this.get(`/nodes/${node}/status`);
      return response.data || {};
    } catch (error) {
      console.error(`Failed to get status for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get a list of VMs on a node
   * @param {string} node - Node name
   * @returns {Promise<Array>} List of VMs
   */
  async getVMs(node) {
    try {
      const response = await this.get(`/nodes/${node}/qemu`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get VMs for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get a list of LXC containers on a node
   * @param {string} node - Node name
   * @returns {Promise<Array>} List of containers
   */
  async getContainers(node) {
    try {
      const response = await this.get(`/nodes/${node}/lxc`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get containers for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get details for a specific VM
   * @param {string} node - Node name
   * @param {string} vmid - VM ID
   * @returns {Promise<Object>} VM details
   */
  async getVMDetails(node, vmid) {
    try {
      const response = await this.get(`/nodes/${node}/qemu/${vmid}/status/current`);
      return response.data || {};
    } catch (error) {
      console.error(`Failed to get details for VM ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get details for a specific container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<Object>} Container details
   */
  async getContainerDetails(node, vmid) {
    try {
      const response = await this.get(`/nodes/${node}/lxc/${vmid}/status/current`);
      return response.data || {};
    } catch (error) {
      console.error(`Failed to get details for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Perform an action on a VM (start, stop, reset, etc.)
   * @param {string} node - Node name
   * @param {string} vmid - VM ID
   * @param {string} action - Action to perform
   * @returns {Promise<Object>} API response
   */
  async performVMAction(node, vmid, action) {
    try {
      const response = await this.post(`/nodes/${node}/qemu/${vmid}/status/${action}`);
      return response;
    } catch (error) {
      console.error(`Failed to perform action ${action} on VM ${vmid}:`, error);
      throw error;
    }
  }

  /**
   * Perform an action on a container (start, stop, restart, etc.)
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} action - Action to perform
   * @returns {Promise<Object>} API response
   */
  async performContainerAction(node, vmid, action) {
    try {
      const response = await this.post(`/nodes/${node}/lxc/${vmid}/status/${action}`);
      return response;
    } catch (error) {
      console.error(`Failed to perform action ${action} on container ${vmid}:`, error);
      throw error;
    }
  }

  /**
   * Get network interfaces for a node
   * @param {string} node - Node name
   * @returns {Promise<Array>} List of network interfaces
   */
  async getNetworkInterfaces(node) {
    try {
      const response = await this.get(`/nodes/${node}/network`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get network interfaces for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get storage information for a node
   * @param {string} node - Node name
   * @returns {Promise<Array>} List of storage
   */
  async getStorage(node) {
    try {
      const response = await this.get(`/nodes/${node}/storage`);
      return response.data || [];
    } catch (error) {
      console.error(`Failed to get storage for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get the next available VM ID
   * @returns {Promise<string>} Next VM ID
   */
  async getNextVMID() {
    try {
      const response = await this.get('/cluster/nextid');
      return response.data;
    } catch (error) {
      console.error('Failed to get next VM ID:', error);
      throw error;
    }
  }
}

// Create a singleton instance
const proxmoxService = new ProxmoxService();

export default proxmoxService;
