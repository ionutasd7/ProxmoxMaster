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
    
    // Show loading indicator
    const submitBtn = document.querySelector('#login-form button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Logging in...';
    
    // Attempt login directly with fetch to diagnose the issue
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.user) {
          // Store user in app state
          this.app.state.setUser(data.user);
          // Set auth token
          localStorage.setItem('authToken', 'tempToken');
          // Navigate to dashboard
          this.app.router.navigate('dashboard');
          return true;
        } else {
          loginError.textContent = 'Invalid response from server';
          loginError.style.display = 'block';
          return false;
        }
      } else {
        const errorText = `Login failed: ${response.status} ${response.statusText}`;
        loginError.textContent = errorText;
        loginError.style.display = 'block';
        console.error(errorText);
        return false;
      }
    } catch (error) {
      // Reset button
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      
      // Show error
      loginError.textContent = error.message || 'Failed to login. Please try again.';
      loginError.style.display = 'block';
      console.error('Login error:', error);
      return false;
    }
  }
}