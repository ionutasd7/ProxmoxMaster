/**
 * Router
 * Handles client-side routing
 */
export class Router {
  constructor(app) {
    this.app = app;
    this.routes = {};
    this.currentRoute = null;
    
    // Register routes
    this.registerRoutes();
    
    // Handle popstate (browser back/forward)
    window.addEventListener('popstate', this.handlePopState.bind(this));
    
    // Parse initial URL
    this.parseUrl();
  }
  
  /**
   * Register application routes
   */
  registerRoutes() {
    // Define authentication routes
    this.routes.auth = {
      path: '/auth',
      title: 'Login',
      view: 'auth',
      requiresAuth: false
    };
    
    // Define authenticated routes
    this.routes.dashboard = {
      path: '/',
      title: 'Dashboard',
      view: 'dashboard',
      requiresAuth: true
    };
    
    this.routes.nodes = {
      path: '/nodes',
      title: 'Nodes',
      view: 'nodes',
      requiresAuth: true
    };
    
    this.routes.vms = {
      path: '/vms',
      title: 'Virtual Machines',
      view: 'vms',
      requiresAuth: true
    };
    
    this.routes.containers = {
      path: '/containers',
      title: 'Containers',
      view: 'containers',
      requiresAuth: true
    };
    
    this.routes.storage = {
      path: '/storage',
      title: 'Storage',
      view: 'storage',
      requiresAuth: true
    };
    
    this.routes.network = {
      path: '/network',
      title: 'Network',
      view: 'network',
      requiresAuth: true
    };
    
    this.routes.templates = {
      path: '/templates',
      title: 'Templates',
      view: 'templates',
      requiresAuth: true
    };
    
    this.routes.settings = {
      path: '/settings',
      title: 'Settings',
      view: 'settings',
      requiresAuth: true
    };
    
    this.routes.apiToken = {
      path: '/api-token',
      title: 'API Token',
      view: 'api-token',
      requiresAuth: true
    };
    
    // Add more routes as needed
  }
  
  /**
   * Navigate to a route
   * @param {string} routeName - Route name
   * @param {Object} params - Route parameters
   */
  navigate(routeName, params = {}) {
    console.log('Navigating to route:', routeName, params);
    
    const route = this.routes[routeName];
    if (!route) {
      console.error(`Route ${routeName} not found`);
      return;
    }
    
    // Check authentication
    if (route.requiresAuth && !this.app.isAuthenticated) {
      console.log('Authentication required for route:', routeName);
      this.navigate('auth');
      return;
    }
    
    // Update history
    const url = this.getRouteUrl(routeName, params);
    window.history.pushState({ routeName, params }, route.title, url);
    
    // Update document title
    document.title = `${route.title} | Proxmox Manager`;
    
    // Render view
    this.renderView(route, params);
    
    // Update current route
    this.currentRoute = { routeName, params };
    
    // Dispatch route change event
    const routeChangeEvent = new CustomEvent('route-change', { 
      detail: { routeName, params }
    });
    document.dispatchEvent(routeChangeEvent);
  }
  
  /**
   * Handle popstate event (browser back/forward)
   * @param {PopStateEvent} event - Popstate event
   */
  handlePopState(event) {
    if (event.state && event.state.routeName) {
      this.renderView(this.routes[event.state.routeName], event.state.params);
      this.currentRoute = { routeName: event.state.routeName, params: event.state.params };
    } else {
      this.parseUrl();
    }
  }
  
  /**
   * Parse current URL
   */
  parseUrl() {
    const path = window.location.pathname;
    
    // Find matching route
    let matchedRoute = null;
    let routeName = null;
    let params = {};
    
    for (const [name, route] of Object.entries(this.routes)) {
      if (path === route.path) {
        matchedRoute = route;
        routeName = name;
        break;
      }
    }
    
    // If no route matched, use default
    if (!matchedRoute) {
      matchedRoute = this.routes.dashboard;
      routeName = 'dashboard';
    }
    
    // Check authentication
    if (matchedRoute.requiresAuth && !this.app.isAuthenticated) {
      this.navigate('auth');
      return;
    }
    
    // Render view
    this.renderView(matchedRoute, params);
    
    // Update current route
    this.currentRoute = { routeName, params };
  }
  
  /**
   * Get URL for a route
   * @param {string} routeName - Route name
   * @param {Object} params - Route parameters
   * @returns {string} URL
   */
  getRouteUrl(routeName, params = {}) {
    const route = this.routes[routeName];
    if (!route) {
      return '/';
    }
    
    return route.path;
  }
  
  /**
   * Render view for a route
   * @param {Object} route - Route definition
   * @param {Object} params - Route parameters
   */
  renderView(route, params = {}) {
    // Import the view module dynamically
    import(`./views/${route.view}.js`)
      .then(module => {
        // Get render function
        const renderFunction = module[`render${route.view.charAt(0).toUpperCase() + route.view.slice(1)}View`];
        
        if (typeof renderFunction !== 'function') {
          console.error(`Render function for view ${route.view} not found`);
          return;
        }
        
        // Render the view
        const viewContent = renderFunction(this.app, params);
        
        // Update the app container
        const appContainer = document.getElementById('app');
        if (appContainer) {
          appContainer.innerHTML = '';
          
          if (typeof viewContent === 'string') {
            appContainer.innerHTML = viewContent;
          } else if (viewContent instanceof Node) {
            appContainer.appendChild(viewContent);
          }
        }
      })
      .catch(error => {
        console.error(`Error loading view ${route.view}:`, error);
        
        // Show error message
        const appContainer = document.getElementById('app');
        if (appContainer) {
          appContainer.innerHTML = `
            <div class="container mt-5">
              <div class="alert alert-danger">
                <h4 class="alert-heading">Error</h4>
                <p>Failed to load view: ${error.message}</p>
              </div>
            </div>
          `;
        }
      });
  }
}