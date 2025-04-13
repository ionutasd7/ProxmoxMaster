/**
 * Containers components
 * Contains both LXCListView and LXCCreateView
 */

const LXCListView = {
  render(container, params = {}) {
    const { selectedNode, auth } = params;
    
    // Create dashboard container
    const dashboardContainer = createElement('div', { className: 'dashboard-container' });
    
    // Add sidebar
    dashboardContainer.appendChild(DashboardView.renderSidebar(auth, selectedNode));
    
    // Create main content element
    const mainContent = createElement('div', { className: 'main-content' });
    
    // Add grid background
    mainContent.appendChild(createElement('div', { className: 'grid-bg' }));
    
    // Add content
    mainContent.innerHTML += `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-cube me-3"></i> CONTAINERS</h1>
      </div>
      
      <div class="alert alert-info">
        <h4 class="alert-heading"><i class="fas fa-info-circle me-2"></i> Container Management</h4>
        <p>The container management interface is under development.</p>
      </div>
    `;
    
    // Add main content to dashboard container
    dashboardContainer.appendChild(mainContent);
    
    // Add the dashboard container to the main container
    container.appendChild(dashboardContainer);
  }
};

const LXCCreateView = {
  render(container, params = {}) {
    const { selectedNode, auth } = params;
    
    // Create dashboard container
    const dashboardContainer = createElement('div', { className: 'dashboard-container' });
    
    // Add sidebar
    dashboardContainer.appendChild(DashboardView.renderSidebar(auth, selectedNode));
    
    // Create main content element
    const mainContent = createElement('div', { className: 'main-content' });
    
    // Add grid background
    mainContent.appendChild(createElement('div', { className: 'grid-bg' }));
    
    // Add content
    mainContent.innerHTML += `
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h1 class="glow-text"><i class="fas fa-plus-circle me-3"></i> CREATE CONTAINER</h1>
      </div>
      
      <div class="alert alert-info">
        <h4 class="alert-heading"><i class="fas fa-info-circle me-2"></i> Container Creation</h4>
        <p>The container creation interface is under development.</p>
      </div>
    `;
    
    // Add main content to dashboard container
    dashboardContainer.appendChild(mainContent);
    
    // Add the dashboard container to the main container
    container.appendChild(dashboardContainer);
  }
};