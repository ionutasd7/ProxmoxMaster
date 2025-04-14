/**
 * Router
 * Handles client-side routing
 */
export class Router {
  constructor(app) {
    this.app = app;
    this.routes = {};
    this.currentRoute = null;
    this.currentParams = {};
    
    // Register default routes
    this.registerRoutes();
    
    // Initialize popstate event listener
    window.addEventListener('popstate', (event) => {
      this.handlePopState(event);
    });
    
    // Parse initial URL
    this.parseUrl();
  }
  
  /**
   * Register application routes
   */
  registerRoutes() {
    this.routes = {
      // Main routes
      'auth': {
        view: 'auth',
        title: 'Login - Proxmox Manager'
      },
      'dashboard': {
        view: 'dashboard',
        title: 'Dashboard - Proxmox Manager',
        authRequired: true
      },
      'nodes': {
        view: 'nodes',
        title: 'Nodes - Proxmox Manager',
        authRequired: true
      },
      'node-details': {
        view: 'nodes',
        method: 'renderDetails',
        title: 'Node Details - Proxmox Manager',
        authRequired: true
      },
      'vms': {
        view: 'vms',
        title: 'Virtual Machines - Proxmox Manager',
        authRequired: true
      },
      'containers': {
        view: 'containers',
        title: 'Containers - Proxmox Manager',
        authRequired: true
      },
      'storage': {
        view: 'storage',
        title: 'Storage - Proxmox Manager',
        authRequired: true
      },
      'network': {
        view: 'network',
        title: 'Network - Proxmox Manager',
        authRequired: true
      },
      'templates': {
        view: 'templates',
        title: 'Templates - Proxmox Manager',
        authRequired: true
      },
      'settings': {
        view: 'settings',
        title: 'Settings - Proxmox Manager',
        authRequired: true
      }
    };
  }
  
  /**
   * Navigate to a route
   * @param {string} routeName - Route name
   * @param {Object} params - Route parameters
   */
  navigate(routeName, params = {}) {
    console.log('Navigating to route:', routeName, params);
    
    // Get route definition
    const route = this.routes[routeName];
    if (!route) {
      console.error(`Route "${routeName}" not found`);
      this.navigate('dashboard');
      return;
    }
    
    // Check if authentication is required
    if (route.authRequired && !this.app.state.isAuthenticated()) {
      console.log('Authentication required for route:', routeName);
      this.navigate('auth');
      return;
    }
    
    // Update URL
    const url = this.getRouteUrl(routeName, params);
    window.history.pushState({ route: routeName, params }, route.title, url);
    
    // Update document title
    document.title = route.title;
    
    // Set current route and params
    this.currentRoute = routeName;
    this.currentParams = params;
    
    // Render view
    this.renderView(route, params);
  }
  
  /**
   * Handle popstate event (browser back/forward)
   * @param {PopStateEvent} event - Popstate event
   */
  handlePopState(event) {
    const state = event.state || { route: 'dashboard', params: {} };
    const route = this.routes[state.route];
    
    if (route) {
      // Check if authentication is required
      if (route.authRequired && !this.app.state.isAuthenticated()) {
        console.log('Authentication required for route:', state.route);
        this.navigate('auth');
        return;
      }
      
      // Update document title
      document.title = route.title;
      
      // Set current route and params
      this.currentRoute = state.route;
      this.currentParams = state.params;
      
      // Render view
      this.renderView(route, state.params);
    }
  }
  
  /**
   * Parse current URL
   */
  parseUrl() {
    // Get path from URL
    const path = window.location.pathname;
    
    // Default route
    let routeName = 'dashboard';
    let params = {};
    
    // Parse route and params from URL
    if (path !== '/') {
      const pathParts = path.split('/').filter(Boolean);
      if (pathParts.length > 0) {
        const possibleRoute = pathParts[0];
        
        // Check if route exists
        if (this.routes[possibleRoute]) {
          routeName = possibleRoute;
          
          // Parse params
          if (pathParts.length > 1) {
            // TODO: Parse params from URL (for the future)
          }
        }
      }
    }
    
    // Navigate to parsed route
    this.navigate(routeName, params);
  }
  
  /**
   * Get URL for a route
   * @param {string} routeName - Route name
   * @param {Object} params - Route parameters
   * @returns {string} URL
   */
  getRouteUrl(routeName, params = {}) {
    // Simple URL generation
    if (routeName === 'dashboard') {
      return '/';
    }
    
    // Add params to URL if needed
    if (routeName === 'node-details' && params.id) {
      return `/nodes/${params.id}`;
    }
    
    return `/${routeName}`;
  }
  
  /**
   * Render view for a route
   * @param {Object} route - Route definition
   * @param {Object} params - Route parameters
   */
  renderView(route, params = {}) {
    const viewName = route.view;
    if (!viewName) {
      console.error('No view specified for route:', route);
      return;
    }
    
    const view = this.app.views[viewName];
    if (!view) {
      console.error(`View "${viewName}" not found`);
      return;
    }
    
    // Call render method or custom method if specified
    const method = route.method || 'render';
    if (typeof view[method] === 'function') {
      view[method](params);
    } else {
      console.error(`Method "${method}" not found in view "${viewName}"`);
    }
  }
}