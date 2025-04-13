// Simple Resource Monitoring Component

// This is a simplified version of the ResourceMonitoring component
// that just renders a basic UI without any advanced functionality
function SimpleMonitoring(props) {
  const { nodes } = props;
  
  // Get reference to main content area
  const mainContent = document.querySelector('.main-content');
  
  // Render UI
  mainContent.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="glow-text"><i class="fas fa-chart-line me-3"></i> RESOURCE MONITORING</h1>
      <div class="d-flex align-items-center">
        <div class="me-3 text-dim">
          <i class="fas fa-user-circle me-1"></i> admin
        </div>
        <div class="glow-border px-3 py-2 rounded">
          <i class="fas fa-server me-1"></i> Proxmox Manager
          <span class="badge bg-success ms-2">CONNECTED</span>
        </div>
      </div>
    </div>
    
    <div class="card glow-border mb-4">
      <div class="card-header">
        <h5 class="mb-0"><i class="fas fa-server me-2"></i> MONITORING DASHBOARD</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-microchip me-2"></i> CPU Usage</h6>
              </div>
              <div class="card-body">
                <div class="progress" style="height: 25px;">
                  <div class="progress-bar bg-primary" role="progressbar" style="width: 45%;" aria-valuenow="45" aria-valuemin="0" aria-valuemax="100">45%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-memory me-2"></i> Memory Usage</h6>
              </div>
              <div class="card-body">
                <div class="progress" style="height: 25px;">
                  <div class="progress-bar bg-success" role="progressbar" style="width: 65%;" aria-valuenow="65" aria-valuemin="0" aria-valuemax="100">65%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-hdd me-2"></i> Disk Usage</h6>
              </div>
              <div class="card-body">
                <div class="progress" style="height: 25px;">
                  <div class="progress-bar bg-warning" role="progressbar" style="width: 75%;" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">75%</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-md-6 mb-4">
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-network-wired me-2"></i> Network I/O</h6>
              </div>
              <div class="card-body">
                <div class="progress mb-2" style="height: 20px;">
                  <div class="progress-bar bg-info" role="progressbar" style="width: 35%;" aria-valuenow="35" aria-valuemin="0" aria-valuemax="100">IN: 3.5 MB/s</div>
                </div>
                <div class="progress" style="height: 20px;">
                  <div class="progress-bar bg-danger" role="progressbar" style="width: 25%;" aria-valuenow="25" aria-valuemin="0" aria-valuemax="100">OUT: 2.5 MB/s</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="alert alert-info">
          <i class="fas fa-info-circle me-2"></i> This is a simplified version of the monitoring dashboard. Advanced features including real-time charts and alerts will be implemented soon.
        </div>
        
        <button class="btn btn-primary" id="refresh-monitoring-btn">
          <i class="fas fa-sync me-2"></i> Refresh Data
        </button>
      </div>
    </div>
  `;
  
  // Add event listener for refresh button
  document.getElementById('refresh-monitoring-btn').addEventListener('click', function() {
    alert('Data refreshed!');
  });
}

// Make the function globally available
window.SimpleMonitoring = SimpleMonitoring;