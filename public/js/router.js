/**
 * Application Router
 * Handles routing between different views
 */
export class Router {
  constructor(app) {
    this.app = app;
    this.routes = [
      'auth',
      'dashboard',
      'nodes',
      'node-details',
      'vms',
      'vm-details',
      'containers',
      'container-details',
      'storage',
      'network',
      'templates',
      'updates',
      'settings'
    ];
    
    // Listen for URL changes
    window.addEventListener('popstate', this.handleUrlChange.bind(this));
  }
  
  /**
   * Navigate to a route
   * @param {string} route - Route name
   * @param {Object} params - Route parameters
   * @param {boolean} addToHistory - Whether to add to browser history
   */
  navigate(route, params = {}, addToHistory = true) {
    console.log('Navigating to route:', route, params);
    
    // Validate route
    if (!this.routes.includes(route)) {
      console.error(`Invalid route: ${route}`);
      route = 'dashboard';
    }
    
    // Add to browser history
    if (addToHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set('route', route);
      
      // Add params to URL
      Object.keys(params).forEach(key => {
        url.searchParams.set(key, params[key]);
      });
      
      window.history.pushState({
        route,
        params,
      }, '', url.toString());
    }
    
    // Render the route
    this.renderRoute(route, params);
  }
  
  /**
   * Render the current route
   * @param {string} route - Route name
   * @param {Object} params - Route parameters
   */
  renderRoute(route, params = {}) {
    // Clear main content
    const appElement = document.getElementById('app');
    
    // Delegate rendering to the appropriate view
    if (route === 'auth') {
      if (this.app.views.auth) {
        this.app.views.auth.render();
      }
    } else if (this.app.views[route]) {
      // Check if we need to render a detail view
      if (route.endsWith('-details') && this.app.views[route.split('-')[0]]) {
        // For detail views, render via parent view
        this.app.views[route.split('-')[0]].renderDetails(params);
      } else {
        // Render regular view
        this.app.views[route].render(params);
      }
    } else {
      console.error(`No view found for route: ${route}`);
    }
  }
  
  /**
   * Handle URL change (when back/forward buttons are clicked)
   */
  handleUrlChange() {
    const url = new URL(window.location.href);
    const route = url.searchParams.get('route') || 'dashboard';
    
    // Extract parameters from URL
    const params = {};
    url.searchParams.forEach((value, key) => {
      if (key !== 'route') {
        params[key] = value;
      }
    });
    
    // Navigate to the route without adding to history
    this.navigate(route, params, false);
  }
}