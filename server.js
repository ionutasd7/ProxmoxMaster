/**
 * Proxmox Manager - Express Server
 * Direct integration with Proxmox VE API
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const bodyParser = require('body-parser');
const axios = require('axios');
const https = require('https');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  store: new pgSession({
    pool,
    tableName: 'user_sessions'
  }),
  secret: process.env.SESSION_SECRET || 'proxmox-manager-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Axios instance for Proxmox API
const createProxmoxClient = (host, port, username, password, realm = 'pam', verifySSL = false) => {
  // Create an HTTPS agent that allows self-signed certificates
  const httpsAgent = new https.Agent({
    rejectUnauthorized: verifySSL
  });

  // Configure axios with additional settings for Proxmox
  const axiosInstance = axios.create({
    baseURL: `https://${host}:${port}/api2/json`,
    httpsAgent,
    headers: {
      'Content-Type': 'application/json'
    },
    // Add more reliable settings
    timeout: 30000, // 30 second timeout
    maxRedirects: 5,
    validateStatus: function (status) {
      return status >= 200 && status < 500; // Handle authentication errors in code
    }
  });

  // Add request interceptor for debugging
  axiosInstance.interceptors.request.use((config) => {
    console.log(`Request to Proxmox: ${config.method?.toUpperCase() || 'UNKNOWN'} ${config.url}`);
    return config;
  });

  // Add response interceptor for debugging
  axiosInstance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response) {
        console.error(`Proxmox API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.error('Proxmox API Error: No response received', error.message);
      } else {
        console.error('Proxmox API Error:', error.message);
      }
      return Promise.reject(error);
    }
  );

  return axiosInstance;
};

// Authenticate with Proxmox API and get ticket
async function authenticateProxmox(client, username, password, realm = 'pam') {
  try {
    console.log(`Authenticating with Proxmox API using ${username}`);
    
    // Ensure username has the correct format (with @realm if not already included)
    let formattedUsername = username;
    if (!username.includes('@') && realm) {
      formattedUsername = `${username}@${realm}`;
    }
    
    console.log(`Using formatted username: ${formattedUsername}`);
    
    // Try with URL-encoded form data
    const formData = new URLSearchParams();
    formData.append('username', formattedUsername);
    formData.append('password', password);
    
    // Don't include realm in form data if it's already in the username
    if (!formattedUsername.includes('@')) {
      formData.append('realm', realm);
    }
    
    const response = await client.post('/access/ticket', 
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        maxRedirects: 5
      }
    );
    
    if (response.data && response.data.data) {
      const { ticket, CSRFPreventionToken } = response.data.data;
      console.log('Authentication successful, received ticket and CSRF token');
      return { ticket, CSRFPreventionToken };
    } else {
      throw new Error('Authentication failed: Invalid response from Proxmox API');
    }
  } catch (error) {
    console.error('Authentication error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Try a fallback authentication approach with different formatting
    try {
      console.log('Trying fallback authentication method...');
      
      // Try with the username as-is (without @realm suffix)
      const plainUsername = username.split('@')[0];
      
      const formData = new URLSearchParams();
      formData.append('username', plainUsername);
      formData.append('password', password);
      formData.append('realm', realm);
      
      const response = await client.post('/access/ticket', 
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          maxRedirects: 5
        }
      );
      
      if (response.data && response.data.data) {
        const { ticket, CSRFPreventionToken } = response.data.data;
        console.log('Fallback authentication successful');
        return { ticket, CSRFPreventionToken };
      }
    } catch (fallbackError) {
      console.error('Fallback authentication also failed:', fallbackError.message);
    }
    
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

// Initialize database tables
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table for connect-pg-simple
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        sid varchar NOT NULL COLLATE "default",
        sess json NOT NULL,
        expire timestamp(6) NOT NULL,
        CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
      )
    `);

    // Create proxmox_nodes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS proxmox_nodes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        api_host VARCHAR(100) NOT NULL,
        api_port INTEGER DEFAULT 8006,
        api_username VARCHAR(50) NOT NULL,
        api_password VARCHAR(100) NOT NULL,
        api_realm VARCHAR(20) DEFAULT 'pam',
        ssh_host VARCHAR(100),
        ssh_port INTEGER DEFAULT 22,
        ssh_username VARCHAR(50),
        ssh_password VARCHAR(100),
        use_ssl BOOLEAN DEFAULT TRUE,
        verify_ssl BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create activity_log table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        target_type VARCHAR(50),
        target_id VARCHAR(50),
        details TEXT,
        status VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create vm_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vm_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cores INTEGER DEFAULT 1,
        memory INTEGER DEFAULT 1024,
        disk_size INTEGER DEFAULT 10,
        os_type VARCHAR(50),
        os_version VARCHAR(50),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create lxc_templates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lxc_templates (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        cores INTEGER DEFAULT 1,
        memory INTEGER DEFAULT 512,
        disk_size INTEGER DEFAULT 5,
        os_template VARCHAR(100),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check if admin user exists, create if not
    const adminResult = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    if (adminResult.rowCount === 0) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      await pool.query(
        'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );
      console.log('Created default admin user');
    }

    console.log('Database initialization complete');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// API Routes

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Proxmox Manager API is running',
    serverTime: new Date().toISOString()
  });
});

// Test a direct connection to Proxmox with API token
app.post('/api/test-direct-connection', async (req, res) => {
  try {
    const { host, port, tokenId, tokenSecret, verifySSL } = req.body;
    
    if (!host || !port || !tokenId || !tokenSecret) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: host, port, tokenId, tokenSecret'
      });
    }
    
    console.log(`Testing direct API token connection to ${host}:${port}`);
    
    // Create HTTPS agent with proper SSL verification
    const httpsAgent = new https.Agent({
      rejectUnauthorized: verifySSL !== false
    });
    
    // Try a direct connection with token auth
    const apiClient = axios.create({
      baseURL: `https://${host}:${port}/api2/json`,
      timeout: 30000,
      httpsAgent,
      headers: {
        'Authorization': `PVEAPIToken=${tokenId}=${tokenSecret}`
      }
    });
    
    // Test connection by getting version
    const response = await apiClient.get('/version');
    
    if (response.data && response.data.data) {
      // Successful connection
      res.json({
        success: true,
        message: 'Successfully connected using API token',
        version: response.data.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Connected but received invalid response format'
      });
    }
  } catch (error) {
    console.error('Direct connection test error:', error.message);
    
    let errorMessage = 'Connection failed';
    let errorDetails = null;
    
    if (error.response) {
      errorMessage = `Server responded with status ${error.response.status}`;
      errorDetails = error.response.data;
    } else if (error.request) {
      errorMessage = 'No response received from server';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      details: errorDetails
    });
  }
});

// Authentication routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Check if user exists
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    // Set user session
    req.session.userId = user.id;
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
    
    // Return user info (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get user info
    const result = await pool.query('SELECT id, username, email, role, created_at, last_login FROM users WHERE id = $1', [req.session.userId]);
    const user = result.rows[0];
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('User info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Node Management Routes
app.get('/api/nodes', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get nodes from database
    const result = await pool.query('SELECT * FROM proxmox_nodes');
    const nodes = result.rows;
    
    // Get node status
    for (const node of nodes) {
      try {
        const client = createProxmoxClient(
          node.api_host,
          node.api_port,
          node.api_username,
          node.api_password,
          node.api_realm,
          node.verify_ssl
        );
        
        // Authenticate with Proxmox
        const auth = await authenticateProxmox(
          client,
          node.api_username,
          node.api_password,
          node.api_realm
        );
        
        // Get node status
        const nodeInfoResponse = await client.get('/nodes', {
          headers: {
            'Cookie': `PVEAuthCookie=${auth.ticket}`
          }
        });
        
        // Update node status
        if (nodeInfoResponse.data && nodeInfoResponse.data.data) {
          const proxmoxNode = nodeInfoResponse.data.data.find(n => n.node === node.name);
          if (proxmoxNode) {
            node.status = proxmoxNode.status;
            node.node_status = proxmoxNode.status;
          } else {
            node.status = 'offline';
            node.node_status = 'offline';
          }
        } else {
          node.status = 'unknown';
          node.node_status = 'unknown';
        }
      } catch (error) {
        console.error(`Error getting status for node ${node.name}:`, error.message);
        node.status = 'offline';
        node.node_status = 'offline';
      }
    }
    
    res.json(nodes);
  } catch (error) {
    console.error('Error getting nodes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/nodes', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const {
      name,
      api_host,
      api_port,
      api_username,
      api_password,
      api_realm,
      ssh_host,
      ssh_port,
      ssh_username,
      ssh_password,
      use_ssl,
      verify_ssl
    } = req.body;
    
    // Validate required fields
    if (!name || !api_host || !api_port || !api_username || !api_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Test connection to Proxmox API
    try {
      const client = createProxmoxClient(
        api_host,
        api_port,
        api_username,
        api_password,
        api_realm || 'pam',
        verify_ssl || false
      );
      
      await authenticateProxmox(
        client,
        api_username,
        api_password,
        api_realm || 'pam'
      );
    } catch (error) {
      return res.status(400).json({ 
        error: 'Failed to connect to Proxmox API',
        details: error.message
      });
    }
    
    // Insert node into database
    const result = await pool.query(
      `INSERT INTO proxmox_nodes (
        name, api_host, api_port, api_username, api_password, api_realm,
        ssh_host, ssh_port, ssh_username, ssh_password, use_ssl, verify_ssl
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [
        name,
        api_host,
        api_port,
        api_username,
        api_password,
        api_realm || 'pam',
        ssh_host || api_host,
        ssh_port || 22,
        ssh_username || api_username,
        ssh_password || api_password,
        use_ssl !== undefined ? use_ssl : true,
        verify_ssl || false
      ]
    );
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_log (user_id, action, target_type, target_id, details, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.session.userId, 'add_node', 'node', result.rows[0].id, `Added node ${name}`, 'success']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/nodes/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const nodeId = req.params.id;
    
    // Get node info before deletion
    const nodeResult = await pool.query('SELECT * FROM proxmox_nodes WHERE id = $1', [nodeId]);
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.rows[0];
    
    // Delete node
    await pool.query('DELETE FROM proxmox_nodes WHERE id = $1', [nodeId]);
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_log (user_id, action, target_type, target_id, details, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.session.userId, 'delete_node', 'node', nodeId, `Deleted node ${node.name}`, 'success']
    );
    
    res.json({ success: true, message: 'Node deleted successfully' });
  } catch (error) {
    console.error('Error deleting node:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/nodes/test-connection', async (req, res) => {
  try {
    const {
      api_host,
      api_port,
      api_username,
      api_password,
      api_realm,
      verify_ssl
    } = req.body;
    
    // Validate required fields
    if (!api_host || !api_port || !api_username || !api_password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    console.log(`Testing connection to ${api_host}:${api_port} with credentials ${api_username}`);
    
    // Create Proxmox API client
    const client = createProxmoxClient(
      api_host,
      api_port,
      api_username,
      api_password,
      api_realm || 'pam',
      verify_ssl || false
    );
    
    // Authenticate with Proxmox
    const auth = await authenticateProxmox(
      client,
      api_username,
      api_password,
      api_realm || 'pam'
    );
    
    // Get nodes to test further API access
    const nodesResponse = await client.get('/nodes', {
      headers: {
        'Cookie': `PVEAuthCookie=${auth.ticket}`
      }
    });
    
    // Get version info for additional validation
    const versionResponse = await client.get('/version', {
      headers: {
        'Cookie': `PVEAuthCookie=${auth.ticket}`
      }
    });
    
    res.json({
      success: true,
      message: 'Connection successful',
      nodes: nodesResponse.data.data,
      version: versionResponse.data.data
    });
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(400).json({
      success: false,
      error: 'Connection failed',
      message: error.message,
      details: error.response ? error.response.data : null
    });
  }
});

// VM and Container Management

// Get all VMs
app.get('/api/vms', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get nodes from database
    const nodesResult = await pool.query('SELECT * FROM proxmox_nodes');
    const nodes = nodesResult.rows;
    
    // Initialize empty VMs array
    let allVMs = [];
    
    // For each node, get VMs
    for (const node of nodes) {
      try {
        const client = createProxmoxClient(
          node.api_host,
          node.api_port,
          node.api_username,
          node.api_password,
          node.api_realm,
          node.verify_ssl
        );
        
        // Authenticate with Proxmox
        const auth = await authenticateProxmox(
          client,
          node.api_username,
          node.api_password,
          node.api_realm
        );
        
        // Get nodes first
        const nodeInfoResponse = await client.get('/nodes', {
          headers: {
            'Cookie': `PVEAuthCookie=${auth.ticket}`
          }
        });
        
        const proxmoxNodes = nodeInfoResponse.data.data;
        
        // For each Proxmox node, get VMs
        for (const proxmoxNode of proxmoxNodes) {
          // Get VMs (qemu resources)
          const vmResponse = await client.get(`/nodes/${proxmoxNode.node}/qemu`, {
            headers: {
              'Cookie': `PVEAuthCookie=${auth.ticket}`
            }
          });
          
          if (vmResponse.data && vmResponse.data.data) {
            // Add node ID and node name to each VM
            const vmsWithNodeInfo = vmResponse.data.data.map(vm => ({
              ...vm, 
              node_id: node.id,
              node_name: proxmoxNode.node
            }));
            allVMs = [...allVMs, ...vmsWithNodeInfo];
          }
        }
      } catch (error) {
        console.error(`Error getting VMs for node ${node.name}:`, error.message);
      }
    }
    
    res.json({ success: true, vms: allVMs });
  } catch (error) {
    console.error('Error getting VMs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all containers
app.get('/api/containers', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get nodes from database
    const nodesResult = await pool.query('SELECT * FROM proxmox_nodes');
    const nodes = nodesResult.rows;
    
    // Initialize empty containers array
    let allContainers = [];
    
    // For each node, get containers
    for (const node of nodes) {
      try {
        const client = createProxmoxClient(
          node.api_host,
          node.api_port,
          node.api_username,
          node.api_password,
          node.api_realm,
          node.verify_ssl
        );
        
        // Authenticate with Proxmox
        const auth = await authenticateProxmox(
          client,
          node.api_username,
          node.api_password,
          node.api_realm
        );
        
        // Get nodes first
        const nodeInfoResponse = await client.get('/nodes', {
          headers: {
            'Cookie': `PVEAuthCookie=${auth.ticket}`
          }
        });
        
        const proxmoxNodes = nodeInfoResponse.data.data;
        
        // For each Proxmox node, get containers
        for (const proxmoxNode of proxmoxNodes) {
          // Get containers (lxc resources)
          const containerResponse = await client.get(`/nodes/${proxmoxNode.node}/lxc`, {
            headers: {
              'Cookie': `PVEAuthCookie=${auth.ticket}`
            }
          });
          
          if (containerResponse.data && containerResponse.data.data) {
            // Add node ID and node name to each container
            const containersWithNodeInfo = containerResponse.data.data.map(container => ({
              ...container, 
              node_id: node.id,
              node_name: proxmoxNode.node
            }));
            allContainers = [...allContainers, ...containersWithNodeInfo];
          }
        }
      } catch (error) {
        console.error(`Error getting containers for node ${node.name}:`, error.message);
      }
    }
    
    res.json({ success: true, containers: allContainers });
  } catch (error) {
    console.error('Error getting containers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific node details
app.get('/api/nodes/:id', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const nodeId = req.params.id;
    
    // Get node from database
    const nodeResult = await pool.query('SELECT * FROM proxmox_nodes WHERE id = $1', [nodeId]);
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.rows[0];
    
    // Get node details from Proxmox API
    try {
      const client = createProxmoxClient(
        node.api_host,
        node.api_port,
        node.api_username,
        node.api_password,
        node.api_realm,
        node.verify_ssl
      );
      
      // Authenticate with Proxmox
      const auth = await authenticateProxmox(
        client,
        node.api_username,
        node.api_password,
        node.api_realm
      );
      
      // Get node status
      const nodeInfoResponse = await client.get('/nodes', {
        headers: {
          'Cookie': `PVEAuthCookie=${auth.ticket}`
        }
      });
      
      let nodeDetails = null;
      
      // Find the specific node in the response
      if (nodeInfoResponse.data && nodeInfoResponse.data.data) {
        const proxmoxNode = nodeInfoResponse.data.data.find(n => n.node === node.name);
        if (proxmoxNode) {
          nodeDetails = proxmoxNode;
          
          // Get more detailed node information
          const nodeStatusResponse = await client.get(`/nodes/${node.name}/status`, {
            headers: {
              'Cookie': `PVEAuthCookie=${auth.ticket}`
            }
          });
          
          if (nodeStatusResponse.data && nodeStatusResponse.data.data) {
            nodeDetails = {
              ...nodeDetails,
              ...nodeStatusResponse.data.data
            };
          }
        }
      }
      
      // If node details were found, return them with the database node
      if (nodeDetails) {
        res.json({
          ...node,
          proxmox_details: nodeDetails
        });
      } else {
        // Otherwise, just return the database node
        res.json(node);
      }
    } catch (error) {
      console.error(`Error getting details for node ${node.name}:`, error.message);
      res.json(node);
    }
  } catch (error) {
    console.error('Error getting node details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard data
app.get('/api/dashboard', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get nodes from database
    const nodesResult = await pool.query('SELECT * FROM proxmox_nodes');
    const nodes = nodesResult.rows;
    
    // Initialize dashboard data
    const clusterData = {
      nodes: [],
      stats: {
        totalNodes: nodes.length,
        onlineNodes: 0,
        warningNodes: 0,
        offlineNodes: 0,
        totalVMs: 0,
        runningVMs: 0,
        totalContainers: 0,
        runningContainers: 0,
        totalCPUs: 0,
        cpuUsage: 0,
        totalMemory: 0,
        usedMemory: 0,
        totalStorage: 0,
        usedStorage: 0
      },
      networkUsage: {
        inbound: 0,
        outbound: 0
      }
    };
    
    // For each node, get data
    for (const node of nodes) {
      try {
        const client = createProxmoxClient(
          node.api_host,
          node.api_port,
          node.api_username,
          node.api_password,
          node.api_realm,
          node.verify_ssl
        );
        
        // Authenticate with Proxmox
        const auth = await authenticateProxmox(
          client,
          node.api_username,
          node.api_password,
          node.api_realm
        );
        
        // Get nodes
        const nodeInfoResponse = await client.get('/nodes', {
          headers: {
            'Cookie': `PVEAuthCookie=${auth.ticket}`
          }
        });
        
        const proxmoxNodes = nodeInfoResponse.data.data;
        
        // Process each Proxmox node
        for (const proxmoxNode of proxmoxNodes) {
          // Get node status
          try {
            const nodeStatusResponse = await client.get(`/nodes/${proxmoxNode.node}/status`, {
              headers: {
                'Cookie': `PVEAuthCookie=${auth.ticket}`
              }
            });
            
            if (nodeStatusResponse.data && nodeStatusResponse.data.data) {
              const nodeStatus = nodeStatusResponse.data.data;
              
              // Determine node status
              if (proxmoxNode.status === 'online') {
                clusterData.stats.onlineNodes++;
              } else if (proxmoxNode.status === 'unknown') {
                clusterData.stats.warningNodes++;
              } else {
                clusterData.stats.offlineNodes++;
              }
              
              // Get VMs for this node
              const vmsResponse = await client.get(`/nodes/${proxmoxNode.node}/qemu`, {
                headers: {
                  'Cookie': `PVEAuthCookie=${auth.ticket}`
                }
              });
              
              const vms = vmsResponse.data.data || [];
              clusterData.stats.totalVMs += vms.length;
              clusterData.stats.runningVMs += vms.filter(vm => vm.status === 'running').length;
              
              // Get containers for this node
              const containersResponse = await client.get(`/nodes/${proxmoxNode.node}/lxc`, {
                headers: {
                  'Cookie': `PVEAuthCookie=${auth.ticket}`
                }
              });
              
              const containers = containersResponse.data.data || [];
              clusterData.stats.totalContainers += containers.length;
              clusterData.stats.runningContainers += containers.filter(c => c.status === 'running').length;
              
              // Update CPU stats
              if (nodeStatus.cpuinfo) {
                clusterData.stats.totalCPUs += nodeStatus.cpuinfo.cpus || 0;
              }
              
              // Update memory stats
              if (nodeStatus.memory) {
                clusterData.stats.totalMemory += nodeStatus.memory.total || 0;
                clusterData.stats.usedMemory += nodeStatus.memory.used || 0;
              }
              
              // Update storage stats
              try {
                const storageResponse = await client.get(`/nodes/${proxmoxNode.node}/storage`, {
                  headers: {
                    'Cookie': `PVEAuthCookie=${auth.ticket}`
                  }
                });
                
                const storages = storageResponse.data.data || [];
                for (const storage of storages) {
                  clusterData.stats.totalStorage += storage.total || 0;
                  clusterData.stats.usedStorage += storage.used || 0;
                }
              } catch (error) {
                console.error(`Error getting storage for node ${proxmoxNode.node}:`, error.message);
              }
              
              // Get network statistics
              try {
                const rrdataResponse = await client.get(`/nodes/${proxmoxNode.node}/rrddata`, {
                  headers: {
                    'Cookie': `PVEAuthCookie=${auth.ticket}`
                  },
                  params: {
                    timeframe: 'hour',
                    cf: 'AVERAGE'
                  }
                });
                
                const rrdData = rrdataResponse.data.data;
                if (rrdData && rrdData.length > 0) {
                  // Get the most recent data point
                  const latestData = rrdData[rrdData.length - 1];
                  
                  // Add network traffic to totals (if available)
                  if (latestData.netin !== undefined) {
                    clusterData.networkUsage.inbound += latestData.netin || 0;
                  }
                  
                  if (latestData.netout !== undefined) {
                    clusterData.networkUsage.outbound += latestData.netout || 0;
                  }
                  
                  // Add CPU usage (average across all nodes)
                  if (latestData.cpu !== undefined) {
                    clusterData.stats.cpuUsage += latestData.cpu || 0;
                  }
                }
              } catch (error) {
                console.error(`Error getting RRD data for node ${proxmoxNode.node}:`, error.message);
              }
              
              // Add node to the nodes array
              clusterData.nodes.push({
                id: node.id,
                name: proxmoxNode.node,
                status: proxmoxNode.status,
                ip: node.api_host,
                uptime: nodeStatus.uptime || 0,
                cpu: nodeStatus.cpu || 0,
                memory: nodeStatus.memory || { total: 0, used: 0, free: 0 },
                vms: vms.length,
                containers: containers.length
              });
            }
          } catch (error) {
            console.error(`Error getting status for node ${proxmoxNode.node}:`, error.message);
          }
        }
      } catch (error) {
        console.error(`Error processing node ${node.name} for dashboard:`, error.message);
      }
    }
    
    // Calculate averages
    if (clusterData.stats.onlineNodes > 0) {
      clusterData.stats.cpuUsage = clusterData.stats.cpuUsage / clusterData.stats.onlineNodes;
    }
    
    // Log what data we collected
    console.log('Dashboard API response stats:', {
      totalNodes: clusterData.stats.totalNodes,
      onlineNodes: clusterData.stats.onlineNodes,
      offlineNodes: clusterData.stats.offlineNodes,
      nodeCount: clusterData.nodes.length,
      totalCPUs: clusterData.stats.totalCPUs,
      totalMemory: clusterData.stats.totalMemory
    });
    
    res.json({ success: true, cluster: clusterData });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// VM and Container actions
app.post('/api/nodes/:nodeId/qemu/:vmId/action', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { nodeId, vmId } = req.params;
    const { action } = req.body;
    
    // Validate action
    if (!['start', 'stop', 'reset', 'shutdown', 'suspend', 'resume'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Get node from database
    const nodeResult = await pool.query('SELECT * FROM proxmox_nodes WHERE id = $1', [nodeId]);
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.rows[0];
    
    // Execute action on VM
    try {
      const client = createProxmoxClient(
        node.api_host,
        node.api_port,
        node.api_username,
        node.api_password,
        node.api_realm,
        node.verify_ssl
      );
      
      // Authenticate with Proxmox
      const auth = await authenticateProxmox(
        client,
        node.api_username,
        node.api_password,
        node.api_realm
      );
      
      // Map the action to the Proxmox API endpoint
      let apiAction = action;
      if (action === 'reset') {
        apiAction = 'reset';
      }
      
      // Execute the action
      const actionResponse = await client.post(`/nodes/${node.name}/qemu/${vmId}/status/${apiAction}`, {}, {
        headers: {
          'Cookie': `PVEAuthCookie=${auth.ticket}`,
          'CSRFPreventionToken': auth.CSRFPreventionToken
        }
      });
      
      // Log activity
      await pool.query(
        'INSERT INTO activity_log (user_id, action, target_type, target_id, details, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.session.userId, `vm_${action}`, 'vm', vmId, `Performed ${action} on VM ${vmId} on node ${node.name}`, 'success']
      );
      
      res.json({ 
        success: true, 
        message: `Action ${action} performed on VM ${vmId}`,
        taskId: actionResponse.data.data
      });
    } catch (error) {
      console.error(`Error performing action ${action} on VM ${vmId}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Log failed activity
      await pool.query(
        'INSERT INTO activity_log (user_id, action, target_type, target_id, details, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.session.userId, `vm_${action}`, 'vm', vmId, `Failed to perform ${action} on VM ${vmId} on node ${node.name}: ${error.message}`, 'error']
      );
      
      res.status(500).json({ 
        error: 'Failed to perform action',
        message: error.message,
        details: error.response ? error.response.data : null
      });
    }
  } catch (error) {
    console.error('Error handling VM action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/nodes/:nodeId/lxc/:containerId/action', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const { nodeId, containerId } = req.params;
    const { action } = req.body;
    
    // Validate action
    if (!['start', 'stop', 'restart', 'shutdown', 'suspend', 'resume'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }
    
    // Get node from database
    const nodeResult = await pool.query('SELECT * FROM proxmox_nodes WHERE id = $1', [nodeId]);
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const node = nodeResult.rows[0];
    
    // Execute action on container
    try {
      const client = createProxmoxClient(
        node.api_host,
        node.api_port,
        node.api_username,
        node.api_password,
        node.api_realm,
        node.verify_ssl
      );
      
      // Authenticate with Proxmox
      const auth = await authenticateProxmox(
        client,
        node.api_username,
        node.api_password,
        node.api_realm
      );
      
      // Map the action to the Proxmox API endpoint
      let apiAction = action;
      if (action === 'restart') {
        apiAction = 'restart';
      }
      
      // Execute the action
      const actionResponse = await client.post(`/nodes/${node.name}/lxc/${containerId}/status/${apiAction}`, {}, {
        headers: {
          'Cookie': `PVEAuthCookie=${auth.ticket}`,
          'CSRFPreventionToken': auth.CSRFPreventionToken
        }
      });
      
      // Log activity
      await pool.query(
        'INSERT INTO activity_log (user_id, action, target_type, target_id, details, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.session.userId, `container_${action}`, 'container', containerId, `Performed ${action} on container ${containerId} on node ${node.name}`, 'success']
      );
      
      res.json({ 
        success: true, 
        message: `Action ${action} performed on container ${containerId}`,
        taskId: actionResponse.data.data
      });
    } catch (error) {
      console.error(`Error performing action ${action} on container ${containerId}:`, error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      
      // Log failed activity
      await pool.query(
        'INSERT INTO activity_log (user_id, action, target_type, target_id, details, status) VALUES ($1, $2, $3, $4, $5, $6)',
        [req.session.userId, `container_${action}`, 'container', containerId, `Failed to perform ${action} on container ${containerId} on node ${node.name}: ${error.message}`, 'error']
      );
      
      res.status(500).json({ 
        error: 'Failed to perform action',
        message: error.message,
        details: error.response ? error.response.data : null
      });
    }
  } catch (error) {
    console.error('Error handling container action:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Templates management
app.get('/api/templates/vm', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get VM templates from database
    const templatesResult = await pool.query('SELECT * FROM vm_templates');
    const templates = templatesResult.rows;
    
    res.json(templates);
  } catch (error) {
    console.error('Error getting VM templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/templates/vm', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const {
      name,
      description,
      cores,
      memory,
      disk_size,
      os_type,
      os_version
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Insert template into database
    const result = await pool.query(
      `INSERT INTO vm_templates (
        name, description, cores, memory, disk_size, os_type, os_version, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        name,
        description || '',
        cores || 1,
        memory || 1024,
        disk_size || 10,
        os_type || '',
        os_version || '',
        req.session.userId
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating VM template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/templates/lxc', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get LXC templates from database
    const templatesResult = await pool.query('SELECT * FROM lxc_templates');
    const templates = templatesResult.rows;
    
    res.json(templates);
  } catch (error) {
    console.error('Error getting LXC templates:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/templates/lxc', async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const {
      name,
      description,
      cores,
      memory,
      disk_size,
      os_template
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Insert template into database
    const result = await pool.query(
      `INSERT INTO lxc_templates (
        name, description, cores, memory, disk_size, os_template, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        name,
        description || '',
        cores || 1,
        memory || 512,
        disk_size || 5,
        os_template || '',
        req.session.userId
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating LXC template:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    // Insert default Proxmox node if no nodes exist
    return pool.query('SELECT COUNT(*) FROM proxmox_nodes')
      .then(result => {
        const count = parseInt(result.rows[0].count);
        if (count === 0) {
          // Add user's Proxmox node by default
          return pool.query(
            `INSERT INTO proxmox_nodes (
              name, api_host, api_port, api_username, api_password, api_realm,
              ssh_host, ssh_port, ssh_username, ssh_password, use_ssl, verify_ssl
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [
              'pve1',
              'pve1.ionutlab.com',
              8006,
              'root@pam',
              'Poolamea01@',
              'pam',
              'pve1.ionutlab.com',
              22,
              'root@pam',
              'Poolamea01@',
              true,
              false
            ]
          );
        }
      });
  })
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Server initialization error:', error);
    process.exit(1);
  });