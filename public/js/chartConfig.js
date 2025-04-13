/**
 * Chart.js Global Configuration
 * Sets default styles for all charts to match our dark theme
 */

// Configure Chart.js defaults for dark theme
function configureChartDefaults() {
  if (window.Chart) {
    // Set global defaults for all charts
    Chart.defaults.color = 'rgb(200, 200, 200)';
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.backgroundColor = 'rgba(18, 18, 18, 0.7)';
    
    // Configure tooltips
    Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(42, 42, 42, 0.9)';
    Chart.defaults.plugins.tooltip.titleColor = 'rgb(240, 240, 240)';
    Chart.defaults.plugins.tooltip.bodyColor = 'rgb(240, 240, 240)';
    Chart.defaults.plugins.tooltip.borderColor = '#8257e6';
    Chart.defaults.plugins.tooltip.borderWidth = 1;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.cornerRadius = 6;
    
    // Configure legend
    Chart.defaults.plugins.legend.labels.color = 'rgb(240, 240, 240)';
    
    // Grid line settings
    Chart.defaults.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
    Chart.defaults.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
    
    // Tick settings
    Chart.defaults.scales.x.ticks.color = 'rgb(200, 200, 200)';
    Chart.defaults.scales.y.ticks.color = 'rgb(200, 200, 200)';
    
    console.log('Chart.js configured with dark theme defaults');
  } else {
    console.warn('Chart.js not found - skipping default configuration');
  }
}

// Call this function when the document is ready
document.addEventListener('DOMContentLoaded', configureChartDefaults);