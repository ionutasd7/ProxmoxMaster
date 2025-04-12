/**
 * Network Service
 * Provides methods for managing network configuration
 */

import proxmoxService from './proxmoxService';
import sshService from './sshService';

class NetworkService {
  /**
   * Get network interfaces for a node
   * @param {string} node - Node name
   * @returns {Promise<Array>} List of network interfaces
   */
  async getNetworkInterfaces(node) {
    try {
      return await proxmoxService.getNetworkInterfaces(node);
    } catch (error) {
      console.error(`Error getting network interfaces for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get network configuration for a node
   * @param {string} node - Node name
   * @returns {Promise<string>} Network configuration file content
   */
  async getNetworkConfig(node) {
    try {
      return await sshService.getNetworkConfig(node);
    } catch (error) {
      console.error(`Error getting network configuration for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Save network configuration for a node
   * @param {string} node - Node name
   * @param {string} config - Network configuration content
   * @returns {Promise<boolean>} Success status
   */
  async saveNetworkConfig(node, config) {
    try {
      return await sshService.updateNetworkConfig(node, config);
    } catch (error) {
      console.error(`Error saving network configuration for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Apply network changes on a node
   * @param {string} node - Node name
   * @returns {Promise<boolean>} Success status
   */
  async applyNetworkChanges(node) {
    try {
      const result = await sshService.executeOnNode(node, 'systemctl restart networking');
      return result.code === 0;
    } catch (error) {
      console.error(`Error applying network changes on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get IP addresses for a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<Array>} List of IP addresses
   */
  async getContainerIPs(node, vmid) {
    try {
      const result = await sshService.executeInContainer(node, vmid, 'ip -4 addr show | grep inet');
      
      if (result.code === 0) {
        const lines = result.data.split('\n');
        const ips = [];
        
        for (const line of lines) {
          const match = line.match(/inet\s+([0-9.]+)\/([0-9]+)/);
          if (match) {
            ips.push({
              address: match[1],
              cidr: match[2],
              interface: line.match(/\s(\w+)$/)?.[1] || 'unknown'
            });
          }
        }
        
        return ips;
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error getting IP addresses for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get network interfaces for a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<Array>} List of network interfaces
   */
  async getContainerInterfaces(node, vmid) {
    try {
      const result = await sshService.executeInContainer(node, vmid, 'ip link show');
      
      if (result.code === 0) {
        const lines = result.data.split('\n');
        const interfaces = [];
        
        for (let i = 0; i < lines.length; i += 2) {
          const line = lines[i];
          const match = line.match(/^\d+:\s+(\w+):/);
          
          if (match && !match[1].startsWith('lo')) {
            interfaces.push({
              name: match[1],
              state: line.includes('state UP') ? 'up' : 'down',
              mac: lines[i + 1]?.match(/link\/ether\s+([0-9a-f:]+)/)?.[1] || 'unknown'
            });
          }
        }
        
        return interfaces;
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error getting network interfaces for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get DNS configuration for a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<Object>} DNS configuration
   */
  async getContainerDNS(node, vmid) {
    try {
      const result = await sshService.executeInContainer(node, vmid, 'cat /etc/resolv.conf');
      
      if (result.code === 0) {
        const lines = result.data.split('\n');
        const dns = {
          nameservers: [],
          search: []
        };
        
        for (const line of lines) {
          if (line.startsWith('nameserver')) {
            dns.nameservers.push(line.split(/\s+/)[1]);
          } else if (line.startsWith('search')) {
            dns.search = line.split(/\s+/).slice(1);
          }
        }
        
        return dns;
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error getting DNS configuration for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Update DNS configuration for a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {Object} dns - DNS configuration
   * @returns {Promise<boolean>} Success status
   */
  async updateContainerDNS(node, vmid, dns) {
    try {
      let content = '';
      
      if (dns.search && dns.search.length > 0) {
        content += `search ${dns.search.join(' ')}\n`;
      }
      
      if (dns.nameservers && dns.nameservers.length > 0) {
        for (const ns of dns.nameservers) {
          content += `nameserver ${ns}\n`;
        }
      }
      
      const result = await sshService.executeInContainer(
        node, 
        vmid, 
        `cat > /etc/resolv.conf << 'EOL'\n${content}EOL`
      );
      
      return result.code === 0;
    } catch (error) {
      console.error(`Error updating DNS configuration for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get hostname for a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<string>} Hostname
   */
  async getContainerHostname(node, vmid) {
    try {
      const result = await sshService.executeInContainer(node, vmid, 'hostname');
      
      if (result.code === 0) {
        return result.data.trim();
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error getting hostname for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Update hostname for a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} hostname - New hostname
   * @returns {Promise<boolean>} Success status
   */
  async updateContainerHostname(node, vmid, hostname) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `hostnamectl set-hostname ${hostname}`);
      return result.code === 0;
    } catch (error) {
      console.error(`Error updating hostname for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const networkService = new NetworkService();

export default networkService;
