// Simple server to serve the application in development mode
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Handle API requests
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', message: 'Proxmox Manager API is running' });
});

// For all other routes, serve the main HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});