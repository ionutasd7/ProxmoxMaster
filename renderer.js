// This file is used to initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  console.log('Proxmox Infrastructure Manager initializing...');
  
  // Simple login form for development/demo
  const root = document.getElementById('root');
  
  root.innerHTML = `
    <div class="login-container">
      <div class="card login-card">
        <div class="card-header bg-primary text-white">
          <h3 class="text-center mb-0">Proxmox Infrastructure Manager</h3>
        </div>
        <div class="card-body">
          <form id="login-form">
            <div class="mb-3">
              <label for="host" class="form-label">Proxmox Host</label>
              <input type="text" class="form-control" id="host" value="pve.ionutlab.com" required>
              <div class="form-text">Hostname or IP of your Proxmox server</div>
            </div>
            <div class="mb-3">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" value="api@pam!home" required>
              <div class="form-text">API user with sufficient privileges</div>
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" value="8cd15ef7-d25b-4955-9c32-48d42e23b109" required>
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary">Log In</button>
            </div>
          </form>
        </div>
        <div class="card-footer text-center text-muted">
          <small>Version 1.0.0</small>
        </div>
      </div>
    </div>
  `;
  
  // Add event listener for the login form
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const host = document.getElementById('host').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    // Show a loading indicator
    root.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
          <span class="visually-hidden">Loading...</span>
        </div>
        <h4 class="ms-3">Connecting to Proxmox server...</h4>
      </div>
    `;
    
    // Simulate successful login after a short delay (for demo)
    setTimeout(() => {
      root.innerHTML = `
        <div class="dashboard-container">
          <div class="sidebar">
            <div class="sidebar-header">
              <h4>Proxmox Manager</h4>
            </div>
            <div class="sidebar-menu">
              <div class="sidebar-section">
                <h6>Overview</h6>
                <button class="nav-link active">Dashboard</button>
                <button class="nav-link">Nodes</button>
              </div>
              <div class="sidebar-section">
                <h6>Virtual Machines</h6>
                <button class="nav-link">VM List</button>
                <button class="nav-link">Create VM</button>
              </div>
              <div class="sidebar-section">
                <h6>Containers</h6>
                <button class="nav-link">LXC List</button>
                <button class="nav-link">Create LXC</button>
              </div>
              <div class="sidebar-section">
                <h6>Management</h6>
                <button class="nav-link">Network</button>
                <button class="nav-link">Storage</button>
                <button class="nav-link">Updates</button>
                <button class="nav-link">Applications</button>
              </div>
              <div class="sidebar-section">
                <h6>System</h6>
                <button class="nav-link">Settings</button>
                <button class="nav-link">Logout</button>
              </div>
            </div>
          </div>
          <div class="main-content">
            <h1>Dashboard</h1>
            <p>Welcome to Proxmox Infrastructure Manager</p>
            <p>Connected to: ${host}</p>
            <p>User: ${username}</p>
            
            <div class="alert alert-info">
              This is a demo interface. The full application requires proper React setup.
            </div>
            
            <div class="row mt-4">
              <div class="col-md-4 mb-4">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0">Nodes</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="display-4 me-3">4</div>
                      <div>
                        <div class="text-success">4 Online</div>
                        <div class="text-muted">0 Offline</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4 mb-4">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0">Virtual Machines</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="display-4 me-3">8</div>
                      <div>
                        <div class="text-success">5 Running</div>
                        <div class="text-danger">3 Stopped</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4 mb-4">
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0">LXC Containers</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="display-4 me-3">12</div>
                      <div>
                        <div class="text-success">10 Running</div>
                        <div class="text-danger">2 Stopped</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners for the sidebar buttons
      document.querySelectorAll('.sidebar .nav-link').forEach(button => {
        button.addEventListener('click', () => {
          // Remove active class from all buttons
          document.querySelectorAll('.sidebar .nav-link').forEach(btn => {
            btn.classList.remove('active');
          });
          
          // Add active class to clicked button
          button.classList.add('active');
          
          // Update main content based on selected option (just for demo)
          const mainContent = document.querySelector('.main-content');
          mainContent.innerHTML = `
            <h1>${button.textContent}</h1>
            <p>This section is under development</p>
            <div class="alert alert-info">
              This is a demo interface. The full application requires proper React setup.
            </div>
          `;
        });
      });
    }, 2000);
  });
});
