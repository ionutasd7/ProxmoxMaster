/**
 * Authentication View
 * Handles user login and registration
 */
export class AuthView {
  constructor(app) {
    this.app = app;
  }
  
  /**
   * Render the authentication view
   */
  render() {
    const appElement = document.getElementById('app');
    if (!appElement) return;
    
    appElement.innerHTML = `
      <div class="login-container">
        <div class="login-card">
          <div class="login-header">
            <h2>Proxmox Manager</h2>
            <p class="text-muted">Sign in to your account</p>
          </div>
          
          <div id="login-error-message" class="alert alert-danger mb-3 d-none">
            Invalid username or password
          </div>
          
          <form id="login-form">
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" value="admin" placeholder="Username" required>
            </div>
            
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" value="admin" placeholder="Password" required>
            </div>
            
            <div class="d-grid">
              <button type="submit" class="btn btn-primary">Sign In</button>
            </div>
          </form>
          
          <div class="mt-3 text-center text-muted">
            <small>Default credentials: admin / admin</small>
          </div>
        </div>
      </div>
    `;
    
    this.addEventListeners();
  }
  
  /**
   * Add event listeners
   */
  addEventListeners() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', this.handleLogin.bind(this));
    }
  }
  
  /**
   * Handle login form submission
   * @param {Event} event - Form submit event
   */
  async handleLogin(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('login-error-message');
    
    // Validate inputs
    if (!usernameInput || !passwordInput) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
      if (errorMessage) {
        errorMessage.textContent = 'Please enter username and password';
        errorMessage.classList.remove('d-none');
      }
      return;
    }
    
    // Hide any previous error messages
    if (errorMessage) {
      errorMessage.classList.add('d-none');
    }
    
    // Show loading state
    this.app.ui.showLoading('Signing in...');
    
    try {
      // Attempt to login
      const response = await this.app.api.login(username, password);
      
      if (response && response.user) {
        // Set the user in state and navigate to dashboard
        this.app.state.setUser(response.user);
        
        // Load application data and navigate to dashboard
        await this.app.loadAppData();
        this.app.router.navigate('dashboard');
        
        // Show success notification
        this.app.ui.showSuccess('Successfully signed in');
      } else {
        // Show error message
        if (errorMessage) {
          errorMessage.textContent = 'Invalid username or password';
          errorMessage.classList.remove('d-none');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      if (errorMessage) {
        errorMessage.textContent = error.message || 'Failed to sign in. Please try again.';
        errorMessage.classList.remove('d-none');
      }
    } finally {
      // Hide loading state
      this.app.ui.hideLoading();
    }
  }
}