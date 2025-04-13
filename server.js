// Simple server for Proxmox Infrastructure Manager
require('dotenv').config();
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');

// Import database module
const db = require('./db');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
db.initializeDatabase().catch(err => {
  console.error('Failed to initialize database:', err);
});

// Middleware
app.use(express.static(path.join(__dirname, '.')));
app.use(express.json());

// Error handler middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Proxmox Manager API is running' });
});

// Serve test.html for API testing
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'test.html'));
});

// API Authentication endpoint - accepts any credentials for demo purposes
app.post('/api/auth', (req, res) => {
  try {
    const { host, username, password } = req.body;
    
    // Log authentication attempt
    console.log(`Authentication attempt: ${username} connecting to ${host}`);
    
    // Simulate successful auth
    const authData = {
      host,
      username,
      ticket: 'PVE:demo-ticket',
      CSRFPreventionToken: 'demo-csrf-token',
      timestamp: new Date().getTime()
    };
    
    res.json({ success: true, authData });
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Nodes data endpoint
app.get('/api/nodes', async (req, res, next) => {
  try {
    const nodes = await db.nodeDB.getAllNodes();
    res.json({
      success: true,
      nodes: nodes
    });
  } catch (error) {
    next(error);
  }
});

// Add node endpoint
app.post('/api/nodes', async (req, res, next) => {
  try {
    const node = await db.nodeDB.createNode(req.body);
    res.status(201).json({
      success: true,
      node: node
    });
  } catch (error) {
    next(error);
  }
});

// Update node endpoint
app.put('/api/nodes/:id', async (req, res, next) => {
  try {
    const node = await db.nodeDB.updateNode(req.params.id, req.body);
    if (!node) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }
    res.json({
      success: true,
      node: node
    });
  } catch (error) {
    next(error);
  }
});

// Delete node endpoint
app.delete('/api/nodes/:id', async (req, res, next) => {
  try {
    const success = await db.nodeDB.deleteNode(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// VM data endpoint
app.get('/api/vms', async (req, res, next) => {
  try {
    const nodes = await db.nodeDB.getAllNodes();
    const allVMs = [];
    
    // Get VMs from all nodes
    for (const node of nodes) {
      try {
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: node.ssl_verify
        });
        
        const url = `https://${node.hostname}:${node.port}/api2/json/nodes/${node.name}/qemu`;
        const authData = {
          username: node.username,
          password: node.password
        };
        
        // First authenticate to get ticket
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(authData.username)}&password=${encodeURIComponent(authData.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket } = authResponse.data.data;
          
          // Now get VMs with the ticket
          const vmResponse = await axios.get(url, {
            headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
            httpsAgent: agent
          });
          
          if (vmResponse.data && vmResponse.data.data) {
            // Transform VM data to match our application's format
            const vms = vmResponse.data.data.map(vm => ({
              id: vm.vmid,
              name: vm.name,
              status: vm.status,
              node: node.name,
              cpu: { cores: vm.cpus || 1, usage: vm.cpu || 0 },
              memory: { total: vm.maxmem, used: vm.mem }, // In bytes
              disk: { total: vm.maxdisk / (1024 * 1024 * 1024), used: vm.disk / (1024 * 1024 * 1024) } // Convert to GB
            }));
            
            allVMs.push(...vms);
          }
        }
      } catch (nodeError) {
        console.error(`Error fetching VMs from node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    res.json({
      success: true,
      vms: allVMs
    });
  } catch (error) {
    next(error);
  }
});

// Container data endpoint
app.get('/api/containers', async (req, res, next) => {
  try {
    const nodes = await db.nodeDB.getAllNodes();
    const allContainers = [];
    
    // Get containers from all nodes
    for (const node of nodes) {
      try {
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: node.ssl_verify
        });
        
        const url = `https://${node.hostname}:${node.port}/api2/json/nodes/${node.name}/lxc`;
        const authData = {
          username: node.username,
          password: node.password
        };
        
        // First authenticate to get ticket
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(authData.username)}&password=${encodeURIComponent(authData.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket } = authResponse.data.data;
          
          // Now get containers with the ticket
          const containerResponse = await axios.get(url, {
            headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
            httpsAgent: agent
          });
          
          if (containerResponse.data && containerResponse.data.data) {
            // Transform container data to match our application's format
            const containers = containerResponse.data.data.map(container => ({
              id: container.vmid,
              name: container.name,
              status: container.status,
              node: node.name,
              cpu: { cores: container.cpus || 1, usage: container.cpu || 0 },
              memory: { 
                total: container.maxmem / (1024 * 1024), // Convert bytes to MB
                used: container.mem / (1024 * 1024) 
              },
              disk: { 
                total: container.maxdisk / (1024 * 1024 * 1024), // Convert bytes to GB
                used: container.disk / (1024 * 1024 * 1024) 
              },
              ip: container.ip || 'N/A'
            }));
            
            allContainers.push(...containers);
          }
        }
      } catch (nodeError) {
        console.error(`Error fetching containers from node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    res.json({
      success: true,
      containers: allContainers
    });
  } catch (error) {
    next(error);
  }
});

// Network data endpoint
app.get('/api/network', async (req, res, next) => {
  try {
    const nodes = await db.nodeDB.getAllNodes();
    const allInterfaces = [];
    
    // Get network interfaces from all nodes
    for (const node of nodes) {
      try {
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: node.ssl_verify
        });
        
        const url = `https://${node.hostname}:${node.port}/api2/json/nodes/${node.name}/network`;
        const authData = {
          username: node.username,
          password: node.password
        };
        
        // First authenticate to get ticket
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(authData.username)}&password=${encodeURIComponent(authData.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket } = authResponse.data.data;
          
          // Now get network interfaces with the ticket
          const networkResponse = await axios.get(url, {
            headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
            httpsAgent: agent
          });
          
          if (networkResponse.data && networkResponse.data.data) {
            // Transform network data to match our application's format
            const interfaces = networkResponse.data.data
              .filter(iface => iface.type === 'eth' || iface.type === 'bridge')
              .map(iface => ({
                name: iface.iface,
                node: node.name,
                ip: iface.address || 'N/A',
                netmask: iface.netmask || 'N/A',
                mac: iface.hwaddr || 'N/A',
                status: iface.active ? 'up' : 'down',
                type: iface.type,
                trafficIn: '- MB/s', // Traffic data isn't available in this endpoint
                trafficOut: '- MB/s'  // We would need to use node-specific commands to get this
              }));
            
            allInterfaces.push(...interfaces);
          }
        }
      } catch (nodeError) {
        console.error(`Error fetching network interfaces from node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    res.json({
      success: true,
      interfaces: allInterfaces
    });
  } catch (error) {
    next(error);
  }
});

// Updates data endpoint
app.get('/api/updates', (req, res) => {
  res.json({
    success: true,
    updates: {
      node: [
        { package: 'pve-kernel-5.15', currentVersion: '5.15.102-1', newVersion: '5.15.107-1', priority: 'security', type: 'Kernel' },
        { package: 'openssl', currentVersion: '3.0.9-1', newVersion: '3.0.11-1', priority: 'security', type: 'System' },
        { package: 'qemu-server', currentVersion: '7.2.0-3', newVersion: '7.2.0-5', priority: 'important', type: 'System' }
      ],
      vms: [
        { id: 101, name: 'web-server', status: 'running', package: 'linux-image-generic', currentVersion: '5.15.0-78', newVersion: '5.15.0-82', priority: 'security' },
        { id: 101, name: 'web-server', status: 'running', package: 'openssl', currentVersion: '3.0.2-0ubuntu1.9', newVersion: '3.0.2-0ubuntu1.10', priority: 'security' },
        { id: 102, name: 'db-server', status: 'running', package: 'mysql-server', currentVersion: '8.0.32-0ubuntu0.22.04.2', newVersion: '8.0.34-0ubuntu0.22.04.1', priority: 'important' }
      ],
      containers: [
        { id: 201, name: 'nginx-proxy', status: 'running', package: 'nginx', currentVersion: '1.22.1-1~bookworm', newVersion: '1.24.0-2~bookworm', priority: 'important' },
        { id: 201, name: 'nginx-proxy', status: 'running', package: 'openssl', currentVersion: '3.0.9-1', newVersion: '3.0.11-1', priority: 'security' },
        { id: 202, name: 'redis-cache', status: 'running', package: 'redis-server', currentVersion: '6:7.0.11-1~deb12u1', newVersion: '6:7.0.15-1~deb12u1', priority: 'security' }
      ]
    }
  });
});

// VM Templates API endpoints
app.get('/api/templates/vm', async (req, res, next) => {
  try {
    const templates = await db.vmTemplateDB.getAllVMTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

app.get('/api/templates/vm/:id', async (req, res, next) => {
  try {
    const template = await db.vmTemplateDB.getVMTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    next(error);
  }
});

app.post('/api/templates/vm', async (req, res, next) => {
  try {
    const templateData = {
      name: req.body.name,
      profile_type: req.body.profile_type,
      cores: req.body.cores,
      memory: req.body.memory,
      disk: req.body.disk,
      template_description: req.body.template_description || ''
    };
    
    const template = await db.vmTemplateDB.createVMTemplate(templateData);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

app.put('/api/templates/vm/:id', async (req, res, next) => {
  try {
    const templateData = {
      name: req.body.name,
      profile_type: req.body.profile_type,
      cores: req.body.cores,
      memory: req.body.memory,
      disk: req.body.disk,
      template_description: req.body.template_description || ''
    };
    
    const template = await db.vmTemplateDB.updateVMTemplate(req.params.id, templateData);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/templates/vm/:id', async (req, res, next) => {
  try {
    const success = await db.vmTemplateDB.deleteVMTemplate(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// LXC Templates API endpoints
app.get('/api/templates/lxc', async (req, res, next) => {
  try {
    const templates = await db.lxcTemplateDB.getAllLXCTemplates();
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

app.get('/api/templates/lxc/:id', async (req, res, next) => {
  try {
    const template = await db.lxcTemplateDB.getLXCTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    next(error);
  }
});

app.post('/api/templates/lxc', async (req, res, next) => {
  try {
    const templateData = {
      name: req.body.name,
      profile_type: req.body.profile_type,
      cores: req.body.cores,
      memory: req.body.memory,
      swap: req.body.swap,
      disk: req.body.disk,
      template_description: req.body.template_description || ''
    };
    
    const template = await db.lxcTemplateDB.createLXCTemplate(templateData);
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

app.put('/api/templates/lxc/:id', async (req, res, next) => {
  try {
    const templateData = {
      name: req.body.name,
      profile_type: req.body.profile_type,
      cores: req.body.cores,
      memory: req.body.memory,
      swap: req.body.swap,
      disk: req.body.disk,
      template_description: req.body.template_description || ''
    };
    
    const template = await db.lxcTemplateDB.updateLXCTemplate(req.params.id, templateData);
    if (!template) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json(template);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/templates/lxc/:id', async (req, res, next) => {
  try {
    const success = await db.lxcTemplateDB.deleteLXCTemplate(req.params.id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Serve the main HTML file for all other paths
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});