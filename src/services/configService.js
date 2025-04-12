/**
 * Configuration Service
 * Handles saving and loading application configuration
 */

class ConfigService {
  /**
   * Save configuration
   * @param {Object} config - Configuration object
   * @returns {Promise<Object>} Result with success status
   */
  async saveConfig(config) {
    try {
      const result = await window.api.saveConfig(config);
      return result;
    } catch (error) {
      console.error('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Load configuration
   * @returns {Promise<Object>} Configuration object
   */
  async loadConfig() {
    try {
      const result = await window.api.loadConfig();
      return result;
    } catch (error) {
      console.error('Error loading configuration:', error);
      throw error;
    }
  }

  /**
   * Save authentication data
   * @param {Object} authData - Authentication data
   * @returns {Promise<Object>} Result with success status
   */
  async saveAuthData(authData) {
    try {
      // Load existing config
      const currentConfig = await this.loadConfig();
      
      // Update auth data
      const newConfig = {
        ...(currentConfig.success ? currentConfig.config : {}),
        authData
      };
      
      // Save updated config
      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('Error saving authentication data:', error);
      throw error;
    }
  }

  /**
   * Load authentication data
   * @returns {Promise<Object|null>} Authentication data or null if not found
   */
  async loadAuthData() {
    try {
      const result = await this.loadConfig();
      
      if (result.success && result.config && result.config.authData) {
        return result.config.authData;
      }
      
      return null;
    } catch (error) {
      console.error('Error loading authentication data:', error);
      return null;
    }
  }

  /**
   * Clear authentication data
   * @returns {Promise<Object>} Result with success status
   */
  async clearAuthData() {
    try {
      // Load existing config
      const currentConfig = await this.loadConfig();
      
      // Remove auth data
      const newConfig = {
        ...(currentConfig.success ? currentConfig.config : {})
      };
      
      delete newConfig.authData;
      
      // Save updated config
      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('Error clearing authentication data:', error);
      throw error;
    }
  }

  /**
   * Save user settings
   * @param {Object} settings - User settings
   * @returns {Promise<Object>} Result with success status
   */
  async saveSettings(settings) {
    try {
      // Load existing config
      const currentConfig = await this.loadConfig();
      
      // Update settings
      const newConfig = {
        ...(currentConfig.success ? currentConfig.config : {}),
        settings
      };
      
      // Save updated config
      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Load user settings
   * @returns {Promise<Object>} User settings with defaults applied
   */
  async loadSettings() {
    try {
      // Default settings
      const defaultSettings = {
        apiUsername: 'api@pam!home',
        apiHost: 'pve.ionutlab.com',
        sshUsername: 'root',
        sshPassword: 'Poolamea01@',
        refreshInterval: 30,
        theme: 'light',
        confirmDangerousActions: true,
        showNotifications: true
      };
      
      const result = await this.loadConfig();
      
      if (result.success && result.config && result.config.settings) {
        // Merge with default settings to ensure all fields exist
        return {
          ...defaultSettings,
          ...result.config.settings
        };
      }
      
      return defaultSettings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return defaultSettings;
    }
  }
}

// Create a singleton instance
const configService = new ConfigService();

export default configService;
