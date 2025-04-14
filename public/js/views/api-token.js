/**
 * API Token Management View
 */
export function renderAPITokenView(app) {
  const { api, ui } = app;
  
  // Create container
  const container = document.createElement('div');
  container.className = 'container mt-4';
  
  // Create card
  const card = document.createElement('div');
  card.className = 'card shadow-sm';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'card-header d-flex justify-content-between align-items-center';
  header.innerHTML = `
    <h5 class="mb-0">
      <i class="fas fa-key me-2"></i> API Token Connection
    </h5>
  `;
  
  // Create body
  const body = document.createElement('div');
  body.className = 'card-body';
  
  // Add description
  const description = document.createElement('div');
  description.className = 'alert alert-info';
  description.innerHTML = `
    <h5><i class="fas fa-info-circle me-2"></i> API Token Authentication</h5>
    <p>Your Proxmox server requires API token authentication instead of regular username/password authentication. Please create an API token in the Proxmox UI and provide the details below.</p>
    <p><strong>Steps to create an API token:</strong></p>
    <ol>
      <li>Log in to the Proxmox web UI at https://pve1.ionutlab.com:8006</li>
      <li>Go to Datacenter → Permissions → API Tokens</li>
      <li>Click "Add" to create a new token</li>
      <li>Select a user (usually root@pam), enter a token ID (e.g., "proxmox-manager"), and make sure "Privilege Separation" is <strong>unchecked</strong></li>
      <li>Click "Add" and save the Token Value securely - it will only be shown once</li>
      <li>Enter the details below to connect</li>
    </ol>
  `;
  
  // Create form
  const form = document.createElement('form');
  form.id = 'api-token-form';
  form.innerHTML = `
    <div class="row mb-3">
      <div class="col-md-6">
        <label for="host" class="form-label">Host</label>
        <input type="text" class="form-control" id="host" value="pve1.ionutlab.com" required>
      </div>
      <div class="col-md-6">
        <label for="port" class="form-label">Port</label>
        <input type="number" class="form-control" id="port" value="8006" required>
      </div>
    </div>
    
    <div class="row mb-3">
      <div class="col-md-6">
        <label for="tokenId" class="form-label">Token ID (e.g., root@pam!proxmox-manager)</label>
        <input type="text" class="form-control" id="tokenId" placeholder="user@realm!tokenId" required>
      </div>
      <div class="col-md-6">
        <label for="tokenSecret" class="form-label">Token Secret</label>
        <input type="password" class="form-control" id="tokenSecret" required>
      </div>
    </div>
    
    <div class="form-check mb-3">
      <input class="form-check-input" type="checkbox" id="verifySSL">
      <label class="form-check-label" for="verifySSL">
        Verify SSL Certificate (Uncheck for self-signed certificates)
      </label>
    </div>
    
    <div class="mb-3">
      <button type="submit" class="btn btn-primary">Test Connection</button>
      <button type="button" class="btn btn-secondary ms-2" id="save-token-btn" disabled>Save Configuration</button>
    </div>
    
    <div id="connection-status"></div>
  `;
  
  // Add event listener for form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const host = document.getElementById('host').value.trim();
    const port = document.getElementById('port').value.trim();
    const tokenId = document.getElementById('tokenId').value.trim();
    const tokenSecret = document.getElementById('tokenSecret').value.trim();
    const verifySSL = document.getElementById('verifySSL').checked;
    
    const statusDiv = document.getElementById('connection-status');
    statusDiv.innerHTML = '<div class="alert alert-info">Testing connection...</div>';
    
    try {
      ui.showLoading('Testing Proxmox API connection...');
      
      const response = await api.post('/test-direct-connection', {
        host,
        port,
        tokenId,
        tokenSecret,
        verifySSL
      });
      
      ui.hideLoading();
      
      if (response.success) {
        statusDiv.innerHTML = `
          <div class="alert alert-success">
            <h5><i class="fas fa-check-circle me-2"></i> Connection Successful!</h5>
            <p>Successfully connected to Proxmox API ${response.version.version}-${response.version.release}</p>
          </div>
        `;
        
        // Enable save button
        document.getElementById('save-token-btn').disabled = false;
      } else {
        statusDiv.innerHTML = `
          <div class="alert alert-danger">
            <h5><i class="fas fa-exclamation-circle me-2"></i> Connection Failed</h5>
            <p>${response.message}</p>
            ${response.details ? `<pre class="mt-2">${JSON.stringify(response.details, null, 2)}</pre>` : ''}
          </div>
        `;
      }
    } catch (error) {
      ui.hideLoading();
      
      statusDiv.innerHTML = `
        <div class="alert alert-danger">
          <h5><i class="fas fa-exclamation-circle me-2"></i> Connection Error</h5>
          <p>${error.message || 'Failed to connect to Proxmox API'}</p>
          ${error.data ? `<pre class="mt-2">${JSON.stringify(error.data, null, 2)}</pre>` : ''}
        </div>
      `;
    }
  });
  
  // Add event listener for save button
  document.addEventListener('DOMContentLoaded', () => {
    const saveButton = document.getElementById('save-token-btn');
    if (saveButton) {
      saveButton.addEventListener('click', async () => {
        const host = document.getElementById('host').value.trim();
        const port = document.getElementById('port').value.trim();
        const tokenId = document.getElementById('tokenId').value.trim();
        const tokenSecret = document.getElementById('tokenSecret').value.trim();
        const verifySSL = document.getElementById('verifySSL').checked;
        
        try {
          ui.showLoading('Saving API token configuration...');
          
          // Save node with API token
          const response = await api.post('/nodes', {
            name: 'Proxmox Cluster',
            api_host: host,
            api_port: port,
            api_username: tokenId,  // Store token ID as username
            api_password: tokenSecret, // Store token secret as password
            api_realm: 'token',  // Mark as token auth
            verify_ssl: verifySSL
          });
          
          ui.hideLoading();
          ui.showSuccess('API token configuration saved successfully');
          
          // Navigate to dashboard
          setTimeout(() => {
            app.router.navigate('dashboard');
          }, 1500);
        } catch (error) {
          ui.hideLoading();
          ui.showError(`Failed to save configuration: ${error.message}`);
        }
      });
    }
  });
  
  // Assemble view
  body.appendChild(description);
  body.appendChild(form);
  card.appendChild(header);
  card.appendChild(body);
  container.appendChild(card);
  
  return container;
}