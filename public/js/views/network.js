/**
 * Network View
 * Displays network interfaces and management
 */
import { formatBytes } from '../utils.js';

export class NetworkView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the network view
   * @param {Object} params - Route parameters
   */
  render(params = {}) {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    // Set app container with sidebar and content
    appElement.innerHTML = this.getLayoutHTML();
    
    // Render network content with "Coming Soon" message
    const contentElement = document.getElementById('main-content');
    if (contentElement) {
      contentElement.innerHTML = `
        <div class="mb-4">
          <h2>Network</h2>
        </div>
        
        <div class="card">
          <div class="card-body text-center py-5">
            <i class="fas fa-clock fa-4x mb-3 text-muted"></i>
            <h3>Coming Soon</h3>
            <p class="text-muted">Network management features are under development and will be available soon.</p>
            <button id="back-btn" class="btn btn-primary mt-3">
              <i class="fas fa-arrow-left me-2"></i> Back to Dashboard
            </button>
          </div>
        </div>
      `;
      
      // Add back button event listener
      const backBtn = document.getElementById('back-btn');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.app.router.navigate('dashboard');
        });
      }
    }
    
    // Add event listeners
    this.addEventListeners();
    
    // Set active navigation item
    this.setActiveNavItem('network');
  }
  
  /**
   * Get the layout HTML with sidebar and content container
   * @returns {string} Layout HTML
   */
  getLayoutHTML() {
    const { user } = this.app.state.getState();
    
    return `
      <div class="app-container">
        <!-- Sidebar -->
        <div class="sidebar">
          <div class="sidebar-header">
            <h4>Proxmox Manager</h4>
            <p class="text-muted mb-0">${user ? user.username : 'Guest'}</p>
          </div>
          
          <div class="sidebar-sticky">
            <ul class="nav flex-column">
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="dashboard">
                  <i class="fas fa-tachometer-alt"></i> Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="nodes">
                  <i class="fas fa-server"></i> Nodes
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="vms">
                  <i class="fas fa-desktop"></i> Virtual Machines
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="containers">
                  <i class="fas fa-box"></i> Containers
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="storage">
                  <i class="fas fa-hdd"></i> Storage
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="network">
                  <i class="fas fa-network-wired"></i> Network
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="templates">
                  <i class="fas fa-copy"></i> Templates
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link" href="#" data-route="settings">
                  <i class="fas fa-cog"></i> Settings
                </a>
              </li>
            </ul>
          </div>
          
          <div class="sidebar-footer">
            <button class="btn btn-outline-light w-100" id="logout-btn">
              <i class="fas fa-sign-out-alt me-2"></i> Logout
            </button>
          </div>
        </div>
        
        <!-- Main Content -->
        <div class="content">
          <div class="container-fluid" id="main-content">
            <!-- Network content will be rendered here -->
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.app.logout();
      });
    }
    
    // Navigation links
    const navLinks = document.querySelectorAll('[data-route]');
    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        const route = link.getAttribute('data-route');
        this.app.router.navigate(route);
      });
    });
  }
  
  /**
   * Set the active navigation item
   * @param {string} route - Route name
   */
  setActiveNavItem(route) {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.classList.remove('active');
      
      const linkRoute = link.getAttribute('data-route');
      if (linkRoute === route) {
        link.classList.add('active');
      }
    });
  }
}