// Importing modules
import { API } from './api.js';
import { AppState } from './state.js';
import { Router } from './router.js';
import { UI } from './ui.js';
import { dashboardState } from './dashboard-state.js';
import { AuthView } from './views/auth.js';
import { DashboardView } from './views/dashboard.js';
import { NodesView } from './views/nodes.js';
import { VMsView } from './views/vms.js';
import { ContainersView } from './views/containers.js';
import { StorageView } from './views/storage.js';
import { NetworkView } from './views/network.js';
import { TemplatesView } from './views/templates.js';
import { SettingsView } from './views/settings.js';

// Main Application Class
class App {
  constructor() {
    // Initialize core components
    this.api = new API();
    this.state = new AppState();
    this.ui = new UI(this);
    window.dashboardState = dashboardState;
    
    // Register views
    this.registerViews();
    
    // Initialize router
    this.router = new Router(this);
    
    // Initialize the application
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
      templates: new TemplatesView(this),
      settings: new SettingsView(this)
    };
  }
  
  // Initialize application
  async init() {
    console.log('Initializing Proxmox Manager...');
    
    try {
      // Check API status
      const status = await this.api.getStatus();
      console.log('API Status:', status);
      
      // Check if user is logged in
      try {
        const userData = await this.api.getCurrentUser();
        
        if (userData && userData.user) {
          // User is logged in, set user and load app data
          this.state.setUser(userData.user);
          await this.loadAppData();
          
          // Navigate to dashboard
          this.router.navigate('dashboard');
        } else {
          // User is not logged in, navigate to auth page
          this.router.navigate('auth');
        }
      } catch (error) {
        console.error('Failed to get user data:', error);
        
        // Navigate to auth page
        this.router.navigate('auth');
      }
    } catch (error) {
      console.error('API is not available:', error);
      this.ui.showError('API server is not available. Please try again later.');
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
      
      // Load VMs
      try {
        const vms = await this.api.getVMs();
        this.state.setVMs(vms.vms || []);
      } catch (vmError) {
        console.error('Error loading VMs:', vmError);
      }
      
      // Load containers
      try {
        const containers = await this.api.getContainers();
        this.state.setContainers(containers.containers || []);
      } catch (containerError) {
        console.error('Error loading containers:', containerError);
      }
      
      // Load dashboard data
      try {
        const dashboardData = await this.api.getDashboardData();
        this.state.setDashboardData(dashboardData);
      } catch (dashboardError) {
        console.error('Error loading dashboard data:', dashboardError);
      }
      
      // Load VM templates
      try {
        const vmTemplates = await this.api.getVMTemplates();
        this.state.setVMTemplates(vmTemplates);
      } catch (templateError) {
        console.error('Error loading VM templates:', templateError);
      }
      
      // Load LXC templates
      try {
        const lxcTemplates = await this.api.getLXCTemplates();
        this.state.setLXCTemplates(lxcTemplates);
      } catch (templateError) {
        console.error('Error loading LXC templates:', templateError);
      }
    } catch (error) {
      console.error('Error loading application data:', error);
      this.ui.showError('Failed to load data. Please try refreshing the page.');
    } finally {
      this.ui.hideLoading();
    }
  }
  
  // Logout user
  async logout() {
    this.ui.showLoading('Logging out...');
    
    try {
      await this.api.logout();
      this.state.clearUser();
      dashboardState.clearState();
      this.router.navigate('auth');
      this.ui.showSuccess('Successfully logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      this.ui.showError('Failed to logout. Please try again.');
    } finally {
      this.ui.hideLoading();
    }
  }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});