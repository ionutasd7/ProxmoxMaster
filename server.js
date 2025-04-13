/**
 * Proxmox Manager - Express Server
 * Handles API requests to Proxmox nodes and database operations
 */
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
const axios = require('axios');
const https = require('https');
const { Client } = require('ssh2');
const fs = require('fs');
require('dotenv').config();

// Check environment mode
// NODE_ENV is a common environment variable used to determine the application environment
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
  console.log('Running in development mode');
}

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Configure middleware - IMPORTANT: This must come before route definitions
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to get node details from the database
async function getNodeFromDatabase(nodeId) {
  const nodeResult = await pool.query(
    'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
    [nodeId]
  );
  
  if (nodeResult.rowCount === 0) {
    return null;
  }
  
  const dbNode = nodeResult.rows[0];
  
  return {
    id: dbNode.id,
    name: dbNode.name,
    api_host: dbNode.hostname,
    api_port: dbNode.port || 8006,
    api_username: dbNode.username || 'api@pam!home', // Default to our API user
    api_password: dbNode.password || '8cd15ef7-d25b-4955-9c32-48d42e23b109', // Default password
    api_realm: 'pam',
    use_ssl: true,
    verify_ssl: false
  };
}

// Helper function to authenticate with Proxmox API and get a ticket
async function getProxmoxAuthTicket(node) {
  const protocol = node.use_ssl ? 'https' : 'http';
  // Format username correctly - don't add @realm if it's already included
  const formattedUsername = node.api_username.includes('@') ? 
    node.api_username : `${node.api_username}@${node.api_realm}`;
  
  const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: node.verify_ssl
    }),
    timeout: 8000 // 8 second timeout
  });
  
  try {
    console.log(`Authenticating with Proxmox API on ${node.api_host}:${node.api_port} using ${formattedUsername}`);
    
    // Debug authentication details (sanitized password)
    console.log(`Authentication details: user=${formattedUsername}, password=[REDACTED]`);
    
    // Try different authentication methods
    let authResponse;
    try {
      // Method 1: Form data with proper encoding
      authResponse = await axiosInstance.post(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/access/ticket`,
        `username=${encodeURIComponent(formattedUsername)}&password=${encodeURIComponent(node.api_password)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    } catch (err) {
      console.log('First authentication method failed, trying alternative approach');
      
      // Method 2: JSON data
      authResponse = await axiosInstance.post(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/access/ticket`,
        {
          username: formattedUsername,
          password: node.api_password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log('Authentication successful, got ticket');
    
    return {
      ticket: authResponse.data.data.ticket,
      csrfToken: authResponse.data.data.CSRFPreventionToken
    };
  } catch (err) {
    console.error('Proxmox authentication error:', err);
    throw err;
  }
}

// Add session middleware - IMPORTANT: This must come before route definitions
const session = require('express-session');
app.use(session({
  secret: process.env.SESSION_SECRET || 'proxmox-manager-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// API status endpoint for health check
app.get('/api/status', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Proxmox Manager API is running',
    serverTime: new Date().toISOString()
  });
});

// Get current user from session
app.get('/api/user', (req, res) => {
  if (req.session && req.session.isAuthenticated && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});

// Update user settings
app.put('/api/user', async (req, res) => {
  // Check if user is authenticated
  if (!req.session || !req.session.isAuthenticated || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  const { email, currentPassword, newPassword } = req.body;
  const userId = req.session.user.id;
  
  try {
    // If email is provided, update it
    if (email) {
      await pool.query(
        'UPDATE users SET email = $1 WHERE id = $2',
        [email, userId]
      );
    }
    
    // If changing password
    if (currentPassword && newPassword) {
      // Verify current password
      const user = await pool.query(
        'SELECT password FROM users WHERE id = $1',
        [userId]
      );
      
      if (user.rowCount === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const passwordMatch = await bcrypt.compare(currentPassword, user.rows[0].password);
      
      if (!passwordMatch) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      await pool.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, userId]
      );
    }
    
    // Get updated user data
    const updatedUser = await pool.query(
      'SELECT id, username, email, is_admin, created_at FROM users WHERE id = $1',
      [userId]
    );
    
    if (updatedUser.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update session with new user data
    req.session.user = updatedUser.rows[0];
    
    res.json({ 
      success: true,
      message: 'User settings updated successfully',
      user: updatedUser.rows[0]
    });
  } catch (err) {
    console.error('Error updating user settings:', err);
    res.status(500).json({ error: 'Failed to update user settings' });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Global VMs and containers endpoints (used for dashboard data)
app.get('/api/vms', async (req, res) => {
  try {
    // Get all nodes from database
    const nodesResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes'
    );
    
    if (nodesResult.rowCount === 0) {
      return res.json({
        success: true,
        vms: []
      });
    }
    
    const nodes = nodesResult.rows;
    let allVMs = [];
    
    // For each node, get VMs
    for (const dbNode of nodes) {
      try {
        // Map to expected format for API calls
        const node = {
          name: dbNode.name,
          api_host: dbNode.hostname,
          api_port: dbNode.port || 8006,
          api_username: dbNode.username,
          api_password: dbNode.password,
          api_realm: 'pam',
          use_ssl: true,
          verify_ssl: false
        };
    
        const protocol = node.use_ssl ? 'https' : 'http';
        
        // Create API client
        const axiosInstance = axios.create({
          httpsAgent: new https.Agent({
            rejectUnauthorized: node.verify_ssl
          }),
          timeout: 5000 // 5 second timeout
        });
        
        // Get auth ticket
        const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
        
        // Get VMs from node
        const response = await axiosInstance.get(
          `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/qemu`,
          { 
            headers: {
              'Cookie': `PVEAuthCookie=${ticket}`
            }
          }
        );
        
        const nodeVMs = response.data.data || [];
        
        // Add node information to each VM
        nodeVMs.forEach(vm => {
          vm.node_id = dbNode.id;
          vm.node_name = node.name;
        });
        
        allVMs = [...allVMs, ...nodeVMs];
      } catch (error) {
        console.error(`Error fetching VMs from node ${dbNode.name}:`, error);
        // Continue to next node even if this one fails
      }
    }
    
    res.json({
      success: true,
      vms: allVMs
    });
  } catch (err) {
    console.error('Error fetching all VMs:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch VMs' 
    });
  }
});

app.get('/api/containers', async (req, res) => {
  try {
    // Get all nodes from database
    const nodesResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes'
    );
    
    if (nodesResult.rowCount === 0) {
      return res.json({
        success: true,
        containers: []
      });
    }
    
    const nodes = nodesResult.rows;
    let allContainers = [];
    
    // For each node, get containers
    for (const dbNode of nodes) {
      try {
        // Map to expected format for API calls
        const node = {
          name: dbNode.name,
          api_host: dbNode.hostname,
          api_port: dbNode.port || 8006,
          api_username: dbNode.username,
          api_password: dbNode.password,
          api_realm: 'pam',
          use_ssl: true,
          verify_ssl: false
        };
    
        const protocol = node.use_ssl ? 'https' : 'http';
        
        // Create API client
        const axiosInstance = axios.create({
          httpsAgent: new https.Agent({
            rejectUnauthorized: node.verify_ssl
          }),
          timeout: 5000 // 5 second timeout
        });
        
        // Get auth ticket
        const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
        
        // Get containers from node
        const response = await axiosInstance.get(
          `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/lxc`,
          { 
            headers: {
              'Cookie': `PVEAuthCookie=${ticket}`
            }
          }
        );
        
        const nodeContainers = response.data.data || [];
        
        // Add node information to each container
        nodeContainers.forEach(container => {
          container.node_id = dbNode.id;
          container.node_name = node.name;
        });
        
        allContainers = [...allContainers, ...nodeContainers];
      } catch (error) {
        console.error(`Error fetching containers from node ${dbNode.name}:`, error);
        // Continue to next node even if this one fails
      }
    }
    
    res.json({
      success: true,
      containers: allContainers
    });
  } catch (err) {
    console.error('Error fetching all containers:', err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch containers' 
    });
  }
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Check for admin user in existing users table
    try {
      const adminUser = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        ['admin']
      );

      if (adminUser.rowCount === 0) {
        // Hash password 'admin'
        const hashedPassword = await bcrypt.hash('admin', 10);
        
        // Insert admin user
        await pool.query(
          'INSERT INTO users (username, password, email, is_admin) VALUES ($1, $2, $3, $4)',
          ['admin', hashedPassword, 'admin@example.com', true]
        );
        
        console.log('Admin user created');
      }
    } catch (userErr) {
      console.error('Error with users table, it may not exist yet:', userErr);
      
      // Create users table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(100),
          is_admin BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      
      // Insert admin user
      const hashedPassword = await bcrypt.hash('admin', 10);
      await pool.query(
        'INSERT INTO users (username, password, email, is_admin) VALUES ($1, $2, $3, $4)',
        ['admin', hashedPassword, 'admin@example.com', true]
      );
      
      console.log('Users table created and admin user created');
    }
    
    // Check if template tables exist, create if they don't
    try {
      await pool.query('SELECT COUNT(*) FROM vm_templates');
    } catch (err) {
      // VM templates table doesn't exist, create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS vm_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          cores INTEGER DEFAULT 1,
          memory INTEGER DEFAULT 1024,
          disk_size INTEGER DEFAULT 10,
          os_type VARCHAR(50),
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          user_id INTEGER REFERENCES users(id)
        );
      `);
      console.log('VM templates table created');
    }
    
    // Check if LXC templates table exists
    try {
      await pool.query('SELECT COUNT(*) FROM lxc_templates');
    } catch (err) {
      // LXC templates table doesn't exist, create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS lxc_templates (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          cores INTEGER DEFAULT 1,
          memory INTEGER DEFAULT 512,
          disk_size INTEGER DEFAULT 8,
          template VARCHAR(100),
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          user_id INTEGER REFERENCES users(id)
        );
      `);
      console.log('LXC templates table created');
    }
    
    // Check if nodes table exists, create if it doesn't
    try {
      await pool.query('SELECT COUNT(*) FROM nodes');
    } catch (err) {
      // Nodes table doesn't exist, create it
      await pool.query(`
        CREATE TABLE IF NOT EXISTS nodes (
          id SERIAL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          hostname VARCHAR(255) NOT NULL,
          port INTEGER DEFAULT 8006,
          username VARCHAR(100) NOT NULL,
          password VARCHAR(255) NOT NULL,
          ssl_verify BOOLEAN DEFAULT false,
          node_status VARCHAR(50) DEFAULT 'unknown',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('Nodes table created');
    }

    console.log('Database initialization complete');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

// API Routes

// Authentication routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Query for user
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Remove password from user object
    delete user.password;
    
    // Store user in session
    req.session.user = user;
    req.session.isAuthenticated = true;
    
    res.json({ user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// Node management routes
app.get('/api/nodes', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, hostname, port, username, password, node_status, created_at FROM nodes');
    
    // Map existing schema to expected format in the frontend
    const mappedNodes = result.rows.map(node => ({
      id: node.id,
      name: node.name,
      api_host: node.hostname,
      api_port: node.port || 8006,
      api_username: node.username,
      api_password: node.password,
      api_realm: 'pam',
      ssh_host: node.hostname,
      ssh_port: 22,
      ssh_username: node.username,
      ssh_password: node.password,
      use_ssl: true,
      verify_ssl: node.ssl_verify || false,
      created_at: node.created_at,
      status: node.node_status
    }));
    
    res.json(mappedNodes);
  } catch (err) {
    console.error('Error fetching nodes:', err);
    res.status(500).json({ error: 'Failed to fetch nodes' });
  }
});

app.post('/api/nodes', async (req, res) => {
  const {
    name,
    api_host, // hostname in our db
    api_port, // port in our db
    api_username, // username in our db
    api_password, // password in our db
    api_realm,
    ssh_host,
    ssh_port,
    ssh_username,
    ssh_password,
    use_ssl,
    verify_ssl,
    user_id
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO nodes (
        name, hostname, port, username, password, ssl_verify, created_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, name, hostname, port, username, created_at`,
      [
        name, 
        api_host, // Use api_host as hostname
        api_port || 8006, // Use api_port as port
        api_username, // Use api_username as username
        api_password, // Use api_password as password
        verify_ssl || false // Use verify_ssl as ssl_verify
      ]
    );
    
    // Map to the expected format for the frontend
    const node = result.rows[0];
    const mappedNode = {
      id: node.id,
      name: node.name,
      api_host: node.hostname,
      api_port: node.port || 8006,
      api_username: node.username,
      api_password: null, // Don't send password back to client
      api_realm: 'pam',
      ssh_host: node.hostname,
      ssh_port: 22,
      ssh_username: node.username,
      ssh_password: null, // Don't send password back to client
      use_ssl: true,
      verify_ssl: verify_ssl || false,
      created_at: node.created_at
    };
    
    res.status(201).json(mappedNode);
  } catch (err) {
    console.error('Error adding node:', err);
    res.status(500).json({ error: 'Failed to add node: ' + err.message });
  }
});

app.delete('/api/nodes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM nodes WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting node:', err);
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

// Test connection to Proxmox API
app.post('/api/test-connection', async (req, res) => {
  const { host, port, username, password, realm, ssl, verify } = req.body;
  
  // Validate input
  if (!host || !port || !username || !password) {
    return res.status(400).json({
      success: false, 
      message: 'Missing required connection parameters'
    });
  }
  
  console.log(`Testing connection to ${host}:${port} with credentials: ${username}`);
  
  // Format the username correctly for Proxmox authentication
  // Format is username@realm - do not add @realm if username already contains it
  const formattedUsername = username.includes('@') ? username : `${username}@${realm}`;
  
  // Protocol based on ssl setting
  const protocol = ssl ? 'https' : 'http';
  
  // Create axios instance with appropriate SSL configuration
  const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
      rejectUnauthorized: verify === true
    }),
    timeout: 8000 // 8 second timeout
  });
  
  try {
    // Log sanitized authentication attempt
    console.log('Authenticating with Proxmox API...');
    console.log(`Authentication details: user=${formattedUsername}, password=[REDACTED]`);
    
    // Try different authentication methods
    let authResponse;
    try {
      // Method 1: Form data with proper encoding
      authResponse = await axiosInstance.post(
        `${protocol}://${host}:${port}/api2/json/access/ticket`,
        `username=${encodeURIComponent(formattedUsername)}&password=${encodeURIComponent(password)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
    } catch (firstErr) {
      console.log('First authentication method failed, trying alternative approach');
      
      // Method 2: JSON data
      authResponse = await axiosInstance.post(
        `${protocol}://${host}:${port}/api2/json/access/ticket`,
        {
          username: formattedUsername,
          password: password
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }
    
    console.log('Authentication successful, got ticket');
    
    // Extract the ticket and CSRF token
    const ticket = authResponse.data.data.ticket;
    const csrfToken = authResponse.data.data.CSRFPreventionToken;
    
    // Now make a request using the ticket
    const response = await axiosInstance.get(
      `${protocol}://${host}:${port}/api2/json/version`,
      {
        headers: {
          'Cookie': `PVEAuthCookie=${ticket}`
        }
      }
    );
    
    console.log('Connection successful! Response:', response.data);
    
    res.json({
      success: true,
      message: 'Connection successful!',
      data: response.data
    });
  } catch (err) {
    console.error('API connection error:', err);
    let errorMessage = 'Connection failed';
    
    if (err.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error status:', err.response.status);
      console.error('Response error data:', err.response.data);
      errorMessage = `Status ${err.response.status}: ${err.response.statusText || 'Authentication failed'}`;
      
      // Add more detailed error if available
      if (err.response.data && err.response.data.errors) {
        errorMessage += ` - ${JSON.stringify(err.response.data.errors)}`;
      }
    } else if (err.request) {
      // The request was made but no response was received
      console.error('No response received from server');
      errorMessage = 'No response from server. Please check if the server is reachable.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', err.message);
      errorMessage = err.message;
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
});

// Test SSH connection
app.post('/api/test-ssh', async (req, res) => {
  const { host, port, username, password } = req.body;
  
  // Validate input
  if (!host || !port || !username || !password) {
    return res.status(400).json({
      success: false, 
      message: 'Missing required SSH connection parameters'
    });
  }
  
  const conn = new Client();
  
  conn.on('ready', () => {
    conn.exec('uptime', (err, stream) => {
      if (err) {
        conn.end();
        return res.status(400).json({
          success: false,
          message: 'Failed to execute command on remote server'
        });
      }
      
      let output = '';
      
      stream.on('data', (data) => {
        output += data.toString();
      });
      
      stream.on('end', () => {
        conn.end();
        res.json({
          success: true,
          message: 'SSH connection successful!',
          data: { output }
        });
      });
    });
  });
  
  conn.on('error', (err) => {
    console.error('SSH connection error:', err);
    res.status(400).json({
      success: false,
      message: `SSH connection failed: ${err.message}`
    });
  });
  
  // Set a 5-second timeout for the SSH connection
  conn.on('timeout', () => {
    res.status(408).json({
      success: false,
      message: 'SSH connection timed out'
    });
  });
  
  conn.connect({
    host,
    port,
    username,
    password,
    readyTimeout: 5000, // 5-second timeout
    keepaliveInterval: 2000
  });
});

// Get node details
app.get('/api/nodes/:id', async (req, res) => {
  try {
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password, node_status, created_at FROM nodes WHERE id = $1',
      [req.params.id]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      id: dbNode.id,
      name: dbNode.name,
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      ssh_host: dbNode.hostname,
      ssh_port: 22,
      ssh_username: dbNode.username,
      ssh_password: dbNode.password,
      use_ssl: true,
      verify_ssl: false
    };
    
    // Connect to Proxmox API to get real-time data
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 5000 // 5 second timeout
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Get cluster status
      const clusterResponse = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/cluster/status`,
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      // Get node status
      const nodeResponse = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/status`,
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      res.json({
        node: node,
        cluster: clusterResponse.data.data,
        status: nodeResponse.data.data
      });
    } catch (apiError) {
      console.error('Error connecting to Proxmox API:', apiError);
      
      // Return the node data without Proxmox API data
      res.json({
        node: node,
        cluster: null,
        status: null,
        error: 'Failed to connect to Proxmox API'
      });
    }
  } catch (err) {
    console.error('Error fetching node details:', err);
    res.status(500).json({ error: 'Failed to fetch node details' });
  }
});

// VM management routes
app.get('/api/nodes/:id/vms', async (req, res) => {
  try {
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [req.params.id]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 5000 // 5 second timeout
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Get VMs from node
      const response = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${dbNode.name}/qemu`,
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      res.json(response.data.data || []);
    } catch (apiError) {
      console.error('Error connecting to Proxmox API:', apiError);
      // Return empty array if we can't connect to API
      res.json([]);
    }
  } catch (err) {
    console.error('Error fetching VMs:', err);
    res.status(500).json({ error: 'Failed to fetch VMs' });
  }
});

// VM actions (start, stop, restart)
app.post('/api/nodes/:nodeId/vms/:vmId/:action', async (req, res) => {
  try {
    const { nodeId, vmId, action } = req.params;
    
    // Validate action
    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Supported actions: start, stop, restart' });
    }
    
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [nodeId]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      name: dbNode.name,
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 10000 // Longer timeout for VM operations
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Map our action names to Proxmox API actions
      const proxmoxAction = action === 'restart' ? 'reset' : action;
      
      // Perform the VM action
      const response = await axiosInstance.post(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/qemu/${vmId}/status/${proxmoxAction}`,
        {}, // Empty body, as parameters are in URL
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`,
            'CSRFPreventionToken': csrfToken
          }
        }
      );
      
      res.json({
        success: true,
        message: `VM ${action} operation initiated successfully`,
        data: response.data
      });
    } catch (apiError) {
      console.error(`Error performing VM ${action} operation:`, apiError);
      
      let errorMessage = `Failed to ${action} VM`;
      if (apiError.response && apiError.response.data) {
        errorMessage += `: ${apiError.response.data.message || JSON.stringify(apiError.response.data)}`;
      }
      
      res.status(500).json({ 
        success: false,
        error: errorMessage
      });
    }
  } catch (err) {
    console.error(`Error in VM ${req.params.action} operation:`, err);
    res.status(500).json({ 
      success: false,
      error: `Failed to perform ${req.params.action} operation`
    });
  }
});

// LXC management routes
app.get('/api/nodes/:id/containers', async (req, res) => {
  try {
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [req.params.id]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 5000 // 5 second timeout
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Get LXC containers from node
      const response = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${dbNode.name}/lxc`,
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      res.json(response.data.data || []);
    } catch (apiError) {
      console.error('Error connecting to Proxmox API:', apiError);
      // Return empty array if we can't connect to API
      res.json([]);
    }
  } catch (err) {
    console.error('Error fetching containers:', err);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
});

// LXC container actions (start, stop, restart)
app.post('/api/nodes/:nodeId/containers/:containerId/:action', async (req, res) => {
  try {
    const { nodeId, containerId, action } = req.params;
    
    // Validate action
    if (!['start', 'stop', 'restart'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Supported actions: start, stop, restart' });
    }
    
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [nodeId]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      name: dbNode.name,
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 10000 // Longer timeout for container operations
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Map our action names to Proxmox API actions
      const proxmoxAction = action === 'restart' ? 'reset' : action;
      
      // Perform the container action
      const response = await axiosInstance.post(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/lxc/${containerId}/status/${proxmoxAction}`,
        {}, // Empty body, as parameters are in URL
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`,
            'CSRFPreventionToken': csrfToken
          }
        }
      );
      
      res.json({
        success: true,
        message: `Container ${action} operation initiated successfully`,
        data: response.data
      });
    } catch (apiError) {
      console.error(`Error performing container ${action} operation:`, apiError);
      
      let errorMessage = `Failed to ${action} container`;
      if (apiError.response && apiError.response.data) {
        errorMessage += `: ${apiError.response.data.message || JSON.stringify(apiError.response.data)}`;
      }
      
      res.status(500).json({ 
        success: false,
        error: errorMessage
      });
    }
  } catch (err) {
    console.error(`Error in container ${req.params.action} operation:`, err);
    res.status(500).json({ 
      success: false,
      error: `Failed to perform ${req.params.action} operation`
    });
  }
});

// Template management routes
app.get('/api/templates/vm', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vm_templates');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching VM templates:', err);
    res.status(500).json({ error: 'Failed to fetch VM templates' });
  }
});

app.post('/api/templates/vm', async (req, res) => {
  const {
    name,
    cores,
    memory,
    disk_size,
    os_type,
    description,
    user_id
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO vm_templates (name, cores, memory, disk_size, os_type, description, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, cores, memory, disk_size, os_type, description, user_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding VM template:', err);
    res.status(500).json({ error: 'Failed to add VM template' });
  }
});

app.delete('/api/templates/vm/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vm_templates WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting VM template:', err);
    res.status(500).json({ error: 'Failed to delete VM template' });
  }
});

app.get('/api/templates/lxc', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lxc_templates');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching LXC templates:', err);
    res.status(500).json({ error: 'Failed to fetch LXC templates' });
  }
});

app.post('/api/templates/lxc', async (req, res) => {
  const {
    name,
    cores,
    memory,
    disk_size,
    template,
    description,
    user_id
  } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO lxc_templates (name, cores, memory, disk_size, template, description, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, cores, memory, disk_size, template, description, user_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding LXC template:', err);
    res.status(500).json({ error: 'Failed to add LXC template' });
  }
});

app.delete('/api/templates/lxc/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM lxc_templates WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting LXC template:', err);
    res.status(500).json({ error: 'Failed to delete LXC template' });
  }
});

// Storage management routes
app.get('/api/nodes/:nodeId/storage', async (req, res) => {
  try {
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [req.params.nodeId]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      name: dbNode.name,
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 5000 // 5 second timeout
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Get storage from node
      const response = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/storage`,
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      res.json({
        success: true,
        node: node.name,
        storage: response.data.data || []
      });
    } catch (apiError) {
      console.error('Error connecting to Proxmox API for storage data:', apiError);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch storage data' 
      });
    }
  } catch (err) {
    console.error('Error fetching node storage:', err);
    res.status(500).json({ error: 'Failed to fetch node storage' });
  }
});

// Network management routes
app.get('/api/nodes/:nodeId/network', async (req, res) => {
  try {
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [req.params.nodeId]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      name: dbNode.name,
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 5000 // 5 second timeout
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Get network from node
      const response = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/network`,
        { 
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      res.json({
        success: true,
        node: node.name,
        network: response.data.data || []
      });
    } catch (apiError) {
      console.error('Error connecting to Proxmox API for network data:', apiError);
      res.status(500).json({ 
        success: false,
        error: 'Failed to fetch network data' 
      });
    }
  } catch (err) {
    console.error('Error fetching node network:', err);
    res.status(500).json({ error: 'Failed to fetch node network' });
  }
});

// Monitoring endpoints
app.get('/api/monitoring/node/:id', async (req, res) => {
  try {
    // Get node details from database
    const nodeResult = await pool.query(
      'SELECT id, name, hostname, port, username, password FROM nodes WHERE id = $1',
      [req.params.id]
    );
    
    if (nodeResult.rowCount === 0) {
      return res.status(404).json({ error: 'Node not found' });
    }
    
    const dbNode = nodeResult.rows[0];
    
    // Map to expected format
    const node = {
      name: dbNode.name,
      api_host: dbNode.hostname,
      api_port: dbNode.port || 8006,
      api_username: dbNode.username,
      api_password: dbNode.password,
      api_realm: 'pam',
      use_ssl: true,
      verify_ssl: false
    };
    
    const protocol = node.use_ssl ? 'https' : 'http';
    
    try {
      // Connect to Proxmox API
      const axiosInstance = axios.create({
        httpsAgent: new https.Agent({
          rejectUnauthorized: node.verify_ssl
        }),
        timeout: 5000 // 5 second timeout
      });
      
      // First authenticate to get a ticket
      const { ticket, csrfToken } = await getProxmoxAuthTicket(node);
      
      // Get node RRD data for CPU, memory, network, etc.
      const rrdResponse = await axiosInstance.get(
        `${protocol}://${node.api_host}:${node.api_port}/api2/json/nodes/${node.name}/rrddata`,
        { 
          params: {
            timeframe: 'hour',
            cf: 'AVERAGE'
          },
          headers: {
            'Cookie': `PVEAuthCookie=${ticket}`
          }
        }
      );
      
      // Process and return the monitoring data
      res.json({
        node: node.name,
        data: rrdResponse.data.data || []
      });
    } catch (apiError) {
      console.error('Error connecting to Proxmox API for monitoring data:', apiError);
      // Return empty data if we can't connect to API
      res.json({
        node: node.name,
        data: [],
        error: 'Failed to connect to Proxmox API'
      });
    }
  } catch (err) {
    console.error('Error fetching monitoring data:', err);
    res.status(500).json({ error: 'Failed to fetch monitoring data' });
  }
});

// For any other route, serve the main HTML file (Electron will handle the view)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${port}`);
      console.log('Successfully connected to PostgreSQL database');
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
  });

// Export the app for testing
module.exports = app;