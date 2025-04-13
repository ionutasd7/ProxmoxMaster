// This file is used to initialize the application
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  console.log('Proxmox Infrastructure Manager initializing...');
  
  // Simple login form for development/demo
  const root = document.getElementById('root');
  
  root.innerHTML = `
    <div class="login-container">
      <div class="grid-bg"></div>
      <div class="card login-card">
        <div class="card-header text-white">
          <h3 class="text-center mb-0 glow-text">PROXMOX INFRASTRUCTURE MANAGER</h3>
        </div>
        <div class="card-body">
          <form id="login-form">
            <div class="mb-4">
              <label for="host" class="form-label">Proxmox Host</label>
              <input type="text" class="form-control" id="host" value="pve.ionutlab.com" required>
              <div class="form-text">Hostname or IP of your Proxmox server</div>
            </div>
            <div class="mb-4">
              <label for="username" class="form-label">Username</label>
              <input type="text" class="form-control" id="username" value="api@pam!home" required>
              <div class="form-text">API user with sufficient privileges</div>
            </div>
            <div class="mb-4">
              <label for="password" class="form-label">Password</label>
              <input type="password" class="form-control" id="password" value="8cd15ef7-d25b-4955-9c32-48d42e23b109" required>
            </div>
            <div class="d-grid">
              <button type="submit" class="btn btn-primary">
                <i class="fas fa-sign-in-alt me-2"></i> AUTHENTICATE
              </button>
            </div>
          </form>
        </div>
        <div class="card-footer text-center">
          <small>VERSION 1.0.0 | SECURED CONNECTION</small>
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
      <div class="d-flex justify-content-center align-items-center" style="height: 100vh; background-color: var(--dark-bg);">
        <div class="grid-bg"></div>
        <div class="text-center">
          <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <h4 class="mt-3 glow-text">ESTABLISHING CONNECTION TO PROXMOX SERVER</h4>
          <p class="text-dim">Authenticating user credentials...</p>
        </div>
      </div>
    `;
    
    // Simulate successful login after a short delay (for demo)
    setTimeout(() => {
      root.innerHTML = `
        <div class="dashboard-container">
          <div class="grid-bg"></div>
          <div class="sidebar">
            <div class="sidebar-header">
              <h4><i class="fas fa-server me-2"></i> PROXMOX MANAGER</h4>
            </div>
            <div class="sidebar-menu">
              <div class="sidebar-section">
                <h6><i class="fas fa-tachometer-alt me-2"></i> Overview</h6>
                <button class="nav-link active"><i class="fas fa-chart-line me-2"></i> Dashboard</button>
                <button class="nav-link"><i class="fas fa-server me-2"></i> Nodes</button>
              </div>
              <div class="sidebar-section">
                <h6><i class="fas fa-desktop me-2"></i> Virtual Machines</h6>
                <button class="nav-link"><i class="fas fa-list me-2"></i> VM List</button>
                <button class="nav-link"><i class="fas fa-plus me-2"></i> Create VM</button>
              </div>
              <div class="sidebar-section">
                <h6><i class="fas fa-box me-2"></i> Containers</h6>
                <button class="nav-link"><i class="fas fa-list me-2"></i> LXC List</button>
                <button class="nav-link"><i class="fas fa-plus me-2"></i> Create LXC</button>
              </div>
              <div class="sidebar-section">
                <h6><i class="fas fa-cogs me-2"></i> Management</h6>
                <button class="nav-link"><i class="fas fa-network-wired me-2"></i> Network</button>
                <button class="nav-link"><i class="fas fa-hdd me-2"></i> Storage</button>
                <button class="nav-link"><i class="fas fa-sync me-2"></i> Updates</button>
                <button class="nav-link"><i class="fas fa-cubes me-2"></i> Applications</button>
              </div>
              <div class="sidebar-section">
                <h6><i class="fas fa-wrench me-2"></i> System</h6>
                <button class="nav-link"><i class="fas fa-sliders-h me-2"></i> Settings</button>
                <button class="nav-link"><i class="fas fa-sign-out-alt me-2"></i> Logout</button>
              </div>
            </div>
          </div>
          <div class="main-content">
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h1 class="glow-text"><i class="fas fa-chart-line me-3"></i> DASHBOARD</h1>
              <div class="d-flex align-items-center">
                <div class="me-3 text-dim">
                  <i class="fas fa-user-circle me-1"></i> ${username}
                </div>
                <div class="glow-border px-3 py-2 rounded">
                  <i class="fas fa-server me-1"></i> ${host}
                  <span class="badge bg-success ms-2">CONNECTED</span>
                </div>
              </div>
            </div>
            
            <div class="alert alert-info glow-border">
              <i class="fas fa-info-circle me-2"></i> This is a demo interface. The full application requires proper React integration.
            </div>
            
            <!-- System Stats -->
            <div class="row mt-4">
              <div class="col-md-3 mb-4">
                <div class="card glow-border">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-microchip me-2"></i> CPU</h5>
                    <small class="text-dim">Current Load</small>
                  </div>
                  <div class="card-body">
                    <div class="text-center">
                      <div class="display-4">21%</div>
                      <div class="progress mt-2" style="height: 8px;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: 21%"></div>
                      </div>
                      <small class="text-dim mt-2 d-block">8 Cores / 16 Threads</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-3 mb-4">
                <div class="card glow-border">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-memory me-2"></i> MEMORY</h5>
                    <small class="text-dim">Usage</small>
                  </div>
                  <div class="card-body">
                    <div class="text-center">
                      <div class="display-4">42%</div>
                      <div class="progress mt-2" style="height: 8px;">
                        <div class="progress-bar bg-info" role="progressbar" style="width: 42%"></div>
                      </div>
                      <small class="text-dim mt-2 d-block">13.5 GB / 32 GB</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-3 mb-4">
                <div class="card glow-border">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-hdd me-2"></i> STORAGE</h5>
                    <small class="text-dim">Utilization</small>
                  </div>
                  <div class="card-body">
                    <div class="text-center">
                      <div class="display-4">65%</div>
                      <div class="progress mt-2" style="height: 8px;">
                        <div class="progress-bar bg-warning" role="progressbar" style="width: 65%"></div>
                      </div>
                      <small class="text-dim mt-2 d-block">1.9 TB / 3 TB</small>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-3 mb-4">
                <div class="card glow-border">
                  <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0"><i class="fas fa-network-wired me-2"></i> NETWORK</h5>
                    <small class="text-dim">Current Traffic</small>
                  </div>
                  <div class="card-body">
                    <div class="text-center">
                      <div class="display-4">12<small class="fs-6">MB/s</small></div>
                      <div class="d-flex justify-content-between mt-2">
                        <small class="text-success"><i class="fas fa-arrow-down me-1"></i> 8.5 MB/s</small>
                        <small class="text-info"><i class="fas fa-arrow-up me-1"></i> 3.5 MB/s</small>
                      </div>
                      <small class="text-dim mt-2 d-block">2 Active Interfaces</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Cluster Overview -->
            <h4 class="mt-2 mb-3"><i class="fas fa-server me-2"></i> CLUSTER OVERVIEW</h4>
            <div class="row mt-2">
              <div class="col-md-4 mb-4">
                <div class="card glow-border">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-server me-2"></i> NODES</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="display-4 me-3">4</div>
                      <div>
                        <div class="text-success">
                          <i class="fas fa-check-circle me-1"></i> 4 Online
                        </div>
                        <div class="text-dim">
                          <i class="fas fa-times-circle me-1"></i> 0 Offline
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4 mb-4">
                <div class="card glow-border">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-desktop me-2"></i> VIRTUAL MACHINES</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="display-4 me-3">8</div>
                      <div>
                        <div class="text-success">
                          <i class="fas fa-play-circle me-1"></i> 5 Running
                        </div>
                        <div class="text-danger">
                          <i class="fas fa-stop-circle me-1"></i> 3 Stopped
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="col-md-4 mb-4">
                <div class="card glow-border">
                  <div class="card-header">
                    <h5 class="mb-0"><i class="fas fa-box me-2"></i> LXC CONTAINERS</h5>
                  </div>
                  <div class="card-body">
                    <div class="d-flex align-items-center">
                      <div class="display-4 me-3">12</div>
                      <div>
                        <div class="text-success">
                          <i class="fas fa-play-circle me-1"></i> 10 Running
                        </div>
                        <div class="text-danger">
                          <i class="fas fa-stop-circle me-1"></i> 2 Stopped
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Recent Activities -->
            <h4 class="mt-2 mb-3"><i class="fas fa-history me-2"></i> RECENT ACTIVITIES</h4>
            <div class="card glow-border">
              <div class="card-body p-0">
                <div class="list-group list-group-flush">
                  <div class="list-group-item bg-transparent text-light border-bottom border-secondary">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-play-circle text-success me-2"></i>
                        <span>VM 101 (web-server) started</span>
                      </div>
                      <small class="text-dim">10 minutes ago</small>
                    </div>
                  </div>
                  <div class="list-group-item bg-transparent text-light border-bottom border-secondary">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-sync text-info me-2"></i>
                        <span>System updates applied to node pve2</span>
                      </div>
                      <small class="text-dim">25 minutes ago</small>
                    </div>
                  </div>
                  <div class="list-group-item bg-transparent text-light border-bottom border-secondary">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-stop-circle text-danger me-2"></i>
                        <span>Container 105 (db-server) stopped</span>
                      </div>
                      <small class="text-dim">1 hour ago</small>
                    </div>
                  </div>
                  <div class="list-group-item bg-transparent text-light">
                    <div class="d-flex justify-content-between align-items-center">
                      <div>
                        <i class="fas fa-plus-circle text-primary me-2"></i>
                        <span>New container 108 (cache-server) created</span>
                      </div>
                      <small class="text-dim">2 hours ago</small>
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
          const buttonText = button.textContent.trim().replace(/^\S+\s+/, ''); // Remove icon
          
          mainContent.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
              <h1 class="glow-text"><i class="fas fa-cube me-3"></i> ${buttonText.toUpperCase()}</h1>
              <div class="d-flex align-items-center">
                <div class="me-3 text-dim">
                  <i class="fas fa-user-circle me-1"></i> ${username}
                </div>
                <div class="glow-border px-3 py-2 rounded">
                  <i class="fas fa-server me-1"></i> ${host}
                  <span class="badge bg-success ms-2">CONNECTED</span>
                </div>
              </div>
            </div>
            
            <div class="card glow-border">
              <div class="card-body">
                <div class="text-center py-5">
                  <i class="fas fa-code text-info mb-3" style="font-size: 3rem;"></i>
                  <h3 class="glow-text">This section is under development</h3>
                  <p class="text-dim">The ${buttonText} module will be implemented in the next version.</p>
                </div>
              </div>
            </div>
          `;
        });
      });
    }, 2000);
  });
});
