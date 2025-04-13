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
app.get('/api/nodes', (req, res) => {
  // Return empty nodes array - user will add nodes manually
  res.json({
    success: true,
    nodes: []
  });
});

// VM data endpoint
app.get('/api/vms', (req, res) => {
  res.json({
    success: true,
    vms: [
      {
        id: 101,
        name: 'web-server',
        status: 'running',
        node: 'pve1',
        cpu: { cores: 2, usage: 0.15 },
        memory: { total: 4096, used: 2150 }, // In MB
        disk: { total: 32, used: 18.5 } // In GB
      },
      {
        id: 102,
        name: 'db-server',
        status: 'running',
        node: 'pve2',
        cpu: { cores: 4, usage: 0.45 },
        memory: { total: 16384, used: 12689 }, // In MB
        disk: { total: 100, used: 76.2 } // In GB
      },
      {
        id: 103,
        name: 'mail-server',
        status: 'stopped',
        node: 'pve1',
        cpu: { cores: 2, usage: 0 },
        memory: { total: 4096, used: 0 }, // In MB
        disk: { total: 50, used: 23.7 } // In GB
      }
    ]
  });
});

// Container data endpoint
app.get('/api/containers', (req, res) => {
  res.json({
    success: true,
    containers: [
      {
        id: 201,
        name: 'nginx-proxy',
        status: 'running',
        node: 'pve1',
        cpu: { cores: 1, usage: 0.08 },
        memory: { total: 1024, used: 512 }, // In MB
        disk: { total: 8, used: 3.2 }, // In GB
        ip: '10.10.10.201'
      },
      {
        id: 202,
        name: 'redis-cache',
        status: 'running',
        node: 'pve2',
        cpu: { cores: 2, usage: 0.24 },
        memory: { total: 4096, used: 3174 }, // In MB
        disk: { total: 16, used: 7.8 }, // In GB
        ip: '10.10.10.202'
      },
      {
        id: 203,
        name: 'monitoring',
        status: 'running',
        node: 'pve3',
        cpu: { cores: 2, usage: 0.15 },
        memory: { total: 2048, used: 1536 }, // In MB
        disk: { total: 20, used: 12.4 }, // In GB
        ip: '10.10.10.203'
      },
      {
        id: 204,
        name: 'dev-env',
        status: 'stopped',
        node: 'pve2',
        cpu: { cores: 2, usage: 0 },
        memory: { total: 4096, used: 0 }, // In MB
        disk: { total: 30, used: 18.6 }, // In GB
        ip: '10.10.10.204'
      }
    ]
  });
});

// Network data endpoint
app.get('/api/network', (req, res) => {
  res.json({
    success: true,
    interfaces: [
      {
        name: 'eth0',
        node: 'pve1',
        ip: '10.55.1.10',
        netmask: '255.255.255.0',
        mac: '00:1A:2B:3C:4D:5E',
        status: 'up',
        trafficIn: '4.5 MB/s',
        trafficOut: '2.8 MB/s'
      },
      {
        name: 'eth1',
        node: 'pve1',
        ip: '192.168.1.10',
        netmask: '255.255.255.0',
        mac: '00:1A:2B:3C:4D:5F',
        status: 'up',
        trafficIn: '1.2 MB/s',
        trafficOut: '0.8 MB/s'
      },
      {
        name: 'eth0',
        node: 'pve2',
        ip: '10.55.1.11',
        netmask: '255.255.255.0',
        mac: '00:2B:3C:4D:5E:6F',
        status: 'up',
        trafficIn: '3.8 MB/s',
        trafficOut: '2.1 MB/s'
      },
      {
        name: 'eth0',
        node: 'pve3',
        ip: '10.55.1.12',
        netmask: '255.255.255.0',
        mac: '00:3C:4D:5E:6F:7G',
        status: 'up',
        trafficIn: '2.5 MB/s',
        trafficOut: '1.7 MB/s'
      }
    ]
  });
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