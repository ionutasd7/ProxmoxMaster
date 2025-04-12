/**
 * Application Service
 * Provides methods for managing applications in containers and VMs
 */

import sshService from './sshService';

class AppService {
  // Common application installation commands
  commonApps = {
    apache: { name: 'Apache Web Server', command: 'apt-get install -y apache2' },
    nginx: { name: 'Nginx Web Server', command: 'apt-get install -y nginx' },
    mysql: { name: 'MySQL Database', command: 'apt-get install -y mysql-server' },
    mariadb: { name: 'MariaDB Database', command: 'apt-get install -y mariadb-server' },
    postgresql: { name: 'PostgreSQL Database', command: 'apt-get install -y postgresql postgresql-contrib' },
    php: { name: 'PHP', command: 'apt-get install -y php php-fpm php-mysql' },
    nodejs: { name: 'Node.js', command: 'apt-get install -y nodejs npm' },
    docker: { name: 'Docker', command: 'apt-get install -y docker.io' },
    python3: { name: 'Python 3', command: 'apt-get install -y python3 python3-pip' },
    java: { name: 'Java', command: 'apt-get install -y default-jdk' },
    wordpress: { name: 'WordPress', command: 'apt-get install -y wordpress' },
    phpmyadmin: { name: 'phpMyAdmin', command: 'apt-get install -y phpmyadmin' }
  };

  /**
   * Get a list of installed applications in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @returns {Promise<Array>} List of installed packages
   */
  async getInstalledApps(node, vmid) {
    try {
      const result = await sshService.executeInContainer(node, vmid, 'dpkg -l | grep "^ii" | awk \'{print $2 " " $3}\'');
      
      if (result.code === 0) {
        const lines = result.data.split('\n');
        const packages = [];
        
        for (const line of lines) {
          if (line.trim()) {
            const [name, version] = line.trim().split(' ');
            packages.push({
              name,
              version: version || 'Unknown',
              description: '',
              isInstalled: true
            });
          }
        }
        
        return packages;
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (error) {
      console.error(`Error getting installed applications for container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Install an application in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} appId - Application ID
   * @param {Function} progressCallback - Callback for installation progress
   * @returns {Promise<boolean>} Success status
   */
  async installApp(node, vmid, appId, progressCallback = null) {
    try {
      if (!this.commonApps[appId]) {
        throw new Error(`Unknown application: ${appId}`);
      }
      
      const app = this.commonApps[appId];
      
      // Function to update progress
      const updateProgress = (message) => {
        if (progressCallback) {
          progressCallback(message);
        }
      };
      
      updateProgress(`Installing ${app.name} in container ${vmid}...\n`);
      
      // Update package list
      updateProgress(`Updating package lists...\n`);
      const updateResult = await sshService.executeInContainer(node, vmid, 'apt-get update');
      
      if (updateResult.code !== 0) {
        throw new Error(`apt-get update failed: ${updateResult.data}`);
      }
      
      updateProgress(updateResult.data + '\n');
      
      // Install application
      updateProgress(`Installing ${app.name}...\n`);
      const installResult = await sshService.executeInContainer(node, vmid, app.command);
      
      if (installResult.code !== 0) {
        throw new Error(`Installation failed: ${installResult.data}`);
      }
      
      updateProgress(installResult.data + '\n');
      updateProgress(`\n${app.name} installed successfully.\n`);
      
      return true;
    } catch (error) {
      console.error(`Error installing application ${appId} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Uninstall an application from a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} packageName - Package name
   * @param {Function} progressCallback - Callback for uninstallation progress
   * @returns {Promise<boolean>} Success status
   */
  async uninstallApp(node, vmid, packageName, progressCallback = null) {
    try {
      // Function to update progress
      const updateProgress = (message) => {
        if (progressCallback) {
          progressCallback(message);
        }
      };
      
      updateProgress(`Uninstalling ${packageName} from container ${vmid}...\n`);
      
      // Uninstall package
      const uninstallResult = await sshService.executeInContainer(node, vmid, `apt-get remove -y ${packageName}`);
      
      updateProgress(uninstallResult.data + '\n');
      
      // Autoremove unused packages
      updateProgress(`Cleaning up dependencies...\n`);
      const autoremoveResult = await sshService.executeInContainer(node, vmid, 'apt-get autoremove -y');
      
      updateProgress(autoremoveResult.data + '\n');
      updateProgress(`\n${packageName} uninstalled successfully.\n`);
      
      return true;
    } catch (error) {
      console.error(`Error uninstalling package ${packageName} from container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Get status of a service in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} serviceName - Service name
   * @returns {Promise<Object>} Service status
   */
  async getServiceStatus(node, vmid, serviceName) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `systemctl status ${serviceName}`);
      
      return {
        active: result.code === 0 && result.data.includes('Active: active'),
        running: result.code === 0 && result.data.includes('Active: active (running)'),
        enabled: result.code === 0 && result.data.includes('enabled;'),
        output: result.data
      };
    } catch (error) {
      console.error(`Error getting status for service ${serviceName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Restart a service in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>} Success status
   */
  async restartService(node, vmid, serviceName) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `systemctl restart ${serviceName}`);
      return result.code === 0;
    } catch (error) {
      console.error(`Error restarting service ${serviceName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Start a service in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>} Success status
   */
  async startService(node, vmid, serviceName) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `systemctl start ${serviceName}`);
      return result.code === 0;
    } catch (error) {
      console.error(`Error starting service ${serviceName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Stop a service in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>} Success status
   */
  async stopService(node, vmid, serviceName) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `systemctl stop ${serviceName}`);
      return result.code === 0;
    } catch (error) {
      console.error(`Error stopping service ${serviceName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Enable a service to start at boot in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>} Success status
   */
  async enableService(node, vmid, serviceName) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `systemctl enable ${serviceName}`);
      return result.code === 0;
    } catch (error) {
      console.error(`Error enabling service ${serviceName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }

  /**
   * Disable a service from starting at boot in a container
   * @param {string} node - Node name
   * @param {string} vmid - Container ID
   * @param {string} serviceName - Service name
   * @returns {Promise<boolean>} Success status
   */
  async disableService(node, vmid, serviceName) {
    try {
      const result = await sshService.executeInContainer(node, vmid, `systemctl disable ${serviceName}`);
      return result.code === 0;
    } catch (error) {
      console.error(`Error disabling service ${serviceName} in container ${vmid} on node ${node}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const appService = new AppService();

export default appService;
