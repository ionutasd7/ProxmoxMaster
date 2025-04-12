const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    // System
    ping: (ip) => ipcRenderer.invoke('ping', ip),
    
    // SSH
    sshCommand: (args) => ipcRenderer.invoke('ssh-command', args),
    
    // Configuration
    saveConfig: (config) => ipcRenderer.invoke('save-config', config),
    loadConfig: () => ipcRenderer.invoke('load-config'),
    
    // Proxmox API related functions
    callProxmoxApi: async (method, url, data = null) => {
      // This is just a bridge to the main process
      // The actual API request will be handled in the renderer process using axios
      return { method, url, data };
    }
  }
);
