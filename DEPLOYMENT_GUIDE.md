# Proxmox Infrastructure Manager - Deployment Guide for Debian 12

This guide will walk you through the process of deploying the Proxmox Infrastructure Manager application on a clean Debian 12 installation.

## System Requirements

- Debian 12 (Bookworm)
- At least 2GB RAM
- At least 10GB free disk space
- Internet connectivity for package installation
- Access to your Proxmox infrastructure from this system

## Step 1: Update Your System

First, make sure your system is up-to-date:

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 2: Install Required Dependencies

Install Node.js, npm, and other required packages:

```bash
# Install curl for downloading Node.js
sudo apt install -y curl

# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js and development tools
sudo apt install -y nodejs git build-essential

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

## Step 3: Clone the Repository

```bash
# Create a directory for the application
mkdir -p ~/applications
cd ~/applications

# Clone the repository
git clone https://github.com/yourusername/proxmox-infrastructure-manager.git
cd proxmox-infrastructure-manager
```

## Step 4: Install Application Dependencies

```bash
# Install all dependencies
npm install
```

## Step 5: Run the Application

You can run the application in two ways:

### Option A: Using the Development Server

```bash
# Start the server
npm start
```

Then open a web browser and navigate to: `http://localhost:5000`

### Option B: Building and Running as a Desktop Application

To create a standalone desktop application:

```bash
# Install electron-builder globally
sudo npm install -g electron-builder

# Build the application
npm run build

# The built application will be in the dist directory
cd dist/linux-unpacked
./proxmox-infrastructure-manager
```

## Step 6: Set Up as a System Service (Optional)

To run the application as a service that starts automatically with your system:

```bash
# Create a systemd service file
sudo nano /etc/systemd/system/proxmox-manager.service
```

Add the following content (replace the placeholders with your actual username and paths):

```
[Unit]
Description=Proxmox Infrastructure Manager
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/home/YOUR_USERNAME/applications/proxmox-infrastructure-manager
ExecStart=/usr/bin/npm start
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Save and close the file (Ctrl+X, then Y, then Enter).

Enable and start the service:

```bash
sudo systemctl enable proxmox-manager.service
sudo systemctl start proxmox-manager.service
```

Check the service status:

```bash
sudo systemctl status proxmox-manager.service
```

## Step 7: Configure Firewall (Optional)

If you have a firewall enabled, you need to allow port 5000:

```bash
# If using ufw
sudo ufw allow 5000/tcp

# If using iptables directly
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save | sudo tee /etc/iptables/rules.v4
```

## Step 8: Access the Application

- If running as a service or development server: Open a web browser and navigate to `http://localhost:5000`
- If running as a desktop application: The application will launch automatically after building

## Troubleshooting

### Common Issues

1. **Port 5000 is already in use**

   Solution:
   ```bash
   # Find what's using port 5000
   sudo lsof -i :5000
   
   # Either stop that process or modify the server.js file to use a different port
   sudo nano server.js
   # Change PORT = process.env.PORT || 5000 to use a different port
   ```

2. **Node.js version is too old**

   Solution:
   ```bash
   # Remove old Node.js
   sudo apt remove nodejs npm
   
   # Install the correct version using the instructions in Step 2
   ```

3. **"Error: Cannot find module" errors**

   Solution:
   ```bash
   # Make sure all dependencies are installed
   npm install
   
   # If problems persist, try removing node_modules and reinstalling
   rm -rf node_modules
   npm install
   ```

4. **Connection to Proxmox server fails**

   Solution:
   - Make sure your Proxmox server is reachable from your Debian system
   - Check that the API user has appropriate permissions
   - Verify that you're entering the correct hostname/IP, username, and password
   - Ensure that your Proxmox API is enabled and accessible

### Checking Logs

To troubleshoot issues, check the application logs:

```bash
# For the application running in development mode
npm start

# For the application running as a service
sudo journalctl -u proxmox-manager.service
```

## Keeping the Application Updated

To update the application to the latest version:

```bash
cd ~/applications/proxmox-infrastructure-manager
git pull
npm install
```

If running as a service, restart it:

```bash
sudo systemctl restart proxmox-manager.service
```

## Uninstalling

If you need to remove the application:

```bash
# If running as a service, stop and disable it
sudo systemctl stop proxmox-manager.service
sudo systemctl disable proxmox-manager.service
sudo rm /etc/systemd/system/proxmox-manager.service

# Remove the application files
rm -rf ~/applications/proxmox-infrastructure-manager
```

## Security Considerations

- The application needs credentials to connect to your Proxmox servers
- These credentials are only stored in memory during the session
- It's recommended to create a dedicated API user with appropriate permissions
- If running the application as a web server, consider using HTTPS and restricting access

## Need Help?

If you encounter any issues not covered in this guide, please:

1. Check the project's GitHub repository for issues and solutions
2. Create a new issue on the repository if you can't find a solution
3. Contact the maintainer for additional support

---

This deployment guide is specific to Debian 12. For other operating systems, please refer to the general documentation.