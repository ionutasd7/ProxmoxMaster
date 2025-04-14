/**
 * Proxmox Manager - Main Application Module
 */
import { API } from './api.js';
import { Router } from './router.js';
import { UI } from './ui.js';
import { dashboardState } from './dashboard-state.js';

/**
 * Main Application Class
 */
class App {
  constructor() {
    // Initialize state
    this.isAuthenticated = false;
    this.user = null;
    this.nodes = [];
    this.vms = [];
    this.containers = [];
    this.dashboardState = dashboardState;
    
    // Initialize API client
    this.api = new API();
    
    // Initialize UI helper
    this.ui = new UI(this);
    
    // Initialize router (will be set in init)
    this.router = null;
    
    // Register views (map of view name to render function)
    this.views = {};
    
    console.log('Initializing Proxmox Manager...');
  }
  
  /**
   * Register application views
   */
  registerViews() {
    // Views will be dynamically imported by the router
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Check API status
      const status = await this.api.getStatus();
      console.log('API Status:', status);
      
      // Check if user is already authenticated
      try {
        const userResponse = await this.api.getCurrentUser();
        if (userResponse && userResponse.user) {
          this.isAuthenticated = true;
          this.user = userResponse.user;
        }
      } catch (error) {
        console.log('Not authenticated:', error);
      }
      
      // Initialize router (after we know auth status)
      this.router = new Router(this);
      
      // Register event listeners
      this.registerEventListeners();
      
      // Load initial data if authenticated
      if (this.isAuthenticated) {
        await this.loadAppData();
      }
      
      // Show disconnection warning if there are nodes but can't connect
      if (this.isAuthenticated) {
        try {
          const nodesResponse = await this.api.getNodes();
          if (nodesResponse && nodesResponse.length > 0) {
            // Check if any nodes are online
            const onlineNodes = nodesResponse.filter(node => node.status === 'online');
            if (onlineNodes.length === 0) {
              this.showConnectionIssuePrompt();
            }
          }
        } catch (error) {
          console.error('Error checking nodes:', error);
        }
      }
      
    } catch (error) {
      console.error('Initialization error:', error);
      this.ui.showError('Failed to initialize application');
    }
  }
  
  /**
   * Register event listeners
   */
  registerEventListeners() {
    // Global click handler for navigation
    document.addEventListener('click', (e) => {
      // Handle navigation links
      if (e.target.matches('a[data-route]') || e.target.closest('a[data-route]')) {
        e.preventDefault();
        const link = e.target.matches('a[data-route]') ? e.target : e.target.closest('a[data-route]');
        const route = link.getAttribute('data-route');
        
        // Get params if available
        let params = {};
        if (link.hasAttribute('data-params')) {
          try {
            params = JSON.parse(link.getAttribute('data-params'));
          } catch (error) {
            console.error('Invalid route params:', error);
          }
        }
        
        this.router.navigate(route, params);
      }
      
      // Handle logout
      if (e.target.matches('[data-action="logout"]') || e.target.closest('[data-action="logout"]')) {
        e.preventDefault();
        this.logout();
      }
      
      // Handle API token setup
      if (e.target.matches('[data-action="api-token"]') || e.target.closest('[data-action="api-token"]')) {
        e.preventDefault();
        this.router.navigate('apiToken');
      }
    });
  }
  
  /**
   * Load application data
   */
  async loadAppData() {
    try {
      // Show loading
      this.ui.showLoading('Loading data...');
      
      // Load nodes
      try {
        this.nodes = await this.api.getNodes();
      } catch (error) {
        console.error('Error loading nodes:', error);
      }
      
      // Load dashboard data
      try {
        const dashboardData = await this.api.getDashboardData();
        if (dashboardData && dashboardData.success) {
          this.dashboardState.updateData(dashboardData);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
      
      // Hide loading
      this.ui.hideLoading();
    } catch (error) {
      this.ui.hideLoading();
      console.error('Error loading app data:', error);
      this.ui.showError('Failed to load application data');
    }
  }
  
  /**
   * Refresh dashboard data
   */
  async refreshDashboard() {
    try {
      const dashboardData = await this.api.getDashboardData();
      if (dashboardData && dashboardData.success) {
        this.dashboardState.updateData(dashboardData);
        return this.dashboardState.getData();
      }
      return null;
    } catch (error) {
      console.error('Error refreshing dashboard data:', error);
      return null;
    }
  }
  
  /**
   * Show connection issue prompt
   */
  showConnectionIssuePrompt() {
    const container = document.createElement('div');
    container.className = 'modal fade';
    container.id = 'connection-issue-modal';
    container.setAttribute('tabindex', '-1');
    container.setAttribute('aria-hidden', 'true');
    
    container.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header bg-warning">
            <h5 class="modal-title">
              <i class="fas fa-exclamation-triangle me-2"></i> Connection Issues Detected
            </h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <p>We're having trouble connecting to your Proxmox server. This could be due to:</p>
            <ul>
              <li>Incorrect credentials</li>
              <li>The server might be offline</li>
              <li>SSL/TLS certificate issues</li>
              <li>Proxmox API requiring a token instead of password</li>
            </ul>
            <p>Would you like to try using API token authentication instead?</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Dismiss</button>
            <button type="button" class="btn btn-primary" id="setup-api-token-btn">
              Set Up API Token
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(container);
    
    // Initialize modal
    const modal = new bootstrap.Modal(container);
    
    // Add event listener to setup button
    const setupBtn = document.getElementById('setup-api-token-btn');
    setupBtn.addEventListener('click', () => {
      modal.hide();
      this.router.navigate('apiToken');
    });
    
    // Show modal
    modal.show();
    
    // Remove modal from DOM when hidden
    container.addEventListener('hidden.bs.modal', () => {
      container.remove();
    });
  }
  
  /**
   * Handle user login
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<boolean>} Login success
   */
  async login(username, password) {
    try {
      this.ui.showLoading('Logging in...');
      
      const response = await this.api.login(username, password);
      
      if (response && response.user) {
        this.isAuthenticated = true;
        this.user = response.user;
        
        this.ui.hideLoading();
        this.ui.showSuccess('Login successful');
        
        // Load app data
        await this.loadAppData();
        
        // Navigate to dashboard
        this.router.navigate('dashboard');
        
        return true;
      } else {
        this.ui.hideLoading();
        this.ui.showError('Login failed: Invalid response');
        return false;
      }
    } catch (error) {
      this.ui.hideLoading();
      this.ui.showError(`Login failed: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Handle user logout
   */
  async logout() {
    try {
      this.ui.showLoading('Logging out...');
      
      await this.api.logout();
      
      this.isAuthenticated = false;
      this.user = null;
      
      // Clear dashboard state
      this.dashboardState.clearState();
      
      this.ui.hideLoading();
      this.ui.showSuccess('Logout successful');
      
      // Navigate to login page
      this.router.navigate('auth');
    } catch (error) {
      this.ui.hideLoading();
      this.ui.showError(`Logout failed: ${error.message}`);
    }
  }
}

// Create and export app instance
const app = new App();

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});

export default app;