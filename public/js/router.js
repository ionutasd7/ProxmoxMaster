/**
 * Application Router
 * Handles routing between different views
 */
export class Router {
  constructor(app) {
    this.app = app;
    this.currentRoute = null;
    
    // Initialize routes
    this.routes = {
      'auth': () => this.app.views.auth.render(),
      'dashboard': () => {
        this.app.loadAppData();
        this.app.views.dashboard.render();
      },
      'nodes': () => {
        this.app.loadAppData();
        this.app.views.nodes.render();
      },
      'vms': () => {
        this.app.loadAppData();
        this.app.views.vms.render();
      },
      'containers': () => {
        this.app.loadAppData();
        this.app.views.containers.render();
      },
      'storage': () => {
        this.app.loadAppData();
        this.app.views.storage.render();
      },
      'network': () => {
        this.app.loadAppData();
        this.app.views.network.render();
      },
      'updates': () => {
        this.app.loadAppData();
        this.app.views.updates.render();
      },
      'settings': () => {
        this.app.views.settings.render();
      },
      'node-details': (params) => {
        this.app.loadAppData();
        this.app.views.nodes.renderDetails(params.id);
      },
      'vm-details': (params) => {
        this.app.loadAppData();
        this.app.views.vms.renderDetails(params.id);
      },
      'container-details': (params) => {
        this.app.loadAppData();
        this.app.views.containers.renderDetails(params.id);
      }
    };
    
    // Listen for URL changes
    window.addEventListener('popstate', () => {
      this.handleUrlChange();
    });
  }
  
  /**
   * Navigate to a route
   * @param {string} route - Route name
   * @param {Object} params - Route parameters
   * @param {boolean} addToHistory - Whether to add to browser history
   */
  navigate(route, params = {}, addToHistory = true) {
    console.log(`Navigating to route: ${route}`, params);
    
    // Update current route
    this.currentRoute = { name: route, params };
    
    // Update URL if needed
    if (addToHistory) {
      let url = `#/${route}`;
      
      // Add params to URL
      if (Object.keys(params).length > 0) {
        const queryParams = Object.entries(params)
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        url += `?${queryParams}`;
      }
      
      window.history.pushState(null, '', url);
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
    // Check if route exists
    if (this.routes[route]) {
      // Remove active class from all nav links
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      // Add active class to current route nav link
      const currentNavLink = document.querySelector(`.nav-link[data-route="${route}"]`);
      if (currentNavLink) {
        currentNavLink.classList.add('active');
      }
      
      // Render route
      this.routes[route](params);
    } else {
      console.error(`Route not found: ${route}`);
      this.navigate('dashboard');
    }
  }
  
  /**
   * Handle URL change (when back/forward buttons are clicked)
   */
  handleUrlChange() {
    const hash = window.location.hash.substring(1); // Remove # symbol
    
    if (!hash || hash === '/') {
      // Default route
      this.navigate('auth', {}, false);
      return;
    }
    
    // Parse route and params
    const [path, queryString] = hash.split('?');
    const routeName = path.substring(1); // Remove leading /
    
    // Parse query params
    const params = {};
    if (queryString) {
      queryString.split('&').forEach(param => {
        const [key, value] = param.split('=');
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      });
    }
    
    // Navigate to route without adding to history
    this.navigate(routeName, params, false);
  }
}