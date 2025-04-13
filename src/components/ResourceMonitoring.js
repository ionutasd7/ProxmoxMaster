/**
 * Resource Monitoring Component
 * Provides real-time monitoring of resources with charts and configurable alerts
 */

function ResourceMonitoring({ nodes, authData, refreshData, setError }) {
  // Get reference to main content area
  const mainContent = document.querySelector('.main-content');
  
  // Initialize component
  init();
  
  /**
   * Initialize the resource monitoring component
   */
  function init() {
    try {
      renderMonitoringDashboard();
      setupEventListeners();
      initializeCharts();
      loadAlertSettings();
      startDataCollection();
    } catch (error) {
      console.error('Error initializing resource monitoring:', error);
      setError('Failed to initialize resource monitoring. Please try again.');
    }
  }
  
  /**
   * Render the monitoring dashboard
   */
  function renderMonitoringDashboard() {
    mainContent.innerHTML = `
      ${getMonitoringHeader()}
      <div class="monitoring-container">
        ${getNodeSelector()}
        ${getTimeRangeSelector()}
        ${getChartsSection()}
        ${getAlertsSection()}
        ${getHistorySection()}
      </div>
    `;
  }
  
  /**
   * Get monitoring header HTML
   */
  function getMonitoringHeader() {
    return `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-chart-line me-3"></i> RESOURCE MONITORING</h1>
        <div class="d-flex align-items-center">
          <div class="me-3 text-dim">
            <i class="fas fa-user-circle me-1"></i> ${authData.username}
          </div>
          <div class="glow-border px-3 py-2 rounded">
            <i class="fas fa-server me-1"></i> Proxmox Manager
            <span class="badge bg-success ms-2">CONNECTED</span>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get node selector HTML
   */
  function getNodeSelector() {
    if (!nodes || nodes.length === 0) {
      return `
        <div class="alert alert-info mb-4">
          <i class="fas fa-info-circle me-2"></i> No Proxmox nodes found. Add a node from the Dashboard to start monitoring.
        </div>
      `;
    }
    
    const nodeOptions = nodes
      .map(node => `<option value="${node.id}" data-hostname="${node.hostname}">${node.name} (${node.hostname})</option>`)
      .join('');
    
    return `
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-server me-2"></i> SELECT NODE</h5>
        </div>
        <div class="card-body">
          <div class="row align-items-center">
            <div class="col-md-6">
              <select id="node-selector" class="form-select">
                ${nodeOptions}
              </select>
            </div>
            <div class="col-md-6 text-end">
              <span class="badge bg-success me-2" id="connection-status">
                <i class="fas fa-plug me-1"></i> Connected
              </span>
              <button id="refresh-data-btn" class="btn btn-sm btn-primary">
                <i class="fas fa-sync-alt me-1"></i> Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get time range selector HTML
   */
  function getTimeRangeSelector() {
    return `
      <div class="card glow-border mb-4">
        <div class="card-header">
          <h5 class="mb-0"><i class="fas fa-clock me-2"></i> TIME RANGE</h5>
        </div>
        <div class="card-body">
          <div class="btn-group w-100" role="group" aria-label="Time range selector">
            <input type="radio" class="btn-check" name="time-range" id="time-1h" value="1h" checked>
            <label class="btn btn-outline-primary" for="time-1h">Last Hour</label>
            
            <input type="radio" class="btn-check" name="time-range" id="time-6h" value="6h">
            <label class="btn btn-outline-primary" for="time-6h">6 Hours</label>
            
            <input type="radio" class="btn-check" name="time-range" id="time-12h" value="12h">
            <label class="btn btn-outline-primary" for="time-12h">12 Hours</label>
            
            <input type="radio" class="btn-check" name="time-range" id="time-24h" value="24h">
            <label class="btn btn-outline-primary" for="time-24h">24 Hours</label>
            
            <input type="radio" class="btn-check" name="time-range" id="time-7d" value="7d">
            <label class="btn btn-outline-primary" for="time-7d">7 Days</label>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get charts section HTML
   */
  function getChartsSection() {
    return `
      <div class="row mb-4">
        <div class="col-md-6 mb-4">
          <div class="card glow-border h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-microchip me-2"></i> CPU USAGE</h5>
              <span class="cpu-usage-value">0%</span>
            </div>
            <div class="card-body">
              <div class="chart-container" style="position: relative; height:200px;">
                <canvas id="cpuChart"></canvas>
                <div class="chart-loading" id="cpu-chart-loading">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card glow-border h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-memory me-2"></i> MEMORY USAGE</h5>
              <span class="memory-usage-value">0%</span>
            </div>
            <div class="card-body">
              <div class="chart-container" style="position: relative; height:200px;">
                <canvas id="memoryChart"></canvas>
                <div class="chart-loading" id="memory-chart-loading">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card glow-border h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-hdd me-2"></i> DISK USAGE</h5>
              <span class="disk-usage-value">0%</span>
            </div>
            <div class="card-body">
              <div class="chart-container" style="position: relative; height:200px;">
                <canvas id="diskChart"></canvas>
                <div class="chart-loading" id="disk-chart-loading">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="col-md-6 mb-4">
          <div class="card glow-border h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0"><i class="fas fa-network-wired me-2"></i> NETWORK I/O</h5>
              <span class="network-usage-value">0 MB/s</span>
            </div>
            <div class="card-body">
              <div class="chart-container" style="position: relative; height:200px;">
                <canvas id="networkChart"></canvas>
                <div class="chart-loading" id="network-chart-loading">
                  <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get alerts section HTML
   */
  function getAlertsSection() {
    return `
      <div class="card glow-border mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-bell me-2"></i> RESOURCE ALERTS</h5>
          <button id="alert-config-btn" class="btn btn-sm btn-outline-primary">
            <i class="fas fa-cog me-1"></i> Configure Alerts
          </button>
        </div>
        <div class="card-body">
          <div class="row mb-3">
            <div class="col-md-3">
              <div class="alert alert-info mb-0 d-flex align-items-center p-2">
                <div class="me-2"><i class="fas fa-microchip fa-fw"></i></div>
                <div>
                  <div class="small mb-1">CPU Alert</div>
                  <div id="cpu-alert-threshold">Warn: 80% | Critical: 90%</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="alert alert-info mb-0 d-flex align-items-center p-2">
                <div class="me-2"><i class="fas fa-memory fa-fw"></i></div>
                <div>
                  <div class="small mb-1">Memory Alert</div>
                  <div id="memory-alert-threshold">Warn: 80% | Critical: 90%</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="alert alert-info mb-0 d-flex align-items-center p-2">
                <div class="me-2"><i class="fas fa-hdd fa-fw"></i></div>
                <div>
                  <div class="small mb-1">Disk Alert</div>
                  <div id="disk-alert-threshold">Warn: 80% | Critical: 90%</div>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="alert alert-info mb-0 d-flex align-items-center p-2">
                <div class="me-2"><i class="fas fa-bell fa-fw"></i></div>
                <div>
                  <div class="small mb-1">Notifications</div>
                  <div id="alert-notifications">Email: Off | Webhook: Off</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Alert Configuration Modal -->
      <div class="modal fade" id="alertConfigModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg">
          <div class="modal-content bg-dark text-light">
            <div class="modal-header border-bottom border-secondary">
              <h5 class="modal-title"><i class="fas fa-bell me-2"></i> Alert Configuration</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <div class="mb-4">
                <h6 class="mb-3">Resource Thresholds</h6>
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">CPU Warning</label>
                    <div class="input-group mb-3">
                      <input type="number" class="form-control" id="cpu-warning" value="80" min="1" max="99">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">CPU Critical</label>
                    <div class="input-group mb-3">
                      <input type="number" class="form-control" id="cpu-critical" value="90" min="1" max="100">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                </div>
                
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Memory Warning</label>
                    <div class="input-group mb-3">
                      <input type="number" class="form-control" id="memory-warning" value="80" min="1" max="99">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Memory Critical</label>
                    <div class="input-group mb-3">
                      <input type="number" class="form-control" id="memory-critical" value="90" min="1" max="100">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                </div>
                
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Disk Warning</label>
                    <div class="input-group mb-3">
                      <input type="number" class="form-control" id="disk-warning" value="80" min="1" max="99">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                  <div class="col-md-4">
                    <label class="form-label">Disk Critical</label>
                    <div class="input-group mb-3">
                      <input type="number" class="form-control" id="disk-critical" value="90" min="1" max="100">
                      <span class="input-group-text">%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-4">
                <h6 class="mb-3">Notification Settings</h6>
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="enable-email-alerts">
                  <label class="form-check-label" for="enable-email-alerts">
                    Enable Email Notifications
                  </label>
                </div>
                <div class="mb-3" id="email-settings" style="display: none;">
                  <input type="email" class="form-control mb-2" id="alert-email" placeholder="Email address to notify">
                  <div class="form-text text-light opacity-75">Add multiple emails separated by comma</div>
                </div>
                
                <div class="form-check form-switch mb-3">
                  <input class="form-check-input" type="checkbox" id="enable-webhook-alerts">
                  <label class="form-check-label" for="enable.webhook-alerts">
                    Enable Webhook Notifications
                  </label>
                </div>
                <div class="mb-3" id="webhook-settings" style="display: none;">
                  <input type="url" class="form-control" id="alert-webhook-url" placeholder="Webhook URL">
                  <div class="form-text text-light opacity-75">Discord, Slack or custom webhook URL</div>
                </div>
              </div>
            </div>
            <div class="modal-footer border-top border-secondary">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-primary" id="save-alert-settings">
                <i class="fas fa-save me-1"></i> Save Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Get history section HTML
   */
  function getHistorySection() {
    return `
      <div class="card glow-border">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="mb-0"><i class="fas fa-history me-2"></i> ALERT HISTORY</h5>
          <button id="clear-history-btn" class="btn btn-sm btn-outline-danger">
            <i class="fas fa-trash me-1"></i> Clear History
          </button>
        </div>
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-dark table-hover mb-0">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Node</th>
                  <th>Resource</th>
                  <th>Level</th>
                  <th>Value</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody id="alert-history-table">
                <tr>
                  <td colspan="6" class="text-center">No alerts recorded yet</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * Setup event listeners for the monitoring dashboard
   */
  function setupEventListeners() {
    // Node selector
    const nodeSelector = document.getElementById('node-selector');
    if (nodeSelector) {
      nodeSelector.addEventListener('change', function() {
        updateChartsForNode(this.value);
      });
    }
    
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', fetchMonitoringData);
    }
    
    // Time range selector
    document.querySelectorAll('input[name="time-range"]').forEach(radio => {
      radio.addEventListener('change', function() {
        fetchHistoricalData(this.value);
      });
    });
    
    // Alert configuration button
    const alertConfigBtn = document.getElementById('alert-config-btn');
    if (alertConfigBtn) {
      alertConfigBtn.addEventListener('click', showAlertConfigModal);
    }
    
    // Save alert settings button
    const saveAlertBtn = document.getElementById('save-alert-settings');
    if (saveAlertBtn) {
      saveAlertBtn.addEventListener('click', saveAlertSettings);
    }
    
    // Toggle email settings visibility
    const emailToggle = document.getElementById('enable-email-alerts');
    if (emailToggle) {
      emailToggle.addEventListener('change', function() {
        document.getElementById('email-settings').style.display = this.checked ? 'block' : 'none';
      });
    }
    
    // Toggle webhook settings visibility
    const webhookToggle = document.getElementById('enable-webhook-alerts');
    if (webhookToggle) {
      webhookToggle.addEventListener('change', function() {
        document.getElementById('webhook-settings').style.display = this.checked ? 'block' : 'none';
      });
    }
    
    // Clear alert history button
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', clearAlertHistory);
    }
  }
  
  /**
   * Initialize charts with Chart.js
   */
  function initializeCharts() {
    // Common chart options
    const commonOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(10, 14, 23, 0.8)',
          borderColor: 'rgba(30, 144, 255, 0.3)',
          borderWidth: 1,
          titleColor: '#e0e6f0',
          bodyColor: '#e0e6f0',
          titleFont: {
            weight: 'bold'
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#8a9bb4'
          }
        },
        y: {
          grid: {
            color: 'rgba(255, 255, 255, 0.05)'
          },
          ticks: {
            color: '#8a9bb4'
          }
        }
      },
      elements: {
        line: {
          tension: 0.3,
          borderWidth: 2
        },
        point: {
          radius: 0,
          hitRadius: 10,
          hoverRadius: 5
        }
      }
    };
    
    // Time labels for initial charts
    const timeLabels = generateTimeLabels();
    
    // Initial empty data
    const emptyData = Array(timeLabels.length).fill(0);
    
    // CPU Chart
    window.cpuChart = new Chart(
      document.getElementById('cpuChart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'CPU Usage',
            data: emptyData,
            borderColor: '#1e90ff',
            backgroundColor: 'rgba(30, 144, 255, 0.1)',
            fill: true
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              min: 0,
              max: 100,
              title: {
                display: true,
                text: 'Percent',
                color: '#8a9bb4'
              }
            }
          }
        }
      }
    );
    
    // Memory Chart
    window.memoryChart = new Chart(
      document.getElementById('memoryChart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'Memory Usage',
            data: emptyData,
            borderColor: '#00faff',
            backgroundColor: 'rgba(0, 250, 255, 0.1)',
            fill: true
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              min: 0,
              max: 100,
              title: {
                display: true,
                text: 'Percent',
                color: '#8a9bb4'
              }
            }
          }
        }
      }
    );
    
    // Disk Chart
    window.diskChart = new Chart(
      document.getElementById('diskChart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'Disk Usage',
            data: emptyData,
            borderColor: '#bd00ff',
            backgroundColor: 'rgba(189, 0, 255, 0.1)',
            fill: true
          }]
        },
        options: {
          ...commonOptions,
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              min: 0,
              max: 100,
              title: {
                display: true,
                text: 'Percent',
                color: '#8a9bb4'
              }
            }
          }
        }
      }
    );
    
    // Network Chart
    window.networkChart = new Chart(
      document.getElementById('networkChart').getContext('2d'),
      {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [
            {
              label: 'IN',
              data: emptyData,
              borderColor: '#00e676',
              backgroundColor: 'rgba(0, 230, 118, 0.1)',
              borderDash: [],
              fill: true
            },
            {
              label: 'OUT',
              data: emptyData,
              borderColor: '#ff5252',
              backgroundColor: 'rgba(255, 82, 82, 0.1)',
              borderDash: [],
              fill: true
            }
          ]
        },
        options: {
          ...commonOptions,
          plugins: {
            ...commonOptions.plugins,
            legend: {
              display: true,
              position: 'top',
              labels: {
                color: '#8a9bb4',
                boxWidth: 20
              }
            }
          },
          scales: {
            ...commonOptions.scales,
            y: {
              ...commonOptions.scales.y,
              min: 0,
              title: {
                display: true,
                text: 'MB/s',
                color: '#8a9bb4'
              }
            }
          }
        }
      }
    );
  }
  
  /**
   * Generate time labels for charts (last hour by default)
   */
  function generateTimeLabels(count = 12) {
    const labels = [];
    const now = new Date();
    
    for (let i = count; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * (60 * 60 * 1000 / count)));
      const hours = time.getHours().toString().padStart(2, '0');
      const minutes = time.getMinutes().toString().padStart(2, '0');
      labels.push(`${hours}:${minutes}`);
    }
    
    return labels;
  }
  
  /**
   * Start periodic data collection
   */
  function startDataCollection() {
    // Initial data fetch
    fetchMonitoringData();
    
    // Set up periodic refresh (every 10 seconds)
    window.monitoringInterval = setInterval(() => {
      fetchMonitoringData();
    }, 10000);
    
    // Clean up interval when component is destroyed
    window.addEventListener('beforeunload', () => {
      if (window.monitoringInterval) {
        clearInterval(window.monitoringInterval);
      }
    });
  }
  
  /**
   * Fetch monitoring data from API
   */
  async function fetchMonitoringData() {
    showLoadingForCharts();
    
    try {
      const nodeSelector = document.getElementById('node-selector');
      if (!nodeSelector || nodeSelector.options.length === 0) {
        hideLoadingForCharts();
        return;
      }
      
      const nodeId = nodeSelector.value;
      const nodeName = nodeSelector.options[nodeSelector.selectedIndex].text;
      
      const response = await fetch(`/api/monitoring/resources/${nodeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        updateCharts(data.resources);
        checkAlertThresholds(data.resources);
        
        // Update connection status
        document.getElementById('connection-status').innerHTML = 
          `<i class="fas fa-plug me-1"></i> Connected`;
        document.getElementById('connection-status').className = 'badge bg-success me-2';
      } else {
        throw new Error(data.error || 'Failed to fetch monitoring data');
      }
    } catch (error) {
      console.error('Error fetching monitoring data:', error);
      
      // Update connection status
      document.getElementById('connection-status').innerHTML = 
        `<i class="fas fa-exclamation-triangle me-1"></i> Connection Error`;
      document.getElementById('connection-status').className = 'badge bg-danger me-2';
      
      // Show error notification
      showNotification(`Error fetching monitoring data: ${error.message}`, 'error');
    } finally {
      hideLoadingForCharts();
    }
  }
  
  /**
   * Show loading indicators for charts
   */
  function showLoadingForCharts() {
    document.querySelectorAll('.chart-loading').forEach(el => {
      el.style.display = 'flex';
    });
  }
  
  /**
   * Hide loading indicators for charts
   */
  function hideLoadingForCharts() {
    document.querySelectorAll('.chart-loading').forEach(el => {
      el.style.display = 'none';
    });
  }
  
  /**
   * Update charts with new data
   */
  function updateCharts(data) {
    if (!data) return;
    
    // Update CPU chart
    if (window.cpuChart && data.cpu) {
      // Update current value display
      document.querySelector('.cpu-usage-value').textContent = `${data.cpu.current.toFixed(1)}%`;
      
      // Update chart data
      window.cpuChart.data.datasets[0].data = data.cpu.history;
      window.cpuChart.update();
    }
    
    // Update Memory chart
    if (window.memoryChart && data.memory) {
      // Update current value display
      document.querySelector('.memory-usage-value').textContent = `${data.memory.current.toFixed(1)}%`;
      
      // Update chart data
      window.memoryChart.data.datasets[0].data = data.memory.history;
      window.memoryChart.update();
    }
    
    // Update Disk chart
    if (window.diskChart && data.disk) {
      // Update current value display
      document.querySelector('.disk-usage-value').textContent = `${data.disk.current.toFixed(1)}%`;
      
      // Update chart data
      window.diskChart.data.datasets[0].data = data.disk.history;
      window.diskChart.update();
    }
    
    // Update Network chart
    if (window.networkChart && data.network) {
      // Update current value display
      const totalBandwidth = data.network.in.current + data.network.out.current;
      document.querySelector('.network-usage-value').textContent = 
        `IN: ${data.network.in.current.toFixed(2)} MB/s | OUT: ${data.network.out.current.toFixed(2)} MB/s`;
      
      // Update chart data
      window.networkChart.data.datasets[0].data = data.network.in.history;
      window.networkChart.data.datasets[1].data = data.network.out.history;
      window.networkChart.update();
    }
  }
  
  /**
   * Update charts for a specific node
   */
  function updateChartsForNode(nodeId) {
    // Reset charts with empty data
    const timeLabels = generateTimeLabels();
    const emptyData = Array(timeLabels.length).fill(0);
    
    if (window.cpuChart) {
      window.cpuChart.data.datasets[0].data = emptyData;
      window.cpuChart.update();
    }
    
    if (window.memoryChart) {
      window.memoryChart.data.datasets[0].data = emptyData;
      window.memoryChart.update();
    }
    
    if (window.diskChart) {
      window.diskChart.data.datasets[0].data = emptyData;
      window.diskChart.update();
    }
    
    if (window.networkChart) {
      window.networkChart.data.datasets[0].data = emptyData;
      window.networkChart.data.datasets[1].data = emptyData;
      window.networkChart.update();
    }
    
    // Fetch new data for the selected node
    fetchMonitoringData();
  }
  
  /**
   * Fetch historical data for a given time range
   */
  async function fetchHistoricalData(timeRange) {
    showLoadingForCharts();
    
    try {
      const nodeSelector = document.getElementById('node-selector');
      if (!nodeSelector || nodeSelector.options.length === 0) {
        hideLoadingForCharts();
        return;
      }
      
      const nodeId = nodeSelector.value;
      
      const response = await fetch(`/api/monitoring/history/${nodeId}?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        updateChartsWithHistoricalData(data.history);
      } else {
        throw new Error(data.error || 'Failed to fetch historical data');
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      showNotification(`Error fetching historical data: ${error.message}`, 'error');
    } finally {
      hideLoadingForCharts();
    }
  }
  
  /**
   * Update charts with historical data
   */
  function updateChartsWithHistoricalData(historyData) {
    if (!historyData) return;
    
    // Update time labels
    const timeLabels = historyData.timeLabels || generateTimeLabels(historyData.cpu.history.length);
    
    // Update CPU chart
    if (window.cpuChart && historyData.cpu) {
      window.cpuChart.data.labels = timeLabels;
      window.cpuChart.data.datasets[0].data = historyData.cpu.history;
      window.cpuChart.update();
    }
    
    // Update Memory chart
    if (window.memoryChart && historyData.memory) {
      window.memoryChart.data.labels = timeLabels;
      window.memoryChart.data.datasets[0].data = historyData.memory.history;
      window.memoryChart.update();
    }
    
    // Update Disk chart
    if (window.diskChart && historyData.disk) {
      window.diskChart.data.labels = timeLabels;
      window.diskChart.data.datasets[0].data = historyData.disk.history;
      window.diskChart.update();
    }
    
    // Update Network chart
    if (window.networkChart && historyData.network) {
      window.networkChart.data.labels = timeLabels;
      window.networkChart.data.datasets[0].data = historyData.network.in.history;
      window.networkChart.data.datasets[1].data = historyData.network.out.history;
      window.networkChart.update();
    }
  }
  
  /**
   * Show alert configuration modal
   */
  function showAlertConfigModal() {
    const modal = new bootstrap.Modal(document.getElementById('alertConfigModal'));
    modal.show();
  }
  
  /**
   * Save alert settings from modal
   */
  function saveAlertSettings() {
    // Get values from inputs
    const settings = {
      cpu: {
        warning: parseInt(document.getElementById('cpu-warning').value, 10),
        critical: parseInt(document.getElementById('cpu-critical').value, 10)
      },
      memory: {
        warning: parseInt(document.getElementById('memory-warning').value, 10),
        critical: parseInt(document.getElementById('memory-critical').value, 10)
      },
      disk: {
        warning: parseInt(document.getElementById('disk-warning').value, 10),
        critical: parseInt(document.getElementById('disk-critical').value, 10)
      },
      notifications: {
        email: {
          enabled: document.getElementById('enable-email-alerts').checked,
          recipients: document.getElementById('alert-email').value
        },
        webhook: {
          enabled: document.getElementById('enable-webhook-alerts').checked,
          url: document.getElementById('alert-webhook-url').value
        }
      }
    };
    
    // Validate
    if (settings.cpu.warning >= settings.cpu.critical) {
      showNotification('CPU warning threshold must be lower than critical threshold', 'error');
      return;
    }
    if (settings.memory.warning >= settings.memory.critical) {
      showNotification('Memory warning threshold must be lower than critical threshold', 'error');
      return;
    }
    if (settings.disk.warning >= settings.disk.critical) {
      showNotification('Disk warning threshold must be lower than critical threshold', 'error');
      return;
    }
    
    // Save settings
    saveSettingsToStorage(settings);
    
    // Update UI
    updateAlertSettingsUI(settings);
    
    // Hide modal
    bootstrap.Modal.getInstance(document.getElementById('alertConfigModal')).hide();
    
    // Show notification
    showNotification('Alert settings saved successfully', 'success');
  }
  
  /**
   * Save alert settings to localStorage
   */
  function saveSettingsToStorage(settings) {
    localStorage.setItem('resourceAlertSettings', JSON.stringify(settings));
  }
  
  /**
   * Load alert settings from localStorage
   */
  function loadAlertSettings() {
    const settingsJson = localStorage.getItem('resourceAlertSettings');
    
    if (!settingsJson) {
      // Default settings
      const defaultSettings = {
        cpu: { warning: 80, critical: 90 },
        memory: { warning: 80, critical: 90 },
        disk: { warning: 80, critical: 90 },
        notifications: {
          email: { enabled: false, recipients: '' },
          webhook: { enabled: false, url: '' }
        }
      };
      
      saveSettingsToStorage(defaultSettings);
      updateAlertSettingsUI(defaultSettings);
      return defaultSettings;
    }
    
    try {
      const settings = JSON.parse(settingsJson);
      updateAlertSettingsUI(settings);
      return settings;
    } catch (error) {
      console.error('Error parsing alert settings:', error);
      return null;
    }
  }
  
  /**
   * Update alert settings in the UI
   */
  function updateAlertSettingsUI(settings) {
    if (!settings) return;
    
    // Update thresholds display
    document.getElementById('cpu-alert-threshold').textContent = 
      `Warn: ${settings.cpu.warning}% | Critical: ${settings.cpu.critical}%`;
    document.getElementById('memory-alert-threshold').textContent = 
      `Warn: ${settings.memory.warning}% | Critical: ${settings.memory.critical}%`;
    document.getElementById('disk-alert-threshold').textContent = 
      `Warn: ${settings.disk.warning}% | Critical: ${settings.disk.critical}%`;
    
    // Update notifications display
    const emailStatus = settings.notifications.email.enabled ? 'On' : 'Off';
    const webhookStatus = settings.notifications.webhook.enabled ? 'On' : 'Off';
    document.getElementById('alert-notifications').textContent = 
      `Email: ${emailStatus} | Webhook: ${webhookStatus}`;
    
    // Update form values
    document.getElementById('cpu-warning').value = settings.cpu.warning;
    document.getElementById('cpu-critical').value = settings.cpu.critical;
    document.getElementById('memory-warning').value = settings.memory.warning;
    document.getElementById('memory-critical').value = settings.memory.critical;
    document.getElementById('disk-warning').value = settings.disk.warning;
    document.getElementById('disk-critical').value = settings.disk.critical;
    
    document.getElementById('enable-email-alerts').checked = settings.notifications.email.enabled;
    document.getElementById('alert-email').value = settings.notifications.email.recipients;
    document.getElementById('email-settings').style.display = 
      settings.notifications.email.enabled ? 'block' : 'none';
    
    document.getElementById('enable-webhook-alerts').checked = settings.notifications.webhook.enabled;
    document.getElementById('alert-webhook-url').value = settings.notifications.webhook.url;
    document.getElementById('webhook-settings').style.display = 
      settings.notifications.webhook.enabled ? 'block' : 'none';
  }
  
  /**
   * Check if any resources exceed alert thresholds
   */
  function checkAlertThresholds(data) {
    if (!data) return;
    
    const settings = loadAlertSettings();
    if (!settings) return;
    
    const nodeSelector = document.getElementById('node-selector');
    if (!nodeSelector || nodeSelector.options.length === 0) return;
    
    const nodeName = nodeSelector.options[nodeSelector.selectedIndex].text;
    
    // Check CPU
    if (data.cpu && data.cpu.current) {
      const cpuStatus = getCpuAlertStatus(data.cpu.current, settings);
      if (cpuStatus !== 'normal') {
        const alert = {
          timestamp: new Date().toISOString(),
          node: nodeName,
          resource: 'CPU',
          level: cpuStatus,
          value: `${data.cpu.current.toFixed(1)}%`,
          message: `CPU usage is ${cpuStatus} at ${data.cpu.current.toFixed(1)}%`
        };
        
        addAlertToHistory(alert);
        
        if (settings.notifications.email.enabled || settings.notifications.webhook.enabled) {
          sendAlertNotification(alert);
        }
      }
    }
    
    // Check Memory
    if (data.memory && data.memory.current) {
      const memoryStatus = getMemoryAlertStatus(data.memory.current, settings);
      if (memoryStatus !== 'normal') {
        const alert = {
          timestamp: new Date().toISOString(),
          node: nodeName,
          resource: 'Memory',
          level: memoryStatus,
          value: `${data.memory.current.toFixed(1)}%`,
          message: `Memory usage is ${memoryStatus} at ${data.memory.current.toFixed(1)}%`
        };
        
        addAlertToHistory(alert);
        
        if (settings.notifications.email.enabled || settings.notifications.webhook.enabled) {
          sendAlertNotification(alert);
        }
      }
    }
    
    // Check Disk
    if (data.disk && data.disk.current) {
      const diskStatus = getDiskAlertStatus(data.disk.current, settings);
      if (diskStatus !== 'normal') {
        const alert = {
          timestamp: new Date().toISOString(),
          node: nodeName,
          resource: 'Disk',
          level: diskStatus,
          value: `${data.disk.current.toFixed(1)}%`,
          message: `Disk usage is ${diskStatus} at ${data.disk.current.toFixed(1)}%`
        };
        
        addAlertToHistory(alert);
        
        if (settings.notifications.email.enabled || settings.notifications.webhook.enabled) {
          sendAlertNotification(alert);
        }
      }
    }
  }
  
  /**
   * Get CPU alert status based on usage percentage
   */
  function getCpuAlertStatus(cpuUsage, settings) {
    if (cpuUsage >= settings.cpu.critical) {
      return 'critical';
    } else if (cpuUsage >= settings.cpu.warning) {
      return 'warning';
    }
    return 'normal';
  }
  
  /**
   * Get Memory alert status based on usage percentage
   */
  function getMemoryAlertStatus(memoryUsage, settings) {
    if (memoryUsage >= settings.memory.critical) {
      return 'critical';
    } else if (memoryUsage >= settings.memory.warning) {
      return 'warning';
    }
    return 'normal';
  }
  
  /**
   * Get Disk alert status based on usage percentage
   */
  function getDiskAlertStatus(diskUsage, settings) {
    if (diskUsage >= settings.disk.critical) {
      return 'critical';
    } else if (diskUsage >= settings.disk.warning) {
      return 'warning';
    }
    return 'normal';
  }
  
  /**
   * Add an alert to the history
   */
  function addAlertToHistory(alert) {
    // Get the history table
    const historyTable = document.getElementById('alert-history-table');
    if (!historyTable) return;
    
    // Clear "no alerts" row if it exists
    if (historyTable.rows.length === 1 && historyTable.rows[0].cells.length === 1) {
      historyTable.innerHTML = '';
    }
    
    // Format timestamp
    const date = new Date(alert.timestamp);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    // Create a new row
    const newRow = historyTable.insertRow(0);
    
    // Set level-based style
    if (alert.level === 'critical') {
      newRow.className = 'table-danger';
    } else if (alert.level === 'warning') {
      newRow.className = 'table-warning text-dark';
    }
    
    // Add cells
    newRow.insertCell(0).innerHTML = formattedDate;
    newRow.insertCell(1).innerHTML = alert.node;
    newRow.insertCell(2).innerHTML = alert.resource;
    newRow.insertCell(3).innerHTML = `<span class="badge ${alert.level === 'critical' ? 'bg-danger' : 'bg-warning text-dark'}">${alert.level.toUpperCase()}</span>`;
    newRow.insertCell(4).innerHTML = alert.value;
    newRow.insertCell(5).innerHTML = alert.message;
    
    // Save the alert to storage
    saveAlertToStorage(alert);
  }
  
  /**
   * Save alert to localStorage
   */
  function saveAlertToStorage(alert) {
    // Get existing alerts
    const alertsJson = localStorage.getItem('resourceAlerts');
    let alerts = [];
    
    if (alertsJson) {
      try {
        alerts = JSON.parse(alertsJson);
      } catch (error) {
        console.error('Error parsing alerts from storage:', error);
      }
    }
    
    // Add new alert
    alerts.unshift(alert);
    
    // Limit to 100 alerts
    if (alerts.length > 100) {
      alerts = alerts.slice(0, 100);
    }
    
    // Save back to storage
    localStorage.setItem('resourceAlerts', JSON.stringify(alerts));
  }
  
  /**
   * Load alerts from localStorage
   */
  function loadAlertsFromStorage() {
    const alertsJson = localStorage.getItem('resourceAlerts');
    
    if (!alertsJson) {
      return [];
    }
    
    try {
      return JSON.parse(alertsJson);
    } catch (error) {
      console.error('Error parsing alerts:', error);
      return [];
    }
  }
  
  /**
   * Clear alert history
   */
  function clearAlertHistory() {
    // Clear storage
    localStorage.removeItem('resourceAlerts');
    
    // Clear table
    const historyTable = document.getElementById('alert-history-table');
    if (historyTable) {
      historyTable.innerHTML = `
        <tr>
          <td colspan="6" class="text-center">No alerts recorded yet</td>
        </tr>
      `;
    }
    
    // Show notification
    showNotification('Alert history cleared', 'info');
  }
  
  /**
   * Send alert notification via email or webhook
   */
  async function sendAlertNotification(alert) {
    try {
      const settings = loadAlertSettings();
      if (!settings) return;
      
      const payload = {
        alert,
        notifications: settings.notifications
      };
      
      const response = await fetch('/api/monitoring/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }
  
  /**
   * Show error message
   */
  function showError(message) {
    setError(message);
  }
  
  /**
   * Show notification
   */
  function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show fixed-top mx-auto mt-3`;
    notification.style.maxWidth = '600px';
    notification.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    notification.style.zIndex = '9999';
    
    // Add message and close button
    notification.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.classList.remove('show');
        setTimeout(() => {
          if (notification && notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 500);
      }
    }, 5000);
  }
}

// Make the function globally available
window.ResourceMonitoring = ResourceMonitoring;