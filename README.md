# Proxmox Infrastructure Manager

A comprehensive desktop application for managing Proxmox infrastructure with VM/LXC deployment, updates, and network management capabilities.

## Features

- VM and LXC container management (creation, listing, start/stop, clone, snapshot)
- Infrastructure updates management across nodes and containers
- Network configuration management and monitoring
- Real-time resource monitoring with configurable alert thresholds
- Application deployment and management within containers
- Batch operations for managing multiple VMs/containers simultaneously
- Template-based deployments with customizable profiles
- Role-based access control for team collaboration
- PostgreSQL database for persistently storing configuration and templates
- Futuristic dark theme UI with responsive design

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

# Install PostgreSQL and other dependencies
sudo apt install -y git build-essential postgresql postgresql-contrib

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database Setup

Set up a PostgreSQL database for the application:

```bash
# Switch to the postgres user
sudo -i -u postgres

# Create a database user (replace 'proxmoxmgr' and 'password' with your preferred values)
createuser --interactive --pwprompt proxmoxmgr
# Answer the prompts as follows:
# - Enter password for new role: [your-secure-password]
# - Enter it again: [your-secure-password]
# - Shall the new role be a superuser? (y/n): n
# - Shall the new role be allowed to create databases? (y/n): y
# - Shall the new role be allowed to create more new roles? (y/n): n

# Create a database for the application
createdb --owner=proxmoxmgr proxmox_manager

# Exit the postgres user session
exit
```

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/proxmox-manager/proxmox-infrastructure-manager.git
cd proxmox-infrastructure-manager
```

### Install Dependencies

```bash
# Install application dependencies
npm install
```

### Configuration

#### Database Configuration

Create a `.env` file in the root directory with your PostgreSQL database credentials:

```
DATABASE_URL=postgres://proxmoxmgr:your-secure-password@localhost:5432/proxmox_manager
```

Replace `proxmoxmgr` and `your-secure-password` with the values you used during database setup.

#### Application Configuration

The Proxmox server connection details (host, username, password) are entered directly in the application's login interface when you run the application.

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
- **Database Connection Failed**: Check that PostgreSQL is running and your DATABASE_URL environment variable is correct.
- **Error: relation "users" does not exist**: The database schema hasn't been initialized. The application should create tables automatically on first run, but if it fails, check the logs for details.

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