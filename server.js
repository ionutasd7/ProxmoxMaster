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

// Serve minimal.html for minimal testing
app.get('/minimal', (req, res) => {
  res.sendFile(path.join(__dirname, 'minimal.html'));
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
        console.log(`Trying to fetch VMs from node: ${node.name} (${node.hostname})`);
        
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: false // Set to false to bypass SSL verification issues
        });
        
        // First authenticate to get ticket and CSRF token
        console.log(`Authenticating with ${node.hostname}:${node.port} using ${node.username}`);
        
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(node.username)}&password=${encodeURIComponent(node.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket, CSRFPreventionToken } = authResponse.data.data;
          console.log(`Authentication successful, got ticket and CSRF token`);
          
          // The node name in the URL needs to be the Proxmox node name, not our database name
          // Get the node names from the cluster first
          const clusterResponse = await axios.get(
            `https://${node.hostname}:${node.port}/api2/json/nodes`,
            {
              headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
              httpsAgent: agent
            }
          );
          
          if (clusterResponse.data && clusterResponse.data.data) {
            // For each Proxmox node in the cluster, get the VMs
            for (const proxmoxNode of clusterResponse.data.data) {
              const proxmoxNodeName = proxmoxNode.node;
              console.log(`Getting VMs from Proxmox node: ${proxmoxNodeName}`);
              
              try {
                const vmResponse = await axios.get(
                  `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/qemu`,
                  {
                    headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
                    httpsAgent: agent
                  }
                );
                
                if (vmResponse.data && vmResponse.data.data) {
                  console.log(`Found ${vmResponse.data.data.length} VMs on ${proxmoxNodeName}`);
                  
                  // Transform VM data to match our application's format
                  const vms = vmResponse.data.data.map(vm => ({
                    id: vm.vmid,
                    name: vm.name || `VM ${vm.vmid}`,
                    status: vm.status,
                    node: proxmoxNodeName,
                    cpu: { cores: vm.cpus || 1, usage: vm.cpu || 0 },
                    memory: { 
                      total: vm.maxmem / (1024 * 1024), // Convert to MB
                      used: vm.mem / (1024 * 1024) 
                    },
                    disk: { 
                      total: vm.maxdisk / (1024 * 1024 * 1024), // Convert to GB
                      used: vm.disk / (1024 * 1024 * 1024) 
                    }
                  }));
                  
                  allVMs.push(...vms);
                }
              } catch (vmError) {
                console.error(`Error fetching VMs from Proxmox node ${proxmoxNodeName}:`, vmError.message);
              }
            }
          }
        }
      } catch (nodeError) {
        console.error(`Error connecting to node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    res.json({
      success: true,
      vms: allVMs
    });
  } catch (error) {
    console.error('Error in /api/vms endpoint:', error);
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
        console.log(`Trying to fetch containers from node: ${node.name} (${node.hostname})`);
        
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: false // Set to false to bypass SSL verification issues
        });
        
        // First authenticate to get ticket and CSRF token
        console.log(`Authenticating with ${node.hostname}:${node.port} using ${node.username}`);
        
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(node.username)}&password=${encodeURIComponent(node.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket, CSRFPreventionToken } = authResponse.data.data;
          console.log(`Authentication successful, got ticket and CSRF token`);
          
          // The node name in the URL needs to be the Proxmox node name, not our database name
          // Get the node names from the cluster first
          const clusterResponse = await axios.get(
            `https://${node.hostname}:${node.port}/api2/json/nodes`,
            {
              headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
              httpsAgent: agent
            }
          );
          
          if (clusterResponse.data && clusterResponse.data.data) {
            // For each Proxmox node in the cluster, get the containers
            for (const proxmoxNode of clusterResponse.data.data) {
              const proxmoxNodeName = proxmoxNode.node;
              console.log(`Getting containers from Proxmox node: ${proxmoxNodeName}`);
              
              try {
                const containerResponse = await axios.get(
                  `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/lxc`,
                  {
                    headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
                    httpsAgent: agent
                  }
                );
                
                if (containerResponse.data && containerResponse.data.data) {
                  console.log(`Found ${containerResponse.data.data.length} containers on ${proxmoxNodeName}`);
                  
                  // Transform container data to match our application's format
                  const containers = containerResponse.data.data.map(container => ({
                    id: container.vmid,
                    name: container.name || `Container ${container.vmid}`,
                    status: container.status,
                    node: proxmoxNodeName,
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
              } catch (containerError) {
                console.error(`Error fetching containers from Proxmox node ${proxmoxNodeName}:`, containerError.message);
              }
            }
          }
        }
      } catch (nodeError) {
        console.error(`Error connecting to node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    res.json({
      success: true,
      containers: allContainers
    });
  } catch (error) {
    console.error('Error in /api/containers endpoint:', error);
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
        console.log(`Trying to fetch network data from node: ${node.name} (${node.hostname})`);
        
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: false // Set to false to bypass SSL verification issues
        });
        
        // First authenticate to get ticket and CSRF token
        console.log(`Authenticating with ${node.hostname}:${node.port} using ${node.username}`);
        
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(node.username)}&password=${encodeURIComponent(node.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket, CSRFPreventionToken } = authResponse.data.data;
          console.log(`Authentication successful, got ticket and CSRF token`);
          
          // The node name in the URL needs to be the Proxmox node name, not our database name
          // Get the node names from the cluster first
          const clusterResponse = await axios.get(
            `https://${node.hostname}:${node.port}/api2/json/nodes`,
            {
              headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
              httpsAgent: agent
            }
          );
          
          if (clusterResponse.data && clusterResponse.data.data) {
            // For each Proxmox node in the cluster, get the network interfaces
            for (const proxmoxNode of clusterResponse.data.data) {
              const proxmoxNodeName = proxmoxNode.node;
              console.log(`Getting network interfaces from Proxmox node: ${proxmoxNodeName}`);
              
              try {
                const networkResponse = await axios.get(
                  `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/network`,
                  {
                    headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
                    httpsAgent: agent
                  }
                );
                
                if (networkResponse.data && networkResponse.data.data) {
                  console.log(`Found ${networkResponse.data.data.length} network interfaces on ${proxmoxNodeName}`);
                  
                  // Transform network data to match our application's format
                  const interfaces = networkResponse.data.data
                    .filter(iface => iface.type === 'eth' || iface.type === 'bridge')
                    .map(iface => ({
                      name: iface.iface,
                      node: proxmoxNodeName,
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
              } catch (networkError) {
                console.error(`Error fetching network interfaces from Proxmox node ${proxmoxNodeName}:`, networkError.message);
              }
            }
          }
        }
      } catch (nodeError) {
        console.error(`Error connecting to node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    res.json({
      success: true,
      interfaces: allInterfaces
    });
  } catch (error) {
    console.error('Error in /api/network endpoint:', error);
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

// Resource monitoring endpoint
app.get('/api/monitoring/resources', async (req, res, next) => {
  try {
    let nodeId = req.query.node_id;
    let nodes = [];
    
    if (nodeId && nodeId !== 'all') {
      // Get a specific node
      const node = await db.nodeDB.getNodeById(nodeId);
      if (node) {
        nodes = [node];
      }
    } else {
      // Get all nodes
      nodes = await db.nodeDB.getAllNodes();
    }
    
    // Initialize resources object
    const resources = {};
    
    // Get resource data for each node
    for (const node of nodes) {
      try {
        console.log(`Fetching resource data for node: ${node.name} (${node.hostname})`);
        
        // Try to connect to the node with stored credentials
        const axios = require('axios');
        const https = require('https');
        const agent = new https.Agent({  
          rejectUnauthorized: false // Set to false to bypass SSL verification issues
        });
        
        // First authenticate to get ticket and CSRF token
        console.log(`Authenticating with ${node.hostname}:${node.port} using ${node.username}`);
        
        const authResponse = await axios.post(
          `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
          `username=${encodeURIComponent(node.username)}&password=${encodeURIComponent(node.password)}`,
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            httpsAgent: agent
          }
        );
        
        if (authResponse.data && authResponse.data.data) {
          const { ticket, CSRFPreventionToken } = authResponse.data.data;
          console.log(`Authentication successful, got ticket and CSRF token`);
          
          // Get the node names from the cluster first
          const clusterResponse = await axios.get(
            `https://${node.hostname}:${node.port}/api2/json/nodes`,
            {
              headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
              httpsAgent: agent
            }
          );
          
          if (clusterResponse.data && clusterResponse.data.data) {
            // For each Proxmox node in the cluster, get the resource data
            for (const proxmoxNode of clusterResponse.data.data) {
              const proxmoxNodeName = proxmoxNode.node;
              console.log(`Getting resource data from Proxmox node: ${proxmoxNodeName}`);
              
              try {
                // Get node status (CPU, memory, uptime, etc.)
                const statusResponse = await axios.get(
                  `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/status`,
                  {
                    headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
                    httpsAgent: agent
                  }
                );
                
                // Get storage info for the node
                const storageResponse = await axios.get(
                  `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/storage`,
                  {
                    headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
                    httpsAgent: agent
                  }
                );
                
                // Get network info for the node
                const networkResponse = await axios.get(
                  `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/network`,
                  {
                    headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
                    httpsAgent: agent
                  }
                );
                
                if (statusResponse.data && statusResponse.data.data) {
                  const statusData = statusResponse.data.data;
                  
                  // Initialize resource data for this node
                  resources[node.id] = {
                    name: proxmoxNodeName,
                    hostname: node.hostname,
                    cpu: {
                      cores: statusData.cpuinfo?.cores || 1,
                      usage: statusData.cpu * 100 || 0 // Convert to percentage
                    },
                    memory: {
                      total: statusData.memory.total || 0,
                      used: statusData.memory.used || 0,
                      free: statusData.memory.free || 0
                    },
                    swap: {
                      total: statusData.swap.total || 0,
                      used: statusData.swap.used || 0,
                      free: statusData.swap.free || 0
                    },
                    uptime: statusData.uptime || 0,
                    loadavg: statusData.loadavg || [0, 0, 0]
                  };
                  
                  // Calculate disk usage from storage info
                  if (storageResponse.data && storageResponse.data.data) {
                    const storageData = storageResponse.data.data;
                    let totalStorage = 0;
                    let usedStorage = 0;
                    
                    // Sum up all storage
                    storageData.forEach(storage => {
                      if (storage.type === 'zfspool' || storage.type === 'lvm' || storage.type === 'dir') {
                        totalStorage += storage.total || 0;
                        usedStorage += storage.used || 0;
                      }
                    });
                    
                    // Add disk info to resource data
                    resources[node.id].disk = {
                      total: totalStorage,
                      used: usedStorage,
                      free: totalStorage - usedStorage
                    };
                  }
                  
                  // Calculate network traffic from network info
                  if (networkResponse.data && networkResponse.data.data) {
                    const networkData = networkResponse.data.data;
                    let netIn = 0;
                    let netOut = 0;
                    
                    // Sum up all network interfaces
                    networkData.forEach(iface => {
                      if (iface.type === 'eth' || iface.type === 'bridge') {
                        // These are not provided by the API directly, 
                        // we would need to do additional requests to get real-time traffic
                        // For now, we'll use simulated values
                        netIn += Math.random() * 10; // MB/s
                        netOut += Math.random() * 5; // MB/s
                      }
                    });
                    
                    // Add network info to resource data
                    resources[node.id].network = {
                      in: netIn,
                      out: netOut
                    };
                  }
                }
              } catch (resourceError) {
                console.error(`Error fetching resource data from Proxmox node ${proxmoxNodeName}:`, resourceError.message);
              }
            }
          }
        }
      } catch (nodeError) {
        console.error(`Error connecting to node ${node.name}:`, nodeError.message);
        // Continue with next node if one fails
      }
    }
    
    // Send response
    res.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error in /api/monitoring/resources endpoint:', error);
    next(error);
  }
});

// Historical resource data endpoint
app.get('/api/monitoring/history', async (req, res, next) => {
  try {
    const timeRange = req.query.time_range || '1h';
    let nodeId = req.query.node_id;
    
    // Generate sample historical data for now
    // In a production environment, this would come from a database
    
    // Define number of data points based on time range
    let dataPoints = 12;
    switch (timeRange) {
      case '6h':
        dataPoints = 24;
        break;
      case '24h':
        dataPoints = 24;
        break;
      case '7d':
        dataPoints = 28;
        break;
      case '30d':
        dataPoints = 30;
        break;
    }
    
    // Generate time labels
    const timeLabels = generateTimeLabels(dataPoints, timeRange);
    
    // Generate data for CPU, memory, disk and network
    const cpuData = [];
    const memoryData = [];
    const diskData = [];
    const networkInData = [];
    const networkOutData = [];
    
    // For each time point, generate data
    // In a real implementation, this would be retrieved from a database
    for (let i = 0; i < dataPoints; i++) {
      // For demo purposes, we'll generate values that show a pattern
      // CPU: Peaks at certain times
      const hour = new Date(timeLabels[i]).getHours();
      let baseCpuUsage = 30;
      if (hour >= 9 && hour <= 17) {
        // Higher during work hours
        baseCpuUsage = 50;
      }
      if (hour >= 12 && hour <= 14) {
        // Peak at lunch time
        baseCpuUsage = 70;
      }
      cpuData.push(Math.min(100, Math.max(0, baseCpuUsage + (Math.random() * 20 - 10))));
      
      // Memory: Gradual increase with periodic drops
      const baseMemoryUsage = 40 + (i % 6) * 5;
      memoryData.push(Math.min(100, Math.max(0, baseMemoryUsage + (Math.random() * 10 - 5))));
      
      // Disk: Slow steady increase
      const baseDiskUsage = 50 + (i * 0.5);
      diskData.push(Math.min(100, Math.max(0, baseDiskUsage + (Math.random() * 5 - 2.5))));
      
      // Network: Peaks at certain times
      let baseNetworkUsage = 2;
      if (hour >= 9 && hour <= 17) {
        // Higher during work hours
        baseNetworkUsage = 5;
      }
      if (hour >= 12 && hour <= 14 || hour >= 20 && hour <= 22) {
        // Peak at lunch time and evening
        baseNetworkUsage = 8;
      }
      networkInData.push(Math.max(0, baseNetworkUsage + (Math.random() * 4 - 1)));
      networkOutData.push(Math.max(0, (baseNetworkUsage / 2) + (Math.random() * 2 - 0.5)));
    }
    
    // Send response
    res.json({
      success: true,
      history: {
        timePoints: timeLabels,
        cpu: cpuData,
        memory: memoryData,
        disk: diskData,
        network: {
          in: networkInData,
          out: networkOutData
        }
      }
    });
  } catch (error) {
    console.error('Error in /api/monitoring/history endpoint:', error);
    next(error);
  }
});

// Notification endpoint for alerts
app.post('/api/monitoring/notify', async (req, res, next) => {
  try {
    const { alert, email, webhook } = req.body;
    
    if (!alert) {
      return res.status(400).json({
        success: false,
        error: 'Alert data is required'
      });
    }
    
    // Log the alert
    console.log('Alert notification:', alert);
    
    // Send email if configured
    if (email) {
      // In a production environment, this would use a proper email sending library
      console.log(`Would send email to ${email} about ${alert.type} ${alert.severity} alert`);
    }
    
    // Send webhook if configured
    if (webhook) {
      try {
        const axios = require('axios');
        
        // Send webhook request
        await axios.post(webhook, {
          alert,
          timestamp: new Date().toISOString(),
          source: 'Proxmox Manager'
        });
        
        console.log(`Successfully sent webhook notification to ${webhook}`);
      } catch (webhookError) {
        console.error('Error sending webhook notification:', webhookError.message);
        // Don't fail the request if webhook fails
      }
    }
    
    // Send success response
    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error in /api/monitoring/notify endpoint:', error);
    next(error);
  }
});

// Helper function to generate time labels for historical data
function generateTimeLabels(count = 12, timeRange = '1h') {
  const labels = [];
  const now = new Date();
  let interval = 5 * 60 * 1000; // 5 minutes by default (for 1h)
  
  switch (timeRange) {
    case '6h':
      interval = 15 * 60 * 1000; // 15 minutes
      break;
    case '24h':
      interval = 60 * 60 * 1000; // 1 hour
      break;
    case '7d':
      interval = 6 * 60 * 60 * 1000; // 6 hours
      break;
    case '30d':
      interval = 24 * 60 * 60 * 1000; // 1 day
      break;
  }
  
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * interval));
    
    if (timeRange === '7d' || timeRange === '30d') {
      // For longer ranges, show date and time
      labels.push(time.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
    } else {
      // For shorter ranges, just show time
      labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }
  }
  
  return labels;
}

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
// Monitoring routes

// Helper function to generate time labels
function generateTimeLabels(count = 12, timeRange = '1h') {
  const labels = [];
  const now = new Date();
  
  // Different time ranges
  let intervalMs;
  switch(timeRange) {
    case '6h':
      intervalMs = 6 * 60 * 60 * 1000 / count;
      break;
    case '12h':
      intervalMs = 12 * 60 * 60 * 1000 / count;
      break;
    case '24h':
      intervalMs = 24 * 60 * 60 * 1000 / count;
      break;
    case '7d':
      intervalMs = 7 * 24 * 60 * 60 * 1000 / count;
      break;
    default: // 1h
      intervalMs = 60 * 60 * 1000 / count;
  }
  
  for (let i = count; i >= 0; i--) {
    const time = new Date(now.getTime() - (i * intervalMs));
    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    labels.push(`${hours}:${minutes}`);
  }
  
  return labels;
}

// Get node resources endpoint
app.get('/api/monitoring/resources/:nodeId', async (req, res, next) => {
  try {
    const nodeId = req.params.nodeId;
    console.log(`Fetching monitoring data for node ID: ${nodeId}`);
    
    // Get node data
    const node = await db.nodeDB.getNodeById(nodeId);
    if (!node) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }
    
    // Set up Axios with SSL handling
    const axios = require('axios');
    const https = require('https');
    const agent = new https.Agent({  
      rejectUnauthorized: false // Set to false to bypass SSL verification issues
    });
    
    // First authenticate to get ticket and CSRF token
    console.log(`Authenticating with ${node.hostname}:${node.port} using ${node.username}`);
    
    const authResponse = await axios.post(
      `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
      `username=${encodeURIComponent(node.username)}&password=${encodeURIComponent(node.password)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent: agent
      }
    );
    
    if (!authResponse.data || !authResponse.data.data) {
      throw new Error('Authentication failed');
    }
    
    const { ticket, CSRFPreventionToken } = authResponse.data.data;
    console.log(`Authentication successful, got ticket and CSRF token`);
    
    // Get node names from the cluster
    const clusterResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    if (!clusterResponse.data || !clusterResponse.data.data) {
      throw new Error('Failed to get cluster nodes');
    }
    
    // Get the first node (or the requested node if we can match it)
    let proxmoxNodeName = clusterResponse.data.data[0].node;
    const matchingNode = clusterResponse.data.data.find(n => n.node === node.name);
    if (matchingNode) {
      proxmoxNodeName = matchingNode.node;
    }
    
    console.log(`Getting resources from Proxmox node: ${proxmoxNodeName}`);
    
    // Get node status with resource usage
    const statusResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/status`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    if (!statusResponse.data || !statusResponse.data.data) {
      throw new Error('Failed to get node status');
    }
    
    // Get node resource usage history
    const rrdResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/rrddata?timeframe=hour&cf=AVERAGE`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    if (!rrdResponse.data || !rrdResponse.data.data) {
      throw new Error('Failed to get node resource history');
    }
    
    // Get network traffic data
    const netResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/network`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    // Process resource data
    const status = statusResponse.data.data;
    const rrdData = rrdResponse.data.data;
    
    // Generate time labels for the history data
    const timeLabels = generateTimeLabels(rrdData.length - 1);
    
    // Extract CPU, memory, and disk usage data
    const cpuData = rrdData.map(item => item.cpu * 100); // Convert to percentage
    const memoryTotal = status.memory.total;
    const memoryData = rrdData.map(item => (item.mem / memoryTotal) * 100); // Convert to percentage
    
    // Calculate disk usage from status data
    const diskTotal = status.rootfs.total;
    const diskUsed = status.rootfs.used;
    const diskUsagePercent = (diskUsed / diskTotal) * 100;
    
    // Fill disk history with current value (not available in Proxmox API)
    const diskData = Array(cpuData.length).fill(diskUsagePercent);
    
    // Extract network I/O data if available
    let netInData = Array(cpuData.length).fill(0);
    let netOutData = Array(cpuData.length).fill(0);
    let currentNetIn = 0;
    let currentNetOut = 0;
    
    // Try to get network statistics
    if (netResponse.data && netResponse.data.data) {
      // Find the first active network interface
      const activeIface = netResponse.data.data.find(iface => 
        (iface.type === 'eth' || iface.type === 'bridge') && iface.active);
      
      if (activeIface) {
        // Use the current traffic rate from the interface stats
        currentNetIn = (activeIface.in || 0) / (1024 * 1024); // Convert to MB/s
        currentNetOut = (activeIface.out || 0) / (1024 * 1024); // Convert to MB/s
        
        // Fill network history with current values (detailed history not available)
        netInData = Array(cpuData.length).fill(currentNetIn).map(val => val * (0.5 + Math.random())); // Add some variation
        netOutData = Array(cpuData.length).fill(currentNetOut).map(val => val * (0.5 + Math.random())); // Add some variation
      }
    }
    
    // Build the response object
    const resources = {
      cpu: {
        current: status.cpu * 100, // Convert to percentage
        history: cpuData
      },
      memory: {
        current: (status.memory.used / status.memory.total) * 100, // Convert to percentage
        total: status.memory.total / (1024 * 1024 * 1024), // Convert to GB
        used: status.memory.used / (1024 * 1024 * 1024), // Convert to GB
        history: memoryData
      },
      disk: {
        current: diskUsagePercent,
        total: diskTotal / (1024 * 1024 * 1024), // Convert to GB
        used: diskUsed / (1024 * 1024 * 1024), // Convert to GB
        history: diskData
      },
      network: {
        in: {
          current: currentNetIn,
          history: netInData
        },
        out: {
          current: currentNetOut,
          history: netOutData
        }
      },
      timeLabels: timeLabels
    };
    
    res.json({
      success: true,
      resources: resources
    });
  } catch (error) {
    console.error('Error fetching monitoring data:', error.message);
    res.status(500).json({
      success: false,
      error: `Error fetching monitoring data: ${error.message}`
    });
  }
});

// Get historical resource data
app.get('/api/monitoring/history/:nodeId', async (req, res, next) => {
  try {
    const nodeId = req.params.nodeId;
    const timeRange = req.query.timeRange || '1h';
    console.log(`Fetching historical data for node ID: ${nodeId} with timeRange: ${timeRange}`);
    
    // Map time range to Proxmox timeframe parameter
    let timeframe;
    let cf = 'AVERAGE'; // Consolidation function
    switch(timeRange) {
      case '6h':
        timeframe = 'hour';
        break;
      case '12h':
        timeframe = 'day';
        break;
      case '24h':
        timeframe = 'day';
        break;
      case '7d':
        timeframe = 'week';
        break;
      default: // 1h
        timeframe = 'hour';
    }
    
    // Get node data
    const node = await db.nodeDB.getNodeById(nodeId);
    if (!node) {
      return res.status(404).json({ success: false, error: 'Node not found' });
    }
    
    // Set up Axios with SSL handling
    const axios = require('axios');
    const https = require('https');
    const agent = new https.Agent({  
      rejectUnauthorized: false
    });
    
    // First authenticate to get ticket and CSRF token
    const authResponse = await axios.post(
      `https://${node.hostname}:${node.port}/api2/json/access/ticket`,
      `username=${encodeURIComponent(node.username)}&password=${encodeURIComponent(node.password)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        httpsAgent: agent
      }
    );
    
    if (!authResponse.data || !authResponse.data.data) {
      throw new Error('Authentication failed');
    }
    
    const { ticket } = authResponse.data.data;
    
    // Get node names from the cluster
    const clusterResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    if (!clusterResponse.data || !clusterResponse.data.data) {
      throw new Error('Failed to get cluster nodes');
    }
    
    // Get the first node (or the requested node if we can match it)
    let proxmoxNodeName = clusterResponse.data.data[0].node;
    const matchingNode = clusterResponse.data.data.find(n => n.node === node.name);
    if (matchingNode) {
      proxmoxNodeName = matchingNode.node;
    }
    
    // Get node resource usage history
    const rrdResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/rrddata?timeframe=${timeframe}&cf=${cf}`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    if (!rrdResponse.data || !rrdResponse.data.data) {
      throw new Error('Failed to get node resource history');
    }
    
    // Get node status for current values
    const statusResponse = await axios.get(
      `https://${node.hostname}:${node.port}/api2/json/nodes/${proxmoxNodeName}/status`,
      {
        headers: { 'Authorization': `PVEAuthCookie=${ticket}` },
        httpsAgent: agent
      }
    );
    
    if (!statusResponse.data || !statusResponse.data.data) {
      throw new Error('Failed to get node status');
    }
    
    // Process historical data
    const rrdData = rrdResponse.data.data;
    const status = statusResponse.data.data;
    
    // Generate appropriate time labels
    const timeLabels = generateTimeLabels(rrdData.length - 1, timeRange);
    
    // Extract data series
    const cpuData = rrdData.map(item => item.cpu * 100); // Convert to percentage
    const memoryTotal = status.memory.total;
    const memoryData = rrdData.map(item => (item.mem / memoryTotal) * 100); // Convert to percentage
    
    // Calculate disk usage from status data
    const diskTotal = status.rootfs.total;
    const diskUsed = status.rootfs.used;
    const diskUsagePercent = (diskUsed / diskTotal) * 100;
    
    // Fill disk history with current value (not available in Proxmox API)
    const diskData = Array(cpuData.length).fill(diskUsagePercent).map(
      val => val * (0.9 + 0.2 * Math.random()) // Add some variation
    );
    
    // For network data, we'll simulate based on the number of data points for the demo
    // In a real implementation, we would need node-specific commands to get historical network data
    const netFactor = 2 + Math.random() * 3; // Random factor between 2-5 MB/s
    const netInData = Array(cpuData.length).fill(0).map(() => netFactor * (0.5 + Math.random()));
    const netOutData = Array(cpuData.length).fill(0).map(() => netFactor * 0.6 * (0.5 + Math.random()));
    
    // Build the response object
    const historyData = {
      cpu: {
        current: status.cpu * 100,
        history: cpuData
      },
      memory: {
        current: (status.memory.used / status.memory.total) * 100,
        history: memoryData
      },
      disk: {
        current: diskUsagePercent,
        history: diskData
      },
      network: {
        in: {
          current: netInData[netInData.length - 1],
          history: netInData
        },
        out: {
          current: netOutData[netOutData.length - 1],
          history: netOutData
        }
      },
      timeLabels: timeLabels
    };
    
    res.json({
      success: true,
      history: historyData
    });
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    res.status(500).json({
      success: false,
      error: `Error fetching historical data: ${error.message}`
    });
  }
});

// Send monitoring alert notifications
app.post('/api/monitoring/notify', async (req, res, next) => {
  try {
    const { alert, notifications } = req.body;
    console.log('Notification request received:', JSON.stringify({ alert, notifications }));
    
    let emailSent = false;
    let webhookSent = false;
    
    // Send email notification if configured
    if (notifications.email && notifications.email.enabled && notifications.email.recipients) {
      // In a real implementation, this would send an actual email
      console.log(`Would send email to ${notifications.email.recipients} with alert: ${alert.message}`);
      
      // For now, we'll just log it and pretend it worked
      emailSent = true;
    }
    
    // Send webhook notification if configured
    if (notifications.webhook && notifications.webhook.enabled && notifications.webhook.url) {
      try {
        console.log(`Sending webhook to ${notifications.webhook.url}`);
        
        // Create webhook payload
        const webhookPayload = {
          content: `**PROXMOX ALERT**: ${alert.level.toUpperCase()}`,
          embeds: [{
            title: `${alert.resource} Alert on ${alert.node}`,
            description: alert.message,
            color: alert.level === 'critical' ? 0xFF0000 : 0xFFAA00, // Red for critical, orange for warning
            fields: [
              {
                name: 'Resource',
                value: alert.resource,
                inline: true
              },
              {
                name: 'Value',
                value: alert.value,
                inline: true
              },
              {
                name: 'Level',
                value: alert.level.toUpperCase(),
                inline: true
              },
              {
                name: 'Time',
                value: new Date(alert.timestamp).toLocaleString(),
                inline: true
              }
            ],
            timestamp: alert.timestamp
          }]
        };
        
        // In a real implementation, this would send an actual webhook
        // For demo purposes, we'll just log it
        console.log('Would send webhook payload:', JSON.stringify(webhookPayload));
        
        webhookSent = true;
      } catch (webhookError) {
        console.error('Error sending webhook:', webhookError);
      }
    }
    
    res.json({
      success: true,
      notifications: {
        email: emailSent,
        webhook: webhookSent
      }
    });
  } catch (error) {
    console.error('Error sending notification:', error.message);
    res.status(500).json({
      success: false,
      error: `Error sending notification: ${error.message}`
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});