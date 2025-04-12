import React, { useState, useEffect } from 'react';
import axios from 'axios';

function VMList({ nodes, selectedNode, authData, refreshData, setError }) {
  const [vms, setVMs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeNode, setActiveNode] = useState(selectedNode || (nodes.length > 0 ? nodes[0].node : null));

  useEffect(() => {
    const fetchVMs = async () => {
      if (!activeNode) return;

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

    fetchVMs();
  }, [activeNode, authData, refreshData]);

  const handleNodeChange = (e) => {
    setActiveNode(e.target.value);
  };

  const handleRefresh = () => {
    refreshData();
  };

  const handleAction = async (vmid, action) => {
    try {
      setIsLoading(true);
      
      const endpoint = `https://${authData.host}:8006/api2/json/nodes/${activeNode}/qemu/${vmid}/status/${action}`;
      
      const response = await axios.post(endpoint, {}, {
        headers: {
          'Authorization': `PVEAuthCookie=${authData.ticket}`,
          'CSRFPreventionToken': authData.CSRFPreventionToken
        }
      });
      
      setError(`Command "${action}" sent to VM ${vmid} successfully.`);
      
      // Refresh VM list after a short delay
      setTimeout(() => refreshData(), 2000);
    } catch (err) {
      console.error(`Error performing ${action} on VM ${vmid}:`, err);
      setError(`Failed to ${action} VM: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'running':
        return <span className="badge bg-success">Running</span>;
      case 'stopped':
        return <span className="badge bg-danger">Stopped</span>;
      case 'paused':
        return <span className="badge bg-warning">Paused</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <div className="vm-list">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Virtual Machines</h1>
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
          <button className="btn btn-primary" onClick={handleRefresh}>
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
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>VMID</th>
                <th>Name</th>
                <th>Status</th>
                <th>CPU</th>
                <th>Memory</th>
                <th>Disk</th>
                <th>Uptime</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vms.length > 0 ? (
                vms.map((vm) => (
                  <tr key={vm.vmid}>
                    <td>{vm.vmid}</td>
                    <td>{vm.name}</td>
                    <td>{getStatusBadge(vm.status)}</td>
                    <td>{vm.cpu || 'N/A'}</td>
                    <td>{vm.maxmem ? `${(vm.maxmem / (1024 * 1024 * 1024)).toFixed(2)} GB` : 'N/A'}</td>
                    <td>{vm.maxdisk ? `${(vm.maxdisk / (1024 * 1024 * 1024)).toFixed(2)} GB` : 'N/A'}</td>
                    <td>{vm.uptime ? `${Math.floor(vm.uptime / 3600)}h ${Math.floor((vm.uptime % 3600) / 60)}m` : 'N/A'}</td>
                    <td>
                      <div className="btn-group">
                        {vm.status === 'running' ? (
                          <>
                            <button
                              className="btn btn-sm btn-outline-warning"
                              onClick={() => handleAction(vm.vmid, 'suspend')}
                              title="Suspend"
                            >
                              <i className="fas fa-pause"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleAction(vm.vmid, 'stop')}
                              title="Stop"
                            >
                              <i className="fas fa-stop"></i>
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleAction(vm.vmid, 'reset')}
                              title="Reset"
                            >
                              <i className="fas fa-redo"></i>
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn btn-sm btn-outline-success"
                            onClick={() => handleAction(vm.vmid, 'start')}
                            title="Start"
                          >
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete VM ${vm.vmid} (${vm.name})?`)) {
                              // Delete VM logic here
                            }
                          }}
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center">No virtual machines found on this node</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default VMList;
