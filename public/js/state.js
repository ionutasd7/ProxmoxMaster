/**
 * Application State Management
 * Handles the application state and state changes
 */
export class AppState {
  constructor() {
    // Initialize state
    this.state = {
      user: null,
      nodes: [],
      vms: [],
      containers: [],
      selectedNode: null,
      selectedVM: null,
      selectedContainer: null,
      isLoading: false,
      error: null
    };
    
    // Event subscribers
    this.subscribers = [];
  }
  
  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return this.state;
  }
  
  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Notify all subscribers of state change
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.state));
  }
  
  /**
   * Update state
   * @param {Object} newState - New state object
   */
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifySubscribers();
  }
  
  /**
   * Set user
   * @param {Object} user - User object
   */
  setUser(user) {
    this.setState({ user });
  }
  
  /**
   * Clear user
   */
  clearUser() {
    this.setState({ user: null });
  }
  
  /**
   * Set nodes
   * @param {Array} nodes - Nodes array
   */
  setNodes(nodes) {
    this.setState({ nodes });
  }
  
  /**
   * Set virtual machines
   * @param {Array} vms - VMs array
   */
  setVMs(vms) {
    this.setState({ vms });
  }
  
  /**
   * Set containers
   * @param {Array} containers - Containers array
   */
  setContainers(containers) {
    this.setState({ containers });
  }
  
  /**
   * Set selected node
   * @param {Object|null} node - Selected node or null
   */
  setSelectedNode(node) {
    this.setState({ selectedNode: node });
  }
  
  /**
   * Set selected VM
   * @param {Object|null} vm - Selected VM or null
   */
  setSelectedVM(vm) {
    this.setState({ selectedVM: vm });
  }
  
  /**
   * Set selected container
   * @param {Object|null} container - Selected container or null
   */
  setSelectedContainer(container) {
    this.setState({ selectedContainer: container });
  }
  
  /**
   * Set loading state
   * @param {boolean} isLoading - Is loading
   */
  setLoading(isLoading) {
    this.setState({ isLoading });
  }
  
  /**
   * Set error
   * @param {string|null} error - Error message or null
   */
  setError(error) {
    this.setState({ error });
  }
}