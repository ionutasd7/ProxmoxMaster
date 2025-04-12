/**
 * Update Service
 * Provides methods for checking and applying updates
 */

import sshService from './sshService';

class UpdateService {
  /**
   * Check for updates on a node
   * @param {string} node - Node name
   * @returns {Promise<Array>} List of available updates
   */
  async checkNodeUpdates(node) {
    try {
      const result = await sshService.executeOnNode(node, 'apt update && apt list --upgradable');
      
      if (result.code === 0) {
        // Parse the output to extract package information
        const output = result.data;
        const lines = output.split('\n');
        const upgradablePackages = [];
        
        // Find the line that says "Listing..."
        const listingIndex = lines.findIndex(line => line.startsWith('Listing...'));
        
        if (listingIndex !== -1) {
          // Parse all lines after "Listing..."
          for (let i = listingIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('WARNING')) {
              // Parse package name and version
              const parts = line.split('/');
              if (parts.length >= 2) {
                const packageName = parts[0].trim();
                const versionInfo = line.includes('[upgradable from:') 
                  ? line.split('[upgradable from:')[1].replace(']', '').trim()
                  : 'Unknown version';
                
                upgradablePackages.push({
                  name: packageName,
                  versionInfo,
                  selected: true
                });
              }
            }
          }
        }
        
        return upgradablePackages;
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error checking updates for node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Apply updates on a node
   * @param {string} node - Node name
   * @param {Function} progressCallback - Callback for update progress
   * @returns {Promise<boolean>} Success status
   */
  async applyNodeUpdates(node, progressCallback = null) {
    try {
      // Function to update progress
      const updateProgress = (message) => {
        if (progressCallback) {
          progressCallback(message);
        }
      };
      
      updateProgress(`Starting update for ${node}...\n`);
      
      // Update package list
      updateProgress(`Updating package lists...\n`);
      const updateResult = await sshService.executeOnNode(node, 'apt update');
      
      if (updateResult.code !== 0) {
        throw new Error(`apt update failed: ${updateResult.data}`);
      }
      
      updateProgress(updateResult.data + '\n');
      
      // Upgrade packages
      updateProgress(`Installing updates...\n`);
      const upgradeResult = await sshService.executeOnNode(node, 'apt upgrade -y');
      
      if (upgradeResult.code !== 0) {
        throw new Error(`apt upgrade failed: ${upgradeResult.data}`);
      }
      
      updateProgress(upgradeResult.data + '\n');
      
      // Autoremove unused packages
      updateProgress(`Removing unused packages...\n`);
      const autoremoveResult = await sshService.executeOnNode(node, 'apt autoremove -y');
      
      updateProgress(autoremoveResult.data + '\n');
      updateProgress(`\nUpdate completed successfully.\n`);
      
      return true;
    } catch (error) {
      console.error(`Error applying updates to node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Check for updates in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<Array>} List of available updates
   */
  async checkContainerUpdates(node, vmid) {
    try {
      const result = await sshService.executeInContainer(node, vmid, 'apt update && apt list --upgradable');
      
      if (result.code === 0) {
        // Parse the output to extract package information
        const output = result.data;
        const lines = output.split('\n');
        const upgradablePackages = [];
        
        // Find the line that says "Listing..."
        const listingIndex = lines.findIndex(line => line.startsWith('Listing...'));
        
        if (listingIndex !== -1) {
          // Parse all lines after "Listing..."
          for (let i = listingIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('WARNING')) {
              // Parse package name and version
              const parts = line.split('/');
              if (parts.length >= 2) {
                const packageName = parts[0].trim();
                const versionInfo = line.includes('[upgradable from:') 
                  ? line.split('[upgradable from:')[1].replace(']', '').trim()
                  : 'Unknown version';
                
                upgradablePackages.push({
                  name: packageName,
                  versionInfo,
                  selected: true
                });
              }
            }
          }
        }
        
        return upgradablePackages;
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error checking updates for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Apply updates to a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {Function} progressCallback - Callback for update progress
   * @returns {Promise<boolean>} Success status
   */
  async applyContainerUpdates(node, vmid, progressCallback = null) {
    try {
      // Function to update progress
      const updateProgress = (message) => {
        if (progressCallback) {
          progressCallback(message);
        }
      };
      
      updateProgress(`Starting update for container ${vmid}...\n`);
      
      // Update package list
      updateProgress(`Updating package lists...\n`);
      const updateResult = await sshService.executeInContainer(node, vmid, 'apt update');
      
      if (updateResult.code !== 0) {
        throw new Error(`apt update failed: ${updateResult.data}`);
      }
      
      updateProgress(updateResult.data + '\n');
      
      // Upgrade packages
      updateProgress(`Installing updates...\n`);
      const upgradeResult = await sshService.executeInContainer(node, vmid, 'apt upgrade -y');
      
      if (upgradeResult.code !== 0) {
        throw new Error(`apt upgrade failed: ${upgradeResult.data}`);
      }
      
      updateProgress(upgradeResult.data + '\n');
      
      // Autoremove unused packages
      updateProgress(`Removing unused packages...\n`);
      const autoremoveResult = await sshService.executeInContainer(node, vmid, 'apt autoremove -y');
      
      updateProgress(autoremoveResult.data + '\n');
      updateProgress(`\nUpdate completed successfully.\n`);
      
      return true;
    } catch (error) {
      console.error(`Error applying updates to container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Install a package in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} packageName - Package to install
   * @param {Function} progressCallback - Callback for installation progress
   * @returns {Promise<boolean>} Success status
   */
  async installPackage(node, vmid, packageName, progressCallback = null) {
    try {
      // Function to update progress
      const updateProgress = (message) => {
        if (progressCallback) {
          progressCallback(message);
        }
      };
      
      updateProgress(`Installing ${packageName} in container ${vmid}...\n`);
      
      // Update package list
      updateProgress(`Updating package lists...\n`);
      const updateResult = await sshService.executeInContainer(node, vmid, 'apt update');
      
      if (updateResult.code !== 0) {
        throw new Error(`apt update failed: ${updateResult.data}`);
      }
      
      updateProgress(updateResult.data + '\n');
      
      // Install package
      updateProgress(`Installing ${packageName}...\n`);
      const installResult = await sshService.executeInContainer(node, vmid, `apt install -y ${packageName}`);
      
      if (installResult.code !== 0) {
        throw new Error(`Installation failed: ${installResult.data}`);
      }
      
      updateProgress(installResult.data + '\n');
      updateProgress(`\nInstallation completed successfully.\n`);
      
      return true;
    } catch (error) {
      console.error(`Error installing ${packageName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall a package from a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} packageName - Package to uninstall
   * @param {Function} progressCallback - Callback for uninstallation progress
   * @returns {Promise<boolean>} Success status
   */
  async uninstallPackage(node, vmid, packageName, progressCallback = null) {
    try {
      // Function to update progress
      const updateProgress = (message) => {
        if (progressCallback) {
          progressCallback(message);
        }
      };
      
      updateProgress(`Uninstalling ${packageName} from container ${vmid}...\n`);
      
      // Uninstall package
      const uninstallResult = await sshService.executeInContainer(node, vmid, `apt remove -y ${packageName}`);
      
      updateProgress(uninstallResult.data + '\n');
      
      // Autoremove unused packages
      updateProgress(`Cleaning up...\n`);
      const autoremoveResult = await sshService.executeInContainer(node, vmid, 'apt autoremove -y');
      
      updateProgress(autoremoveResult.data + '\n');
      updateProgress(`\nUninstallation completed successfully.\n`);
      
      return true;
    } catch (error) {
      console.error(`Error uninstalling ${packageName} from container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const updateService = new UpdateService();

export default updateService;
