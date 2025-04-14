/**
 * Authentication View
 */
export function renderAuthView(app) {
  const { api, ui } = app;
  
  // Create container
  const container = document.createElement('div');
  container.className = 'login-container';
  
  // Create login card
  const card = document.createElement('div');
  card.className = 'login-card shadow-lg';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'login-header';
  header.innerHTML = `
    <h1 class="display-5 mb-3">Proxmox Manager</h1>
    <p class="lead text-muted">Login to access your Proxmox infrastructure</p>
  `;
  
  // Create form
  const form = document.createElement('form');
  form.id = 'login-form';
  form.className = 'needs-validation';
  form.noValidate = true;
  
  form.innerHTML = `
    <div class="mb-3">
      <label for="username" class="form-label">Username</label>
      <input type="text" class="form-control" id="username" placeholder="admin" required>
      <div class="invalid-feedback">Please enter your username</div>
    </div>
    
    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input type="password" class="form-control" id="password" required>
      <div class="invalid-feedback">Please enter your password</div>
    </div>
    
    <div class="d-grid gap-2">
      <button type="submit" class="btn btn-primary btn-lg">Login</button>
    </div>
    
    <hr class="my-4">
    
    <div class="alert alert-info">
      <h5><i class="fas fa-info-circle me-2"></i> Having trouble connecting to Proxmox?</h5>
      <p>If you're having trouble connecting to your Proxmox server with username/password authentication, you might need to use an API token instead.</p>
      <a href="#" class="btn btn-outline-primary" id="use-api-token-btn">Use API Token</a>
    </div>
  `;
  
  // Handle form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Validate form
    form.classList.add('was-validated');
    
    if (!form.checkValidity()) {
      return;
    }
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    try {
      await app.login(username, password);
    } catch (error) {
      ui.showError(`Login failed: ${error.message}`);
    }
  });
  
  // Assemble view
  card.appendChild(header);
  card.appendChild(form);
  container.appendChild(card);
  
  // Add event listener for API token button
  document.addEventListener('DOMContentLoaded', () => {
    const apiTokenBtn = document.getElementById('use-api-token-btn');
    if (apiTokenBtn) {
      apiTokenBtn.addEventListener('click', (e) => {
        e.preventDefault();
        app.router.navigate('apiToken');
      });
    }
  });
  
  return container;
}