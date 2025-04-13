/**
 * Utility Functions
 * Contains helper functions used throughout the application
 */

/**
 * Display a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, warning, danger, info)
 */
function showNotification(message, type = 'info') {
  // Create notification element if it doesn't exist
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  
  // Set message and type
  notification.textContent = message;
  notification.className = `notification ${type}`;
  
  // Show notification
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Hide notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

/**
 * Format bytes to human-readable size
 * @param {number} bytes - The number of bytes
 * @param {number} decimals - The number of decimal places
 * @returns {string} Formatted size with unit
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Format a date to a human-readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Get status object based on status string
 * @param {string} status - The status string
 * @returns {Object} Status object with label, class, and icon
 */
function getStatusObject(status) {
  const lowercaseStatus = String(status).toLowerCase();
  
  if (lowercaseStatus.includes('run') || lowercaseStatus === 'on') {
    return STATUS.RUNNING;
  } else if (lowercaseStatus.includes('stop') || lowercaseStatus === 'off') {
    return STATUS.STOPPED;
  } else if (lowercaseStatus.includes('paus')) {
    return STATUS.PAUSED;
  } else if (lowercaseStatus.includes('suspend') || lowercaseStatus.includes('hibernate')) {
    return STATUS.SUSPENDED;
  } else {
    return STATUS.UNKNOWN;
  }
}

/**
 * Get HTML for displaying a status badge
 * @param {string} status - The status string
 * @returns {string} HTML string for the status badge
 */
function getStatusBadgeHTML(status) {
  const statusObj = getStatusObject(status);
  return `<span class="badge ${statusObj.class}">
    <i class="fas fa-${statusObj.icon} me-1"></i> ${statusObj.label}
  </span>`;
}

/**
 * Save data to localStorage
 * @param {string} key - The key to save under
 * @param {any} data - The data to save
 */
function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

/**
 * Get data from localStorage
 * @param {string} key - The key to retrieve
 * @param {any} defaultValue - The default value if key doesn't exist
 * @returns {any} The retrieved data or default value
 */
function getFromStorage(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return defaultValue;
  }
}

/**
 * Remove data from localStorage
 * @param {string} key - The key to remove
 */
function removeFromStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

/**
 * Clear all application data from localStorage
 */
function clearStorage() {
  try {
    Object.values(STORAGE).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Create a DOM element with attributes and content
 * @param {string} tag - The HTML tag name
 * @param {Object} attrs - Attributes to set on the element
 * @param {string|Node|Array} content - Content to append to the element
 * @returns {HTMLElement} The created element
 */
function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);
  
  // Set attributes
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue;
      });
    } else {
      element.setAttribute(key, value);
    }
  });
  
  // Add content
  if (content) {
    if (Array.isArray(content)) {
      content.forEach(item => {
        if (typeof item === 'string') {
          element.innerHTML += item;
        } else if (item instanceof Node) {
          element.appendChild(item);
        }
      });
    } else if (typeof content === 'string') {
      element.innerHTML = content;
    } else if (content instanceof Node) {
      element.appendChild(content);
    }
  }
  
  return element;
}

/**
 * Get an interpolated URL with path parameters replaced
 * @param {string} url - The URL template with {param} placeholders
 * @param {Object} params - The parameters to replace in the URL
 * @returns {string} The interpolated URL
 */
function getUrl(url, params = {}) {
  let result = url;
  
  Object.entries(params).forEach(([key, value]) => {
    result = result.replace(`{${key}}`, value);
  });
  
  return result;
}

/**
 * Debounce a function call
 * @param {Function} func - The function to debounce
 * @param {number} wait - The time to wait in milliseconds
 * @returns {Function} The debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function call
 * @param {Function} func - The function to throttle
 * @param {number} limit - The time limit in milliseconds
 * @returns {Function} The throttled function
 */
function throttle(func, limit = 300) {
  let waiting = false;
  
  return function executedFunction(...args) {
    if (!waiting) {
      func(...args);
      waiting = true;
      setTimeout(() => {
        waiting = false;
      }, limit);
    }
  };
}