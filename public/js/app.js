// Importing modules
import { API } from './api.js';
import { AppState } from './state.js';
import { Router } from './router.js';
import { UI } from './ui.js';
import { AuthView } from './views/auth.js';
import { DashboardView } from './views/dashboard.js';
import { NodesView } from './views/nodes.js';
import { VMsView } from './views/vms.js';
import { ContainersView } from './views/containers.js';
import { StorageView } from './views/storage.js';
import { NetworkView } from './views/network.js';
import { UpdatesView } from './views/updates.js';
import { SettingsView } from './views/settings.js';

// Main Application Class
class App {
  constructor() {
    // Initialize core components
    this.api = new API();
    this.state = new AppState();
    this.ui = new UI(this);
    
    // Register views
    this.registerViews();
    
    // Initialize router
    this.router = new Router(this);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check authentication and initialize app
    this.init();
  }
  
  // Register all views
  registerViews() {
    this.views = {
      auth: new AuthView(this),
      dashboard: new DashboardView(this),
      nodes: new NodesView(this),
      vms: new VMsView(this),
      containers: new ContainersView(this),
      storage: new StorageView(this),
      network: new NetworkView(this),
      updates: new UpdatesView(this),
      settings: new SettingsView(this)
    };
  }
  
  // Setup global event listeners
  setupEventListeners() {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const navLink = e.target.closest('.nav-link');
      if (navLink) {
        e.preventDefault();
        const route = navLink.dataset.route;
        if (route) {
          this.router.navigate(route);
        }
      }
    });
    
    // Handle logout
    document.addEventListener('click', (e) => {
      if (e.target.id === 'logout-btn') {
        e.preventDefault();
        this.logout();
      }
    });
  }
  
  // Initialize application
  async init() {
    console.log('Initializing Proxmox Manager...');
    
    // Check API status
    try {
      const status = await this.api.getStatus();
      console.log('API Status:', status);
      
      // Check if user is logged in using session
      try {
        const userData = await this.api.getCurrentUser();
        if (userData.user) {
          this.state.setUser(userData.user);
          this.router.navigate('dashboard');
        } else {
          this.router.navigate('auth');
        }
      } catch (error) {
        console.error('Failed to get user data:', error);
        this.router.navigate('auth');
      }
    } catch (error) {
      console.error('API is not available:', error);
      this.ui.showError('API server is not available. Please try again later.');
      this.router.navigate('auth');
    }
  }
  
  // Handle login
  async login(username, password) {
    try {
      this.ui.showLoading('Authenticating...');
      const response = await this.api.login(username, password);
      
      if (response.user) {
        this.state.setUser(response.user);
        this.ui.hideLoading();
        this.router.navigate('dashboard');
        return true;
      } else {
        this.ui.hideLoading();
        this.ui.showError('Login failed: ' + (response.error || 'Unknown error'));
        return false;
      }
    } catch (error) {
      this.ui.hideLoading();
      this.ui.showError('Login failed: ' + error.message);
      return false;
    }
  }
  
  // Handle logout
  async logout() {
    try {
      this.ui.showLoading('Logging out...');
      await this.api.logout();
      this.state.clearUser();
      this.ui.hideLoading();
      this.router.navigate('auth');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if the API call fails, we should still clear the local state
      this.state.clearUser();
      this.ui.hideLoading();
      this.router.navigate('auth');
    }
  }
  
  // Load application data
  async loadAppData() {
    this.ui.showLoading('Loading application data...');
    
    try {
      // Load nodes
      const nodes = await this.api.getNodes();
      this.state.setNodes(nodes);
      
      // Load VMs and containers only if we have nodes
      if (nodes.length > 0) {
        try {
          const vms = await this.api.getVMs();
          this.state.setVMs(vms.vms || []);
        } catch (error) {
          console.error('Failed to load VMs:', error);
        }
        
        try {
          const containers = await this.api.getContainers();
          this.state.setContainers(containers.containers || []);
        } catch (error) {
          console.error('Failed to load containers:', error);
        }
      }
      
      this.ui.hideLoading();
    } catch (error) {
      console.error('Failed to load application data:', error);
      this.ui.hideLoading();
      this.ui.showError('Failed to load application data. Please try again.');
    }
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});