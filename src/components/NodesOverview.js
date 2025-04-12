import React, { useState, useEffect } from 'react';
import axios from 'axios';

function NodesOverview({ nodes, onSelectNode, refreshData, authData, setError }) {
  const [nodesStatus, setNodesStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNodesStatus = async () => {
      setIsLoading(true);
      const statusResults = {};
      
      try {
        // Fetch detailed status for each node
        for (const node of nodes) {
          try {
            const response = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${node.node}/status`, {
              headers: {
                'Authorization': `PVEAuthCookie=${authData.ticket}`
              }
            });
            
            if (response.data && response.data.data) {
              statusResults[node.node] = response.data.data;
            }
          } catch (err) {
            console.error(`Error fetching status for node ${node.node}:`, err);
            statusResults[node.node] = { error: err.message };
          }
        }
        
        setNodesStatus(statusResults);
      } catch (err) {
        console.error('Error fetching nodes status:', err);
        setError(`Failed to fetch nodes status: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (nodes.length > 0) {
      fetchNodesStatus();
    }
  }, [nodes, authData]);

  const getStatusBadge = (node) => {
    const status = nodesStatus[node.node];
    
    if (!status) return <span className="badge bg-secondary">Unknown</span>;
    if (status.error) return <span className="badge bg-danger">Error</span>;
    
    return status.status === 'online' 
      ? <span className="badge bg-success">Online</span>
      : <span className="badge bg-danger">Offline</span>;
  };

  const getMemoryUsage = (node) => {
    const status = nodesStatus[node.node];
    
    if (!status || status.error || !status.memory) return 'N/A';
    
    const total = status.memory.total;
    const used = status.memory.used;
    const percentage = (used / total * 100).toFixed(2);
    
    return `${formatBytes(used)} / ${formatBytes(total)} (${percentage}%)`;
  };

  const getCpuUsage = (node) => {
    const status = nodesStatus[node.node];
    
    if (!status || status.error || !status.cpu) return 'N/A';
    
    return `${(status.cpu * 100).toFixed(2)}%`;
  };

  const getUptimeFormatted = (node) => {
    const status = nodesStatus[node.node];
    
    if (!status || status.error || !status.uptime) return 'N/A';
    
    const uptime = status.uptime;
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleRefresh = () => {
    refreshData();
  };

  return (
    <div className="nodes-overview">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Nodes Overview</h1>
        <button className="btn btn-primary" onClick={handleRefresh}>
          <i className="fas fa-sync-alt me-2"></i> Refresh
        </button>
      </div>
      
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row">
          {nodes.map((node) => (
            <div key={node.node} className="col-md-6 col-lg-3 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{node.node}</h5>
                  {getStatusBadge(node)}
                </div>
                <div className="card-body">
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between">
                      <span>CPU Usage:</span>
                      <span>{getCpuUsage(node)}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Memory:</span>
                      <span>{getMemoryUsage(node)}</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between">
                      <span>Uptime:</span>
                      <span>{getUptimeFormatted(node)}</span>
                    </li>
                  </ul>
                </div>
                <div className="card-footer">
                  <button 
                    className="btn btn-sm btn-outline-primary w-100"
                    onClick={() => onSelectNode(node.node)}
                  >
                    <i className="fas fa-info-circle me-2"></i> View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NodesOverview;
