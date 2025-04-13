# Proxmox Infrastructure Manager

A comprehensive desktop application for managing Proxmox infrastructure with VM/LXC deployment, updates, and network management capabilities.

## Features

- VM and LXC container management (creation, listing, start/stop)
- Infrastructure updates management
- Network configuration management
- Node monitoring and resource utilization
- Application management within containers
- Futuristic dark theme UI

## Screenshots

- Login Screen
- Dashboard
- VM Management
- Container Management
- Network Management

## Installation and Deployment Guide for Debian 12

Follow these steps to deploy the Proxmox Infrastructure Manager on a Debian 12 system:

### Prerequisites

Make sure your system has the following prerequisites installed:

```bash
# Update your package lists
sudo apt update

# Install Node.js and npm
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install other dependencies
sudo apt install -y git build-essential
```

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/proxmox-infrastructure-manager.git
cd proxmox-infrastructure-manager
```

### Install Dependencies

```bash
# Install application dependencies
npm install
```

### Configuration

The application doesn't require specific configuration files before running. You'll enter your Proxmox server details (host, username, password) directly in the application's login interface.

### Run Development Server

```bash
# Start the development server
npm start
```

### Build for Production

To create a standalone desktop application:

```bash
# Install electron-builder globally
npm install -g electron-builder

# Build the application for your platform
npm run build
```

The built application will be available in the `dist` directory.

### Run as a Service (Optional)

If you want to run the application as a service on your Debian system:

1. Create a systemd service file:

```bash
sudo nano /etc/systemd/system/proxmox-manager.service
```

2. Add the following content to the file:

```
[Unit]
Description=Proxmox Infrastructure Manager
After=network.target

[Service]
Type=simple
User=<your-username>
WorkingDirectory=/path/to/proxmox-infrastructure-manager
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

3. Replace `<your-username>` with your actual username and update the path in `WorkingDirectory`.

4. Enable and start the service:

```bash
sudo systemctl enable proxmox-manager.service
sudo systemctl start proxmox-manager.service
```

5. Check the service status:

```bash
sudo systemctl status proxmox-manager.service
```

## Troubleshooting

### Common Issues

- **Connection Refused**: Make sure your Proxmox server is reachable from your network and that API access is enabled.
- **Authentication Failed**: Verify that you're using the correct username and password format (e.g., user@pam).
- **API Access Denied**: Ensure your user has sufficient privileges in Proxmox.

### Logs

Check the application logs for more detailed error information:

```bash
# For the development server
npm start -- --verbose

# For the systemd service
sudo journalctl -u proxmox-manager.service
```

## Security Considerations

- This application requires API access to your Proxmox infrastructure, which means it needs credentials with sufficient privileges.
- It's recommended to create a dedicated API user in Proxmox with appropriate permissions for this application.
- Never use the root@pam account for API access; create a dedicated user instead.
- API tokens are stored in memory only during the session and are not persisted to disk.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.