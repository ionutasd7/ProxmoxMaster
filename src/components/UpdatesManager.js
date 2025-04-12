import React, { useState, useEffect } from 'react';
import axios from 'axios';

function UpdatesManager({ nodes, authData, refreshData, setError }) {
  const [isLoading, setIsLoading] = useState(false);
  const [updatesData, setUpdatesData] = useState({});
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateLogs, setUpdateLogs] = useState({});

  useEffect(() => {
    if (nodes.length > 0) {
      // Initialize selectedNodes with all nodes selected
      const initialSelectedNodes = nodes.map(node => node.node);
      setSelectedNodes(initialSelectedNodes);
      
      // Initialize updates data structure
      const initialUpdatesData = {};
      nodes.forEach(node => {
        initialUpdatesData[node.node] = {
          isChecking: false,
          updates: [],
          lastChecked: null,
          error: null
        };
      });
      setUpdatesData(initialUpdatesData);
    }
  }, [nodes]);

  const handleNodeSelection = (nodeName) => {
    if (selectedNodes.includes(nodeName)) {
      setSelectedNodes(selectedNodes.filter(node => node !== nodeName));
    } else {
      setSelectedNodes([...selectedNodes, nodeName]);
    }
  };

  const selectAllNodes = () => {
    setSelectedNodes(nodes.map(node => node.node));
  };

  const deselectAllNodes = () => {
    setSelectedNodes([]);
  };

  const checkForUpdates = async (nodeName) => {
    // Set checking state for the specific node
    setUpdatesData(prev => ({
      ...prev,
      [nodeName]: {
        ...prev[nodeName],
        isChecking: true,
        error: null
      }
    }));
    
    try {
      // Use SSH to check for updates
      const sshResult = await window.api.sshCommand({
        host: nodeName + '.ionutlab.com',
        username: 'root',
        password: 'Poolamea01@',
        command: 'apt update && apt list --upgradable'
      });
      
      if (sshResult.code === 0) {
        // Parse the output to extract package information
        const output = sshResult.data;
        const lines = output.split('\n');
        const upgradablePackages = [];
        
        // Find the line that says "Listing..."
        const listingIndex = lines.findIndex(line => line.startsWith('Listing...'));
        
        if (listingIndex !== -1) {
          // Parse all lines after "Listing..."
          for (let i = listingIndex + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('WARNING')) {
              // Parse package name and version
              const parts = line.split('/');
              if (parts.length >= 2) {
                const packageName = parts[0].trim();
                const versionInfo = line.includes('[upgradable from:') 
                  ? line.split('[upgradable from:')[1].replace(']', '').trim()
                  : 'Unknown version';
                
                upgradablePackages.push({
                  name: packageName,
                  versionInfo,
                  selected: true
                });
              }
            }
          }
        }
        
        setUpdatesData(prev => ({
          ...prev,
          [nodeName]: {
            ...prev[nodeName],
            updates: upgradablePackages,
            lastChecked: new Date(),
            isChecking: false
          }
        }));
      } else {
        throw new Error(`Command failed with exit code ${sshResult.code}`);
      }
    } catch (err) {
      console.error(`Error checking updates for node ${nodeName}:`, err);
      
      setUpdatesData(prev => ({
        ...prev,
        [nodeName]: {
          ...prev[nodeName],
          isChecking: false,
          error: err.message
        }
      }));
      
      setError(`Failed to check updates for ${nodeName}: ${err.message}`);
    }
  };

  const checkAllUpdates = async () => {
    setIsLoading(true);
    
    for (const nodeName of selectedNodes) {
      await checkForUpdates(nodeName);
    }
    
    setIsLoading(false);
  };

  const togglePackageSelection = (nodeName, packageIndex) => {
    setUpdatesData(prev => {
      const updatedNode = { ...prev[nodeName] };
      updatedNode.updates[packageIndex].selected = !updatedNode.updates[packageIndex].selected;
      
      return {
        ...prev,
        [nodeName]: updatedNode
      };
    });
  };

  const selectAllPackages = (nodeName) => {
    setUpdatesData(prev => {
      const updatedNode = { ...prev[nodeName] };
      updatedNode.updates = updatedNode.updates.map(pkg => ({ ...pkg, selected: true }));
      
      return {
        ...prev,
        [nodeName]: updatedNode
      };
    });
  };

  const deselectAllPackages = (nodeName) => {
    setUpdatesData(prev => {
      const updatedNode = { ...prev[nodeName] };
      updatedNode.updates = updatedNode.updates.map(pkg => ({ ...pkg, selected: false }));
      
      return {
        ...prev,
        [nodeName]: updatedNode
      };
    });
  };

  const installUpdates = async () => {
    if (!confirm('Are you sure you want to install updates on the selected nodes?')) {
      return;
    }
    
    setIsUpdating(true);
    
    // Initialize update logs
    const initialLogs = {};
    selectedNodes.forEach(nodeName => {
      initialLogs[nodeName] = '';
    });
    setUpdateLogs(initialLogs);
    
    // Install updates on each selected node
    for (const nodeName of selectedNodes) {
      const nodeData = updatesData[nodeName];
      
      // Skip nodes with no updates or no selected packages
      if (!nodeData.updates || nodeData.updates.length === 0 || 
          !nodeData.updates.some(pkg => pkg.selected)) {
        continue;
      }
      
      try {
        setUpdateLogs(prev => ({
          ...prev,
          [nodeName]: prev[nodeName] + `\nStarting update for ${nodeName}...\n`
        }));
        
        // Use SSH to run apt upgrade
        const sshResult = await window.api.sshCommand({
          host: nodeName + '.ionutlab.com',
          username: 'root',
          password: 'Poolamea01@',
          command: 'apt update && apt upgrade -y && apt autoremove -y'
        });
        
        if (sshResult.code === 0) {
          setUpdateLogs(prev => ({
            ...prev,
            [nodeName]: prev[nodeName] + sshResult.data + '\n\nUpdate completed successfully.\n'
          }));
          
          // Reset updates for this node
          setUpdatesData(prev => ({
            ...prev,
            [nodeName]: {
              ...prev[nodeName],
              updates: [],
              lastChecked: new Date()
            }
          }));
        } else {
          throw new Error(`Command failed with exit code ${sshResult.code}`);
        }
      } catch (err) {
        console.error(`Error installing updates for node ${nodeName}:`, err);
        
        setUpdateLogs(prev => ({
          ...prev,
          [nodeName]: prev[nodeName] + `\nError: ${err.message}\n`
        }));
        
        setError(`Failed to install updates for ${nodeName}: ${err.message}`);
      }
    }
    
    setIsUpdating(false);
    refreshData();
  };

  return (
    <div className="updates-manager">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Updates Manager</h1>
        <div>
          <button className="btn btn-primary me-2" onClick={checkAllUpdates} disabled={isLoading || isUpdating || selectedNodes.length === 0}>
            <i className="fas fa-sync-alt me-2"></i> Check Updates
          </button>
          <button className="btn btn-success" onClick={installUpdates} disabled={isLoading || isUpdating || selectedNodes.length === 0}>
            <i className="fas fa-download me-2"></i> Install Updates
          </button>
        </div>
      </div>
      
      {/* Node selection */}
      <div className="card mb-4">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Select Nodes</h5>
          <div>
            <button className="btn btn-sm btn-outline-primary me-2" onClick={selectAllNodes}>Select All</button>
            <button className="btn btn-sm btn-outline-secondary" onClick={deselectAllNodes}>Deselect All</button>
          </div>
        </div>
        <div className="card-body">
          <div className="row">
            {nodes.map((node) => (
              <div key={node.node} className="col-md-3 mb-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`node-${node.node}`}
                    checked={selectedNodes.includes(node.node)}
                    onChange={() => handleNodeSelection(node.node)}
                  />
                  <label className="form-check-label" htmlFor={`node-${node.node}`}>
                    {node.node}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {isUpdating ? (
        <div className="card">
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
            
            <ul className="nav nav-tabs" id="updateTabs" role="tablist">
              {selectedNodes.map((nodeName, index) => (
                <li key={nodeName} className="nav-item" role="presentation">
                  <button 
                    className={`nav-link ${index === 0 ? 'active' : ''}`}
                    id={`${nodeName}-tab`}
                    data-bs-toggle="tab"
                    data-bs-target={`#${nodeName}-content`}
                    type="button"
                    role="tab"
                    aria-controls={`${nodeName}-content`}
                    aria-selected={index === 0}
                  >
                    {nodeName}
                  </button>
                </li>
              ))}
            </ul>
            
            <div className="tab-content" id="updateTabsContent">
              {selectedNodes.map((nodeName, index) => (
                <div 
                  key={nodeName}
                  className={`tab-pane fade ${index === 0 ? 'show active' : ''}`}
                  id={`${nodeName}-content`}
                  role="tabpanel"
                  aria-labelledby={`${nodeName}-tab`}
                >
                  <pre className="update-log mt-3 p-3 bg-dark text-light">
                    {updateLogs[nodeName] || 'Waiting for update to start...'}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="row">
          {selectedNodes.map((nodeName) => {
            const nodeData = updatesData[nodeName];
            
            return (
              <div key={nodeName} className="col-md-6 mb-4">
                <div className="card h-100">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{nodeName}</h5>
                    <div>
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => checkForUpdates(nodeName)}
                        disabled={nodeData.isChecking}
                      >
                        {nodeData.isChecking ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Checking...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-sync-alt me-2"></i> Check
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {nodeData.error ? (
                      <div className="alert alert-danger">
                        Error checking updates: {nodeData.error}
                      </div>
                    ) : nodeData.isChecking ? (
                      <div className="d-flex justify-content-center my-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    ) : nodeData.updates && nodeData.updates.length > 0 ? (
                      <>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <div>
                            <span className="badge bg-info me-2">{nodeData.updates.length} updates available</span>
                            <small className="text-muted">
                              Last checked: {nodeData.lastChecked ? new Date(nodeData.lastChecked).toLocaleString() : 'Never'}
                            </small>
                          </div>
                          <div>
                            <button 
                              className="btn btn-sm btn-outline-secondary me-2"
                              onClick={() => selectAllPackages(nodeName)}
                            >
                              Select All
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => deselectAllPackages(nodeName)}
                            >
                              Deselect All
                            </button>
                          </div>
                        </div>
                        
                        <div className="update-list">
                          <table className="table table-sm table-hover">
                            <thead>
                              <tr>
                                <th width="5%"></th>
                                <th width="50%">Package</th>
                                <th width="45%">Version</th>
                              </tr>
                            </thead>
                            <tbody>
                              {nodeData.updates.map((pkg, index) => (
                                <tr key={index}>
                                  <td>
                                    <div className="form-check">
                                      <input
                                        className="form-check-input"
                                        type="checkbox"
                                        id={`pkg-${nodeName}-${index}`}
                                        checked={pkg.selected}
                                        onChange={() => togglePackageSelection(nodeName, index)}
                                      />
                                      <label className="form-check-label" htmlFor={`pkg-${nodeName}-${index}`}></label>
                                    </div>
                                  </td>
                                  <td>{pkg.name}</td>
                                  <td><small>{pkg.versionInfo}</small></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        {nodeData.lastChecked ? (
                          <>
                            <p className="mb-2"><i className="fas fa-check-circle text-success fa-3x"></i></p>
                            <p>No updates available</p>
                            <small className="text-muted">
                              Last checked: {new Date(nodeData.lastChecked).toLocaleString()}
                            </small>
                          </>
                        ) : (
                          <>
                            <p className="mb-2"><i className="fas fa-info-circle text-info fa-3x"></i></p>
                            <p>Click "Check" to search for available updates</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default UpdatesManager;
