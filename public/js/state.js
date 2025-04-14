/**
 * Application State
 * Centralized state management for the application
 */
export class AppState {
  constructor() {
    // Default application state
    this.state = {
      // User
      user: null,
      
      // Nodes
      nodes: [],
      
      // Virtual Machines
      vms: [],
      
      // Containers
      containers: [],
      
      // Templates
      vmTemplates: [],
      lxcTemplates: [],
      
      // Dashboard data
      dashboard: {
        stats: {
          totalNodes: 0,
          onlineNodes: 0,
          offlineNodes: 0,
          totalVMs: 0,
          runningVMs: 0,
          totalContainers: 0,
          runningContainers: 0,
          totalCPUs: 0,
          cpuUsage: 0,
          totalMemory: 0,
          usedMemory: 0,
          totalStorage: 0,
          usedStorage: 0
        },
        networkUsage: {
          inbound: 0,
          outbound: 0
        },
        history: []
      }
    };
    
    // Initialize from local storage if available
    this.loadFromLocalStorage();
  }
  
  /**
   * Get the current state
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Set the user
   * @param {Object} user - User
   */
  setUser(user) {
    this.state.user = user;
    this.saveToLocalStorage();
  }
  
  /**
   * Clear the user
   */
  clearUser() {
    this.state.user = null;
    this.saveToLocalStorage();
  }
  
  /**
   * Set nodes
   * @param {Array} nodes - Nodes
   */
  setNodes(nodes) {
    this.state.nodes = nodes || [];
    this.saveToLocalStorage();
  }
  
  /**
   * Set virtual machines
   * @param {Array} vms - Virtual machines
   */
  setVMs(vms) {
    this.state.vms = vms || [];
    this.saveToLocalStorage();
  }
  
  /**
   * Set containers
   * @param {Array} containers - Containers
   */
  setContainers(containers) {
    this.state.containers = containers || [];
    this.saveToLocalStorage();
  }
  
  /**
   * Set VM templates
   * @param {Array} templates - VM templates
   */
  setVMTemplates(templates) {
    this.state.vmTemplates = templates || [];
    this.saveToLocalStorage();
  }
  
  /**
   * Set LXC templates
   * @param {Array} templates - LXC templates
   */
  setLXCTemplates(templates) {
    this.state.lxcTemplates = templates || [];
    this.saveToLocalStorage();
  }
  
  /**
   * Set dashboard data
   * @param {Object} data - Dashboard data
   */
  setDashboardData(data) {
    if (data) {
      this.state.dashboard = data;
      this.saveToLocalStorage();
    }
  }
  
  /**
   * Check if user is authenticated
   * @returns {boolean} Whether user is authenticated
   */
  isAuthenticated() {
    return !!this.state.user;
  }
  
  /**
   * Save state to local storage
   */
  saveToLocalStorage() {
    try {
      const serializedState = JSON.stringify({
        user: this.state.user,
        // Don't store large datasets in localStorage
        // They will be fetched from API when needed
      });
      
      localStorage.setItem('proxmoxManagerState', serializedState);
    } catch (error) {
      console.error('Failed to save state to local storage:', error);
    }
  }
  
  /**
   * Load state from local storage
   */
  loadFromLocalStorage() {
    try {
      const serializedState = localStorage.getItem('proxmoxManagerState');
      
      if (serializedState) {
        const savedState = JSON.parse(serializedState);
        
        // Restore saved state properties
        if (savedState.user) {
          this.state.user = savedState.user;
        }
      }
    } catch (error) {
      console.error('Failed to load state from local storage:', error);
    }
  }
  
  /**
   * Clear all state
   */
  clearState() {
    this.state = {
      user: null,
      nodes: [],
      vms: [],
      containers: [],
      vmTemplates: [],
      lxcTemplates: [],
      dashboard: {
        stats: {
          totalNodes: 0,
          onlineNodes: 0,
          offlineNodes: 0,
          totalVMs: 0,
          runningVMs: 0,
          totalContainers: 0,
          runningContainers: 0,
          totalCPUs: 0,
          cpuUsage: 0,
          totalMemory: 0,
          usedMemory: 0,
          totalStorage: 0,
          usedStorage: 0
        },
        networkUsage: {
          inbound: 0,
          outbound: 0
        },
        history: []
      }
    };
    
    localStorage.removeItem('proxmoxManagerState');
  }
}