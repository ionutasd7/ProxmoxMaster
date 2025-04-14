/**
 * Dashboard State Management
 * 
 * This module preserves dashboard data across refreshes 
 * and prevents zero values from overwriting good data
 */

class DashboardState {
  constructor() {
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
      }
    };
    
    // Load state if available
    this.loadState();
  }
  
  /**
   * Update dashboard data, preserving good values
   * 
   * @param {Object} newData - New dashboard data from API
   * @returns {Object} Merged data with preserved good values
   */
  updateData(newData) {
    // Deep clone current data
    const currentData = JSON.parse(JSON.stringify(this.data));
    
    if (!newData || !newData.cluster) {
      return currentData;
    }
    
    const { cluster } = newData;
    
    // Merge nodes
    if (cluster.nodes && Array.isArray(cluster.nodes)) {
      currentData.cluster.nodes = cluster.nodes;
    }
    
    // Merge stats carefully (don't overwrite good values with zeros)
    if (cluster.stats) {
      const newStats = cluster.stats;
      const currentStats = currentData.cluster.stats;
      
      // For each stat, only update if new value exists and is not zero (unless current is also zero)
      for (const key in newStats) {
        if (newStats[key] !== undefined && (newStats[key] > 0 || currentStats[key] === 0)) {
          currentStats[key] = newStats[key];
        }
      }
    }
    
    // Merge network usage 
    if (cluster.networkUsage) {
      const newNetwork = cluster.networkUsage;
      const currentNetwork = currentData.cluster.networkUsage;
      
      // For each network stat, only update if new value exists and is not zero (unless current is also zero)
      for (const key in newNetwork) {
        if (newNetwork[key] !== undefined && (newNetwork[key] > 0 || currentNetwork[key] === 0)) {
          currentNetwork[key] = newNetwork[key];
        }
      }
    }
    
    // Save merged state
    this.data = currentData;
    this.saveState();
    
    return currentData;
  }
  
  /**
   * Save state to sessionStorage
   * 
   * @private
   */
  saveState() {
    try {
      sessionStorage.setItem('dashboardState', JSON.stringify(this.data));
    } catch (error) {
      console.error('Failed to save dashboard state to sessionStorage:', error);
    }
  }
  
  /**
   * Load state from sessionStorage
   * 
   * @private
   */
  loadState() {
    try {
      const savedState = sessionStorage.getItem('dashboardState');
      if (savedState) {
        this.data = JSON.parse(savedState);
      }
    } catch (error) {
      console.error('Failed to load dashboard state from sessionStorage:', error);
    }
  }
  
  /**
   * Clear all saved state
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
      }
    };
    
    try {
      sessionStorage.removeItem('dashboardState');
    } catch (error) {
      console.error('Failed to clear dashboard state from sessionStorage:', error);
    }
  }
}

export const dashboardState = new DashboardState();