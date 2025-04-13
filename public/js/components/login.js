/**
 * Login View Component
 * Renders the login form and handles authentication
 */

const LoginView = {
  /**
   * Render the login view
   * @param {HTMLElement} container - The container element
   * @param {Object} params - Optional parameters
   */
  render(container, params = {}) {
    // Create the login container
    const loginContainer = createElement('div', { className: 'login-container' });
    
    // Add a grid background
    loginContainer.appendChild(createElement('div', { className: 'grid-bg' }));
    
    // Create the login card
    const loginCard = createElement('div', { className: 'card login-card' });
    
    // Set card content
    loginCard.innerHTML = `
      <div class="card-header">
        <h3 class="text-center mb-0 glow-text">PROXMOX MANAGER</h3>
      </div>
      <div class="card-body">
        <div class="text-center mb-4">
          <i class="fas fa-server fa-3x mb-3" style="color: var(--primary);"></i>
          <p class="lead mb-0">Sign in to access your Proxmox infrastructure</p>
        </div>
        <form id="login-form">
          <div class="mb-3">
            <label for="username" class="form-label">Username</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-user"></i></span>
              <input type="text" class="form-control" id="username" placeholder="Enter username" autocomplete="username" required>
            </div>
          </div>
          <div class="mb-4">
            <label for="password" class="form-label">Password</label>
            <div class="input-group">
              <span class="input-group-text"><i class="fas fa-lock"></i></span>
              <input type="password" class="form-control" id="password" placeholder="Enter password" autocomplete="current-password" required>
            </div>
          </div>
          <button type="button" class="btn btn-primary w-100" data-action="login">
            <i class="fas fa-sign-in-alt me-2"></i> Login
          </button>
        </form>
      </div>
      <div class="card-footer text-center text-muted py-3">
        <small>Proxmox Infrastructure Manager v1.0</small>
      </div>
    `;
    
    // Add the login card to the container
    loginContainer.appendChild(loginCard);
    
    // Add the login container to the main container
    container.appendChild(loginContainer);
    
    // Set up event listeners
    this.setupEventListeners();
  },
  
  /**
   * Set up event listeners for the login form
   */
  setupEventListeners() {
    // Get the login form
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
      // Add submit event
      loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // Trigger login action
        const loginButton = document.querySelector('[data-action="login"]');
        if (loginButton) {
          loginButton.click();
        }
      });
      
      // Focus on username field
      const usernameInput = document.getElementById('username');
      if (usernameInput) {
        usernameInput.focus();
      }
    }
  }
};