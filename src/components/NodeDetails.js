import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NodeDetails({ node, authData, refreshData, setError }) {
  const [nodeInfo, setNodeInfo] = useState(null);
  const [resources, setResources] = useState([]);
  const [storageInfo, setStorageInfo] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchNodeDetails = async () => {
      setIsLoading(true);
      
      try {
        // Fetch basic node status
        const statusResponse = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${node}/status`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (statusResponse.data && statusResponse.data.data) {
          setNodeInfo(statusResponse.data.data);
        }
        
        // Fetch node resources
        const resourcesResponse = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${node}/status/resources`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (resourcesResponse.data && resourcesResponse.data.data) {
          setResources(resourcesResponse.data.data);
        }
        
        // Fetch storage info
        const storageResponse = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${node}/storage`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (storageResponse.data && storageResponse.data.data) {
          setStorageInfo(storageResponse.data.data);
        }
        
      } catch (err) {
        console.error(`Error fetching details for node ${node}:`, err);
        setError(`Failed to fetch node details: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodeDetails();
  }, [node, authData, refreshData]);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const formatUptime = (uptime) => {
    if (!uptime) return 'N/A';
    
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const handleRefresh = () => {
    refreshData();
  };

  // Function to restart node
  const handleRestart = async () => {
    if (!confirm(`Are you sure you want to restart ${node}?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`https://${authData.host}:8006/api2/json/nodes/${node}/status/reboot`, {}, {
        headers: {
          'Authorization': `PVEAuthCookie=${authData.ticket}`,
          'CSRFPreventionToken': authData.CSRFPreventionToken
        }
      });
      
      setError(`Reboot command sent to ${node}. The node will restart shortly.`);
    } catch (err) {
      console.error(`Error restarting node ${node}:`, err);
      setError(`Failed to restart node: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to shutdown node
  const handleShutdown = async () => {
    if (!confirm(`Are you sure you want to shutdown ${node}?`)) {
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await axios.post(`https://${authData.host}:8006/api2/json/nodes/${node}/status/shutdown`, {}, {
        headers: {
          'Authorization': `PVEAuthCookie=${authData.ticket}`,
          'CSRFPreventionToken': authData.CSRFPreventionToken
        }
      });
      
      setError(`Shutdown command sent to ${node}. The node will shutdown shortly.`);
    } catch (err) {
      console.error(`Error shutting down node ${node}:`, err);
      setError(`Failed to shutdown node: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="node-details">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Node: {node}</h1>
        <div>
          <button className="btn btn-primary me-2" onClick={handleRefresh}>
            <i className="fas fa-sync-alt me-2"></i> Refresh
          </button>
          <button className="btn btn-warning me-2" onClick={handleRestart}>
            <i className="fas fa-redo me-2"></i> Restart
          </button>
          <button className="btn btn-danger" onClick={handleShutdown}>
            <i className="fas fa-power-off me-2"></i> Shutdown
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
          {/* Overview Card */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Overview</h5>
              </div>
              <div className="card-body">
                {nodeInfo ? (
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>Status:</strong>
                      <span className={`badge ${nodeInfo.status === 'online' ? 'bg-success' : 'bg-danger'}`}>
                        {nodeInfo.status}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>Uptime:</strong>
                      <span>{formatUptime(nodeInfo.uptime)}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>CPU Model:</strong>
                      <span>{nodeInfo.cpuinfo?.model || 'N/A'}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>CPU Cores:</strong>
                      <span>{nodeInfo.cpuinfo?.cpus || 'N/A'}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>CPU Usage:</strong>
                      <span>{nodeInfo.cpu ? `${(nodeInfo.cpu * 100).toFixed(2)}%` : 'N/A'}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>Memory:</strong>
                      <span>
                        {nodeInfo.memory ? 
                          `${formatBytes(nodeInfo.memory.used)} / ${formatBytes(nodeInfo.memory.total)} (${(nodeInfo.memory.used / nodeInfo.memory.total * 100).toFixed(2)}%)` 
                          : 'N/A'}
                      </span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>Kernel Version:</strong>
                      <span>{nodeInfo.kversion || 'N/A'}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <strong>Proxmox Version:</strong>
                      <span>{nodeInfo.pveversion || 'N/A'}</span>
                    </li>
                  </ul>
                ) : (
                  <p className="text-center">No node information available</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Resources Card */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Resources</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>ID</th>
                        <th>Status</th>
                        <th>Name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resources.length > 0 ? (
                        resources.map((resource, index) => (
                          <tr key={index}>
                            <td>{resource.type}</td>
                            <td>{resource.id}</td>
                            <td>
                              {resource.status ? (
                                <span className={`badge ${resource.status === 'running' ? 'bg-success' : 'bg-secondary'}`}>
                                  {resource.status}
                                </span>
                              ) : 'N/A'}
                            </td>
                            <td>{resource.name || 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="text-center">No resources available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          {/* Storage Card */}
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Storage</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Storage</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Content</th>
                        <th>Used</th>
                        <th>Available</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {storageInfo.length > 0 ? (
                        storageInfo.map((storage, index) => (
                          <tr key={index}>
                            <td>{storage.storage}</td>
                            <td>{storage.type}</td>
                            <td>
                              <span className={`badge ${storage.active ? 'bg-success' : 'bg-danger'}`}>
                                {storage.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>{storage.content}</td>
                            <td>{storage.used ? formatBytes(storage.used) : 'N/A'}</td>
                            <td>{storage.avail ? formatBytes(storage.avail) : 'N/A'}</td>
                            <td>{storage.total ? formatBytes(storage.total) : 'N/A'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center">No storage information available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NodeDetails;
