/**
 * Authentication View
 * Handles the login page
 */
export class AuthView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the auth view
   */
  render() {
    // Clear root element
    this.app.ui.rootElement.innerHTML = this.getAuthHTML();
    
    // Add event listeners
    this.addEventListeners();
  }
  
  /**
   * Get auth HTML
   * @returns {string} Auth HTML
   */
  getAuthHTML() {
    return `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h2>Proxmox Manager</h2>
            <p>Log in to access your Proxmox infrastructure</p>
          </div>
          
          <form id="login-form">
            <div class="form-group mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" id="username" class="form-control" placeholder="Enter username" value="admin" required>
            </div>
            
            <div class="form-group mb-4">
              <label for="password" class="form-label">Password</label>
              <input type="password" id="password" class="form-control" placeholder="Enter password" value="admin" required>
            </div>
            
            <div id="login-error" class="alert alert-danger mb-3" style="display: none;"></div>
            
            <button type="submit" class="btn btn-primary w-100">
              <i class="fas fa-sign-in-alt me-2"></i> Login
            </button>
          </form>
          
          <div class="mt-4 text-center">
            <small class="text-muted">Default credentials: admin / admin</small>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    const loginForm = document.getElementById('login-form');
    
    // Add form submit listener
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }
  }
  
  /**
   * Handle login form submission
   */
  async handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('login-error');
    
    // Validate input
    if (!username || !password) {
      loginError.textContent = 'Please enter both username and password';
      loginError.style.display = 'block';
      return;
    }
    
    // Hide error message
    loginError.style.display = 'none';
    
    // Attempt login
    try {
      const success = await this.app.login(username, password);
      
      if (!success) {
        loginError.textContent = 'Invalid username or password';
        loginError.style.display = 'block';
      }
    } catch (error) {
      loginError.textContent = error.message || 'Failed to login. Please try again.';
      loginError.style.display = 'block';
    }
  }
}