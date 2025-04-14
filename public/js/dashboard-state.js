/**
 * Dashboard State Management
 * 
 * This module preserves dashboard data across refreshes 
 * and prevents zero values from overwriting good data
 */

class DashboardState {
  constructor() {
    this.data = {
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
      },
      nodes: []
    };

    // Load any previously saved state
    this.loadState();
  }

  /**
   * Update dashboard data, preserving good values
   * 
   * @param {Object} newData - New dashboard data from API
   * @returns {Object} Merged data with preserved good values
   */
  updateData(newData) {
    if (!newData || !newData.cluster) return this.data;

    const stats = newData.cluster.stats || {};
    const networkUsage = newData.cluster.networkUsage || {};
    const nodes = newData.cluster.nodes || [];

    // Preserve non-zero values in stats
    if (stats) {
      Object.keys(stats).forEach(key => {
        // Only update if the new value is not zero or we don't have a value yet
        if ((stats[key] !== 0 && stats[key] !== null) || !this.data.stats[key]) {
          this.data.stats[key] = stats[key];
        }
      });
    }

    // Preserve non-zero values in network usage
    if (networkUsage) {
      // Only update if the new value is not zero or we don't have a value yet
      if ((networkUsage.inbound !== 0 && networkUsage.inbound !== null) || !this.data.networkUsage.inbound) {
        this.data.networkUsage.inbound = networkUsage.inbound;
      }
      if ((networkUsage.outbound !== 0 && networkUsage.outbound !== null) || !this.data.networkUsage.outbound) {
        this.data.networkUsage.outbound = networkUsage.outbound;
      }
    }

    // Update nodes if we have any
    if (nodes && nodes.length > 0) {
      this.data.nodes = nodes;
    }

    // Save the updated state
    this.saveState();

    // Return the merged data
    return {
      cluster: {
        stats: this.data.stats,
        networkUsage: this.data.networkUsage,
        nodes: this.data.nodes
      }
    };
  }

  /**
   * Save state to sessionStorage
   * 
   * @private
   */
  saveState() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('dashboardState', JSON.stringify(this.data));
      }
    } catch (err) {
      console.warn('Failed to save dashboard state:', err);
    }
  }

  /**
   * Load state from sessionStorage
   * 
   * @private
   */
  loadState() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        const savedState = sessionStorage.getItem('dashboardState');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          // Merge saved state with default state
          this.data = {
            stats: { ...this.data.stats, ...parsedState.stats },
            networkUsage: { ...this.data.networkUsage, ...parsedState.networkUsage },
            nodes: parsedState.nodes || []
          };
        }
      }
    } catch (err) {
      console.warn('Failed to load dashboard state:', err);
    }
  }

  /**
   * Clear all saved state
   */
  clearState() {
    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('dashboardState');
      }
      // Reset to defaults
      this.data = {
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
        },
        nodes: []
      };
    } catch (err) {
      console.warn('Failed to clear dashboard state:', err);
    }
  }
}

// Export a singleton instance
export const dashboardState = new DashboardState();