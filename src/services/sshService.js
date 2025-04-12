/**
 * SSH Service
 * Provides methods for executing SSH commands on remote servers
 */

class SSHService {
  /**
   * Execute a command via SSH
   * @param {string} host - Host to connect to
   * @param {string} username - SSH username
   * @param {string} password - SSH password
   * @param {string} command - Command to execute
   * @returns {Promise<Object>} Result of the command
   */
  async executeCommand(host, username, password, command) {
    try {
      // Use the Electron IPC bridge to execute the SSH command
      const result = await window.api.sshCommand({
        host,
        username,
        password,
        command
      });
      
      return result;
    } catch (error) {
      console.error('SSH command execution error:', error);
      throw error;
    }
  }

  /**
   * Execute a command on a Proxmox node
   * @param {string} node - Node name (hostname)
   * @param {string} command - Command to execute
   * @param {Object} credentials - SSH credentials
   * @returns {Promise<Object>} Result of the command
   */
  async executeOnNode(node, command, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      const hostname = `${node}.ionutlab.com`;
      return await this.executeCommand(hostname, credentials.username, credentials.password, command);
    } catch (error) {
      console.error(`SSH command execution error on ${node}:`, error);
      throw error;
    }
  }

  /**
   * Execute a command inside an LXC container
   * @param {string} node - Node name (hostname)
   * @param {string} vmid - Container ID
   * @param {string} command - Command to execute
   * @param {Object} credentials - SSH credentials for the Proxmox node
   * @returns {Promise<Object>} Result of the command
   */
  async executeInContainer(node, vmid, command, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      const pctCommand = `pct exec ${vmid} -- ${command}`;
      return await this.executeOnNode(node, pctCommand, credentials);
    } catch (error) {
      console.error(`SSH command execution error in container ${vmid} on ${node}:`, error);
      throw error;
    }
  }

  /**
   * Execute a command inside a VM (using qm agent)
   * @param {string} node - Node name (hostname)
   * @param {string} vmid - VM ID
   * @param {string} command - Command to execute
   * @param {Object} credentials - SSH credentials for the Proxmox node
   * @returns {Promise<Object>} Result of the command
   */
  async executeInVM(node, vmid, command, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      // NOTE: This requires the QEMU agent to be installed and running in the VM
      const qmCommand = `qm agent ${vmid} exec "${command}"`;
      return await this.executeOnNode(node, qmCommand, credentials);
    } catch (error) {
      console.error(`SSH command execution error in VM ${vmid} on ${node}:`, error);
      throw error;
    }
  }

  /**
   * Read a file from a node
   * @param {string} node - Node name (hostname)
   * @param {string} filePath - Path to the file
   * @param {Object} credentials - SSH credentials
   * @returns {Promise<string>} File content
   */
  async readFile(node, filePath, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      const result = await this.executeOnNode(node, `cat ${filePath}`, credentials);
      
      if (result.code === 0) {
        return result.data;
      } else {
        throw new Error(`Failed to read file ${filePath}: ${result.data}`);
      }
    } catch (error) {
      console.error(`Error reading file ${filePath} on ${node}:`, error);
      throw error;
    }
  }

  /**
   * Write content to a file on a node
   * @param {string} node - Node name (hostname)
   * @param {string} filePath - Path to the file
   * @param {string} content - Content to write
   * @param {Object} credentials - SSH credentials
   * @returns {Promise<boolean>} Success status
   */
  async writeFile(node, filePath, content, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      // Create a temporary file
      const tempPath = `/tmp/file_${Date.now()}`;
      
      // Create the command to write content to the temp file
      const writeCommand = `cat > ${tempPath} << 'EOL'\n${content}\nEOL`;
      
      // Execute the write command
      const writeResult = await this.executeOnNode(node, writeCommand, credentials);
      
      if (writeResult.code !== 0) {
        throw new Error(`Failed to write to temporary file: ${writeResult.data}`);
      }
      
      // Move the temporary file to the destination
      const moveCommand = `mv ${tempPath} ${filePath}`;
      const moveResult = await this.executeOnNode(node, moveCommand, credentials);
      
      if (moveResult.code !== 0) {
        throw new Error(`Failed to move temporary file to destination: ${moveResult.data}`);
      }
      
      return true;
    } catch (error) {
      console.error(`Error writing to file ${filePath} on ${node}:`, error);
      throw error;
    }
  }

  /**
   * Check if a node is reachable
   * @param {string} node - Node name (hostname)
   * @returns {Promise<boolean>} Whether the node is reachable
   */
  async isNodeReachable(node) {
    try {
      const hostname = `${node}.ionutlab.com`;
      const result = await window.api.ping(hostname);
      return result.success;
    } catch (error) {
      console.error(`Error checking if node ${node} is reachable:`, error);
      return false;
    }
  }

  /**
   * Get network configuration for a node
   * @param {string} node - Node name (hostname)
   * @param {Object} credentials - SSH credentials
   * @returns {Promise<string>} Network configuration
   */
  async getNetworkConfig(node, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      return await this.readFile(node, '/etc/network/interfaces', credentials);
    } catch (error) {
      console.error(`Error getting network configuration for ${node}:`, error);
      throw error;
    }
  }

  /**
   * Update network configuration for a node
   * @param {string} node - Node name (hostname)
   * @param {string} config - Network configuration
   * @param {Object} credentials - SSH credentials
   * @returns {Promise<boolean>} Success status
   */
  async updateNetworkConfig(node, config, credentials = { username: 'root', password: 'Poolamea01@' }) {
    try {
      return await this.writeFile(node, '/etc/network/interfaces', config, credentials);
    } catch (error) {
      console.error(`Error updating network configuration for ${node}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const sshService = new SSHService();

export default sshService;
