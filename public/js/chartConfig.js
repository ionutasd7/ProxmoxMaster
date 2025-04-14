/**
 * Chart.js Configuration
 * Sets default chart styles and provides helper functions
 */

// Configure Chart.js defaults
configureChartDefaults();

/**
 * Configure Chart.js defaults
 */
function configureChartDefaults() {
  if (window.Chart) {
    Chart.defaults.color = '#6c757d';
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    Chart.defaults.elements.line.borderWidth = 2;
    Chart.defaults.elements.line.tension = 0.2;
    Chart.defaults.elements.point.radius = 3;
    Chart.defaults.elements.point.hoverRadius = 5;
    
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    Chart.defaults.plugins.tooltip.titleFont = { weight: 'bold' };
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.displayColors = true;
    
    console.log('Chart.js configured with dark theme defaults');
  }
}

/**
 * Create a CPU usage line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Chart data (array of values)
 * @param {Array} labels - Chart labels (array of strings)
 * @returns {Chart} Chart instance
 */
export function createCPUChart(canvasId, data, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'CPU Usage (%)',
        data: data,
        backgroundColor: 'rgba(0, 102, 204, 0.1)',
        borderColor: '#0066cc',
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y + '%';
            }
          }
        }
      }
    }
  });
}

/**
 * Create a memory usage line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Chart data (array of values in bytes)
 * @param {Array} labels - Chart labels (array of strings)
 * @param {number} totalMemory - Total memory in bytes (for max scale)
 * @returns {Chart} Chart instance
 */
export function createMemoryChart(canvasId, data, labels, totalMemory) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Memory Usage',
        data: data,
        backgroundColor: 'rgba(23, 162, 184, 0.1)',
        borderColor: '#17a2b8',
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: totalMemory || undefined,
          ticks: {
            callback: function(value) {
              return formatBytes(value, 1);
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatBytes(context.parsed.y, 2);
            }
          }
        }
      }
    }
  });
}

/**
 * Create a network traffic line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} inboundData - Inbound data (array of values in bytes)
 * @param {Array} outboundData - Outbound data (array of values in bytes)
 * @param {Array} labels - Chart labels (array of strings)
 * @returns {Chart} Chart instance
 */
export function createNetworkChart(canvasId, inboundData, outboundData, labels) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Inbound',
          data: inboundData,
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          borderColor: '#28a745',
          fill: true,
        },
        {
          label: 'Outbound',
          data: outboundData,
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          borderColor: '#dc3545',
          fill: true,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return formatBytes(value, 1) + '/s';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatBytes(context.parsed.y, 2) + '/s';
            }
          }
        }
      }
    }
  });
}

/**
 * Create a pie chart
 * @param {string} canvasId - Canvas element ID
 * @param {Array} data - Chart data (array of values)
 * @param {Array} labels - Chart labels (array of strings)
 * @param {Array} colors - Chart colors (array of strings)
 * @returns {Chart} Chart instance
 */
export function createPieChart(canvasId, data, labels, colors) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  
  return new Chart(canvas, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: colors || [
          '#0066cc',
          '#17a2b8',
          '#28a745',
          '#ffc107',
          '#dc3545',
          '#6c757d'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right'
        }
      }
    }
  });
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - Bytes
 * @param {number} decimals - Decimal places
 * @returns {string} Formatted size
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}