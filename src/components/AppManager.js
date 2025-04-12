import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AppManager({ nodes, selectedNode, authData, refreshData, setError }) {
  const [activeNode, setActiveNode] = useState(selectedNode || (nodes.length > 0 ? nodes[0].node : null));
  const [isLoading, setIsLoading] = useState(true);
  const [containers, setContainers] = useState([]);
  const [vms, setVMs] = useState([]);
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedVM, setSelectedVM] = useState(null);
  const [appList, setAppList] = useState([]);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState('');
  const [targetType, setTargetType] = useState('container'); // 'container' or 'vm'

  // Common applications that can be installed
  const commonApps = [
    { id: 'apache', name: 'Apache Web Server', command: 'apt-get install -y apache2' },
    { id: 'nginx', name: 'Nginx Web Server', command: 'apt-get install -y nginx' },
    { id: 'mysql', name: 'MySQL Database', command: 'apt-get install -y mysql-server' },
    { id: 'mariadb', name: 'MariaDB Database', command: 'apt-get install -y mariadb-server' },
    { id: 'postgresql', name: 'PostgreSQL Database', command: 'apt-get install -y postgresql postgresql-contrib' },
    { id: 'php', name: 'PHP', command: 'apt-get install -y php php-fpm php-mysql' },
    { id: 'nodejs', name: 'Node.js', command: 'apt-get install -y nodejs npm' },
    { id: 'docker', name: 'Docker', command: 'apt-get install -y docker.io' },
    { id: 'python3', name: 'Python 3', command: 'apt-get install -y python3 python3-pip' },
    { id: 'java', name: 'Java', command: 'apt-get install -y default-jdk' },
    { id: 'wordpress', name: 'WordPress', command: 'apt-get install -y wordpress' },
    { id: 'phpmyadmin', name: 'phpMyAdmin', command: 'apt-get install -y phpmyadmin' }
  ];

  useEffect(() => {
    if (activeNode) {
      fetchContainers();
      fetchVMs();
    }
  }, [activeNode, authData, refreshData]);

  const fetchContainers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${activeNode}/lxc`, {
        headers: {
          'Authorization': `PVEAuthCookie=${authData.ticket}`
        }
      });
      
      if (response.data && response.data.data) {
        setContainers(response.data.data);
      } else {
        setContainers([]);
      }
    } catch (err) {
      console.error(`Error fetching containers for node ${activeNode}:`, err);
      setError(`Failed to fetch containers: ${err.message}`);
      setContainers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchVMs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${activeNode}/qemu`, {
        headers: {
          'Authorization': `PVEAuthCookie=${authData.ticket}`
        }
      });
      
      if (response.data && response.data.data) {
        setVMs(response.data.data);
      } else {
        setVMs([]);
      }
    } catch (err) {
      console.error(`Error fetching VMs for node ${activeNode}:`, err);
      setError(`Failed to fetch VMs: ${err.message}`);
      setVMs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeChange = (e) => {
    setActiveNode(e.target.value);
    setSelectedContainer(null);
    setSelectedVM(null);
    setAppList([]);
  };

  const handleRefresh = () => {
    fetchContainers();
    fetchVMs();
    fetchInstalledApps();
  };

  const handleContainerSelect = (e) => {
    const containerId = e.target.value;
    if (containerId) {
      const container = containers.find(c => c.vmid.toString() === containerId);
      setSelectedContainer(container);
      setSelectedVM(null);
      setTargetType('container');
      fetchInstalledApps();
    } else {
      setSelectedContainer(null);
      setAppList([]);
    }
  };

  const handleVMSelect = (e) => {
    const vmId = e.target.value;
    if (vmId) {
      const vm = vms.find(v => v.vmid.toString() === vmId);
      setSelectedVM(vm);
      setSelectedContainer(null);
      setTargetType('vm');
      fetchInstalledApps();
    } else {
      setSelectedVM(null);
      setAppList([]);
    }
  };

  const fetchInstalledApps = async () => {
    if (!selectedContainer && !selectedVM) return;
    
    const target = selectedContainer || selectedVM;
    
    setIsLoading(true);
    try {
      let sshCommand = '';
      
      if (targetType === 'container') {
        // For LXC, we need to use the Proxmox host to connect to the container
        sshCommand = `pct exec ${target.vmid} -- dpkg -l | grep '^ii' | awk '{print $2 " " $3}'`;
      } else {
        // For VM, we need to know the VM's IP address
        // First, get VM info to find its IP
        const statusResponse = await axios.get(
          `https://${authData.host}:8006/api2/json/nodes/${activeNode}/qemu/${target.vmid}/status/current`, 
          {
            headers: {
              'Authorization': `PVEAuthCookie=${authData.ticket}`
            }
          }
        );
        
        // This is a simplified approach - in real life, you'd need to actually get SSH credentials for the VM
        // For demo purposes, we'll show a message indicating this limitation
        setAppList([
          { name: "VM App Management", version: "Not available", description: "Direct VM app management requires SSH credentials for each VM" }
        ]);
        setIsLoading(false);
        return;
      }
      
      const result = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: sshCommand
      });
      
      if (result.code === 0) {
        // Parse the output to get installed apps
        const lines = result.data.split('\n');
        const apps = lines
          .filter(line => line.trim() !== '')
          .map(line => {
            const parts = line.trim().split(' ');
            return {
              name: parts[0],
              version: parts.length > 1 ? parts[1] : 'Unknown',
              description: '',
              isInstalled: true
            };
          });
        
        setAppList(apps);
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (err) {
      console.error(`Error fetching installed apps:`, err);
      setError(`Failed to fetch installed apps: ${err.message}`);
      setAppList([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallApp = async (app) => {
    if (!selectedContainer && !selectedVM) {
      setError('Please select a container or VM first');
      return;
    }
    
    const target = selectedContainer || selectedVM;
    
    if (!confirm(`Are you sure you want to install ${app.name} on ${target.name}?`)) {
      return;
    }
    
    setIsInstalling(true);
    setInstallProgress('');
    
    try {
      let command = '';
      
      if (targetType === 'container') {
        // For LXC containers
        command = `pct exec ${target.vmid} -- bash -c "apt-get update && ${app.command}"`;
      } else {
        // For VMs - this is a simplified approach
        setError('Direct VM app installation is not implemented in this version');
        setIsInstalling(false);
        return;
      }
      
      const result = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: command
      });
      
      setInstallProgress(result.data);
      
      if (result.code === 0) {
        setError(`Successfully installed ${app.name} on ${target.name}`);
        // Refresh the app list
        fetchInstalledApps();
      } else {
        throw new Error(`Installation failed with exit code ${result.code}`);
      }
    } catch (err) {
      console.error(`Error installing ${app.name}:`, err);
      setError(`Failed to install ${app.name}: ${err.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstallApp = async (appName) => {
    if (!selectedContainer && !selectedVM) {
      setError('Please select a container or VM first');
      return;
    }
    
    const target = selectedContainer || selectedVM;
    
    if (!confirm(`Are you sure you want to uninstall ${appName} from ${target.name}?`)) {
      return;
    }
    
    setIsInstalling(true);
    setInstallProgress('');
    
    try {
      let command = '';
      
      if (targetType === 'container') {
        // For LXC containers
        command = `pct exec ${target.vmid} -- apt-get remove -y ${appName}`;
      } else {
        // For VMs - this is a simplified approach
        setError('Direct VM app uninstallation is not implemented in this version');
        setIsInstalling(false);
        return;
      }
      
      const result = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: command
      });
      
      setInstallProgress(result.data);
      
      if (result.code === 0) {
        setError(`Successfully uninstalled ${appName} from ${target.name}`);
        // Refresh the app list
        fetchInstalledApps();
      } else {
        throw new Error(`Uninstallation failed with exit code ${result.code}`);
      }
    } catch (err) {
      console.error(`Error uninstalling ${appName}:`, err);
      setError(`Failed to uninstall ${appName}: ${err.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="app-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Application Manager</h1>
        <div className="d-flex">
          <select
            className="form-select me-2"
            value={activeNode}
            onChange={handleNodeChange}
          >
            {nodes.map((node) => (
              <option key={node.node} value={node.node}>
                {node.node}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleRefresh} disabled={isLoading}>
            <i className="fas fa-sync-alt me-2"></i> Refresh
          </button>
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Select Container</h5>
            </div>
            <div className="card-body">
              <select
                className="form-select"
                onChange={handleContainerSelect}
                value={selectedContainer ? selectedContainer.vmid : ''}
              >
                <option value="">Select a container...</option>
                {containers
                  .filter(container => container.status === 'running')
                  .map(container => (
                    <option key={container.vmid} value={container.vmid}>
                      {container.name} (ID: {container.vmid})
                    </option>
                  ))}
              </select>
              {containers.filter(container => container.status === 'running').length === 0 && (
                <div className="alert alert-warning mt-3">
                  No running containers available. Please start a container first.
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">Select VM</h5>
            </div>
            <div className="card-body">
              <select
                className="form-select"
                onChange={handleVMSelect}
                value={selectedVM ? selectedVM.vmid : ''}
              >
                <option value="">Select a VM...</option>
                {vms
                  .filter(vm => vm.status === 'running')
                  .map(vm => (
                    <option key={vm.vmid} value={vm.vmid}>
                      {vm.name} (ID: {vm.vmid})
                    </option>
                  ))}
              </select>
              {vms.filter(vm => vm.status === 'running').length === 0 && (
                <div className="alert alert-warning mt-3">
                  No running VMs available. Please start a VM first.
                </div>
              )}
              
              {selectedVM && (
                <div className="alert alert-info mt-3">
                  <i className="fas fa-info-circle me-2"></i>
                  VM application management requires direct SSH access. This is a limited implementation.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {isInstalling && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Installation Progress</h5>
          </div>
          <div className="card-body">
            <div className="progress mb-3">
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated" 
                role="progressbar" 
                style={{ width: "100%" }}
              ></div>
            </div>
            <pre className="install-log p-3 bg-dark text-light">
              {installProgress || 'Installation in progress...'}
            </pre>
          </div>
        </div>
      )}
      
      {(selectedContainer || selectedVM) && !isInstalling && (
        <div className="row">
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Installed Applications</h5>
              </div>
              <div className="card-body">
                {isLoading ? (
                  <div className="d-flex justify-content-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Version</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appList.length > 0 ? (
                          appList.map((app, index) => (
                            <tr key={index}>
                              <td>{app.name}</td>
                              <td>{app.version}</td>
                              <td>
                                {targetType === 'container' && (
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleUninstallApp(app.name)}
                                    disabled={app.name === 'VM App Management'}
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center">No applications found</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Install New Application</h5>
              </div>
              <div className="card-body">
                {targetType === 'vm' ? (
                  <div className="alert alert-info">
                    <i className="fas fa-info-circle me-2"></i>
                    Direct application installation is only available for containers in this version.
                  </div>
                ) : (
                  <div className="list-group">
                    {commonApps.map(app => (
                      <button
                        key={app.id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => handleInstallApp(app)}
                      >
                        <div>
                          <strong>{app.name}</strong>
                        </div>
                        <i className="fas fa-download"></i>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!selectedContainer && !selectedVM && !isInstalling && (
        <div className="alert alert-info">
          <i className="fas fa-info-circle me-2"></i>
          Please select a container or VM to manage applications.
        </div>
      )}
    </div>
  );
}

export default AppManager;
