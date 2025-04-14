/**
 * Dashboard State
 * Manages and preserves dashboard data across refreshes
 */
class DashboardState {
  constructor() {
    // Initialize dashboard data with default values
    this.data = {
      cluster: {
        nodes: [],
        stats: {
          totalNodes: 0,
          onlineNodes: 0,
          warningNodes: 0,
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
        }
      },
      // Historical data for charts
      history: {
        cpu: {
          data: [],
          labels: []
        },
        memory: {
          data: [],
          labels: []
        },
        network: {
          inbound: [],
          outbound: [],
          labels: []
        }
      },
      // Last updated timestamp
      lastUpdated: null
    };
    
    // Load data from localStorage if available
    this.loadFromLocalStorage();
    
    console.log('Dashboard state module loaded globally');
  }
  
  /**
   * Update dashboard data
   * @param {Object} newData - New dashboard data
   * @returns {Object} Updated data with preserved history
   */
  updateData(newData) {
    if (!newData || !newData.success || !newData.cluster) {
      console.error('Invalid dashboard data:', newData);
      return this.data;
    }
    
    // Update cluster data
    this.data.cluster = newData.cluster;
    
    // Update timestamp
    this.data.lastUpdated = new Date().toISOString();
    
    // Update history
    this.updateHistory();
    
    // Save to localStorage
    this.saveToLocalStorage();
    
    return this.data;
  }
  
  /**
   * Update history data for charts
   */
  updateHistory() {
    const currentTime = new Date();
    const timeLabel = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Update CPU history
    if (this.data.history.cpu.data.length >= 12) {
      this.data.history.cpu.data.shift();
      this.data.history.cpu.labels.shift();
    }
    this.data.history.cpu.data.push(this.data.cluster.stats.cpuUsage * 100);
    this.data.history.cpu.labels.push(timeLabel);
    
    // Update memory history
    if (this.data.history.memory.data.length >= 12) {
      this.data.history.memory.data.shift();
      this.data.history.memory.labels.shift();
    }
    this.data.history.memory.data.push(this.data.cluster.stats.usedMemory);
    this.data.history.memory.labels.push(timeLabel);
    
    // Update network history
    if (this.data.history.network.inbound.length >= 12) {
      this.data.history.network.inbound.shift();
      this.data.history.network.outbound.shift();
      this.data.history.network.labels.shift();
    }
    this.data.history.network.inbound.push(this.data.cluster.networkUsage.inbound);
    this.data.history.network.outbound.push(this.data.cluster.networkUsage.outbound);
    this.data.history.network.labels.push(timeLabel);
  }
  
  /**
   * Get dashboard data
   * @returns {Object} Dashboard data
   */
  getData() {
    return this.data;
  }
  
  /**
   * Get CPU usage history
   * @returns {Object} CPU usage history
   */
  getCPUHistory() {
    return {
      data: this.data.history.cpu.data,
      labels: this.data.history.cpu.labels
    };
  }
  
  /**
   * Get memory usage history
   * @returns {Object} Memory usage history
   */
  getMemoryHistory() {
    return {
      data: this.data.history.memory.data,
      labels: this.data.history.memory.labels
    };
  }
  
  /**
   * Get network usage history
   * @returns {Object} Network usage history
   */
  getNetworkHistory() {
    return {
      inbound: this.data.history.network.inbound,
      outbound: this.data.history.network.outbound,
      labels: this.data.history.network.labels
    };
  }
  
  /**
   * Get last updated timestamp
   * @returns {string} Last updated timestamp
   */
  getLastUpdated() {
    return this.data.lastUpdated;
  }
  
  /**
   * Clear dashboard state
   */
  clearState() {
    this.data = {
      cluster: {
        nodes: [],
        stats: {
          totalNodes: 0,
          onlineNodes: 0,
          warningNodes: 0,
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
        }
      },
      history: {
        cpu: {
          data: [],
          labels: []
        },
        memory: {
          data: [],
          labels: []
        },
        network: {
          inbound: [],
          outbound: [],
          labels: []
        }
      },
      lastUpdated: null
    };
    
    localStorage.removeItem('dashboardState');
  }
  
  /**
   * Save state to local storage
   */
  saveToLocalStorage() {
    try {
      const serializedState = JSON.stringify(this.data);
      localStorage.setItem('dashboardState', serializedState);
    } catch (error) {
      console.error('Failed to save dashboard state to local storage:', error);
    }
  }
  
  /**
   * Load state from local storage
   */
  loadFromLocalStorage() {
    try {
      const serializedState = localStorage.getItem('dashboardState');
      
      if (serializedState) {
        const savedState = JSON.parse(serializedState);
        this.data = savedState;
      }
    } catch (error) {
      console.error('Failed to load dashboard state from local storage:', error);
    }
  }
}

// Create a singleton instance
export const dashboardState = new DashboardState();