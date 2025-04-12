import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NetworkManager({ nodes, selectedNode, authData, refreshData, setError }) {
  const [activeNode, setActiveNode] = useState(selectedNode || (nodes.length > 0 ? nodes[0].node : null));
  const [isLoading, setIsLoading] = useState(true);
  const [networkInterfaces, setNetworkInterfaces] = useState([]);
  const [networkConfig, setNetworkConfig] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeNode) {
      fetchNetworkInterfaces();
      fetchNetworkConfig();
    }
  }, [activeNode, authData, refreshData]);

  const fetchNetworkInterfaces = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${activeNode}/network`, {
        headers: {
          'Authorization': `PVEAuthCookie=${authData.ticket}`
        }
      });
      
      if (response.data && response.data.data) {
        setNetworkInterfaces(response.data.data);
      } else {
        setNetworkInterfaces([]);
      }
    } catch (err) {
      console.error(`Error fetching network interfaces for node ${activeNode}:`, err);
      setError(`Failed to fetch network interfaces: ${err.message}`);
      setNetworkInterfaces([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNetworkConfig = async () => {
    try {
      // Fetch network config file via SSH
      const sshResult = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: 'cat /etc/network/interfaces'
      });
      
      if (sshResult.code === 0) {
        setNetworkConfig(sshResult.data);
      } else {
        throw new Error(`Command failed with exit code ${sshResult.code}`);
      }
    } catch (err) {
      console.error(`Error fetching network config for node ${activeNode}:`, err);
      setError(`Failed to fetch network config: ${err.message}`);
      setNetworkConfig('# Failed to load network configuration');
    }
  };

  const handleNodeChange = (e) => {
    setActiveNode(e.target.value);
  };

  const handleRefresh = () => {
    fetchNetworkInterfaces();
    fetchNetworkConfig();
  };

  const handleEditConfig = () => {
    setIsEditing(true);
  };

  const handleConfigChange = (e) => {
    setNetworkConfig(e.target.value);
  };

  const handleSaveConfig = async () => {
    if (!confirm('Are you sure you want to save the network configuration? This might disrupt network connectivity if configured incorrectly.')) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Save config file via SSH
      const tempFilePath = '/tmp/network_interfaces_temp';
      
      // First, write to a temporary file
      const writeResult = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: `cat > ${tempFilePath} << 'EOL'\n${networkConfig}\nEOL`
      });
      
      if (writeResult.code !== 0) {
        throw new Error(`Failed to write temporary file: ${writeResult.data}`);
      }
      
      // Validate syntax
      const validateResult = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: `grep -v '^\\s*#' ${tempFilePath} | grep -v '^$' | wc -l`
      });
      
      if (validateResult.code !== 0 || parseInt(validateResult.data.trim()) === 0) {
        throw new Error(`Invalid network configuration format`);
      }
      
      // Apply the configuration
      const applyResult = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: `cp ${tempFilePath} /etc/network/interfaces && rm ${tempFilePath}`
      });
      
      if (applyResult.code !== 0) {
        throw new Error(`Failed to apply network configuration: ${applyResult.data}`);
      }
      
      setIsEditing(false);
      setError(`Network configuration saved successfully. You may need to restart networking services for changes to take effect.`);
    } catch (err) {
      console.error(`Error saving network config for node ${activeNode}:`, err);
      setError(`Failed to save network config: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Revert changes by fetching the original config
    fetchNetworkConfig();
    setIsEditing(false);
  };

  const handleApplyNetworkChanges = async () => {
    if (!confirm('Are you sure you want to apply network changes? This might temporarily disrupt connectivity.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await window.api.sshCommand({
        host: `${activeNode}.ionutlab.com`,
        username: 'root',
        password: 'Poolamea01@',
        command: 'systemctl restart networking'
      });
      
      if (result.code === 0) {
        setError(`Network services restarted successfully on ${activeNode}`);
        // Refresh data after a short delay
        setTimeout(() => {
          refreshData();
          fetchNetworkInterfaces();
        }, 5000);
      } else {
        throw new Error(`Command failed with exit code ${result.code}`);
      }
    } catch (err) {
      console.error(`Error restarting network services on ${activeNode}:`, err);
      setError(`Failed to restart network services: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getInterfaceTypeIcon = (type) => {
    switch (type) {
      case 'bridge':
        return <i className="fas fa-network-wired text-primary me-2"></i>;
      case 'bond':
        return <i className="fas fa-link text-success me-2"></i>;
      case 'eth':
        return <i className="fas fa-ethernet text-info me-2"></i>;
      case 'vlan':
        return <i className="fas fa-tag text-warning me-2"></i>;
      default:
        return <i className="fas fa-globe text-secondary me-2"></i>;
    }
  };

  return (
    <div className="network-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Network Manager</h1>
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
      
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-7 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Network Interfaces</h5>
                <button 
                  className="btn btn-sm btn-warning"
                  onClick={handleApplyNetworkChanges}
                  disabled={isLoading}
                >
                  <i className="fas fa-play me-2"></i> Apply Network Changes
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>IP Address</th>
                        <th>MAC Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {networkInterfaces.length > 0 ? (
                        networkInterfaces.map((iface, index) => (
                          <tr key={index}>
                            <td>
                              {getInterfaceTypeIcon(iface.type)}
                              {iface.iface}
                            </td>
                            <td>{iface.type}</td>
                            <td>
                              {iface.active ? (
                                <span className="badge bg-success">Up</span>
                              ) : (
                                <span className="badge bg-danger">Down</span>
                              )}
                            </td>
                            <td>{iface.address || 'N/A'}</td>
                            <td><small>{iface.hwaddr || 'N/A'}</small></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">No network interfaces found</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-md-5 mb-4">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Network Configuration</h5>
                {isEditing ? (
                  <div>
                    <button 
                      className="btn btn-sm btn-success me-2"
                      onClick={handleSaveConfig}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save me-2"></i> Save
                        </>
                      )}
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <i className="fas fa-times me-2"></i> Cancel
                    </button>
                  </div>
                ) : (
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={handleEditConfig}
                  >
                    <i className="fas fa-edit me-2"></i> Edit
                  </button>
                )}
              </div>
              <div className="card-body">
                {isEditing ? (
                  <div className="form-group">
                    <textarea
                      className="form-control font-monospace"
                      value={networkConfig}
                      onChange={handleConfigChange}
                      rows="20"
                      style={{ resize: 'none' }}
                    ></textarea>
                    <small className="text-muted mt-2 d-block">
                      Warning: Incorrect network configuration can cause network disruptions. Edit with caution.
                    </small>
                  </div>
                ) : (
                  <pre className="network-config p-3 bg-light">{networkConfig}</pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NetworkManager;
