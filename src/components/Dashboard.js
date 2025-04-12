import React, { useState, useEffect } from 'react';
import NodesOverview from './NodesOverview';
import NodeDetails from './NodeDetails';
import VMList from './VMList';
import VMCreate from './VMCreate';
import LXCList from './LXCList';
import LXCCreate from './LXCCreate';
import UpdatesManager from './UpdatesManager';
import NetworkManager from './NetworkManager';
import AppManager from './AppManager';
import Settings from './Settings';

function Dashboard({ authData, onLogout, setError }) {
  const [activeView, setActiveView] = useState('nodes');
  const [selectedNode, setSelectedNode] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Function to refresh data
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchNodes = async () => {
      setIsLoading(true);
      try {
        // Fetch nodes data from Proxmox API
        const response = await fetch(`https://${authData.host}:8006/api2/json/nodes`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch nodes: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.data) {
          setNodes(data.data);
          // If no node is selected yet, select the first one
          if (!selectedNode && data.data.length > 0) {
            setSelectedNode(data.data[0].node);
          }
        } else {
          setError('Invalid response format from Proxmox API');
        }
      } catch (err) {
        console.error('Error fetching nodes:', err);
        setError(`Failed to fetch nodes: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNodes();
  }, [authData, refreshTrigger]);

  // Handle navigation
  const handleNavigation = (view, node = null) => {
    setActiveView(view);
    if (node) {
      setSelectedNode(node);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h3>Proxmox Manager</h3>
        </div>
        
        <div className="sidebar-menu">
          <div className="sidebar-section">
            <h6>Infrastructure</h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'nodes' ? 'active' : ''}`}
                  onClick={() => handleNavigation('nodes')}
                >
                  <i className="fas fa-server me-2"></i> Nodes Overview
                </button>
              </li>
              {selectedNode && (
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeView === 'nodeDetails' ? 'active' : ''}`}
                    onClick={() => handleNavigation('nodeDetails')}
                  >
                    <i className="fas fa-info-circle me-2"></i> Node Details
                  </button>
                </li>
              )}
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h6>Virtual Machines</h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'vmList' ? 'active' : ''}`}
                  onClick={() => handleNavigation('vmList')}
                >
                  <i className="fas fa-desktop me-2"></i> VM List
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'vmCreate' ? 'active' : ''}`}
                  onClick={() => handleNavigation('vmCreate')}
                >
                  <i className="fas fa-plus-circle me-2"></i> Create VM
                </button>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h6>Containers</h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'lxcList' ? 'active' : ''}`}
                  onClick={() => handleNavigation('lxcList')}
                >
                  <i className="fas fa-box me-2"></i> LXC List
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'lxcCreate' ? 'active' : ''}`}
                  onClick={() => handleNavigation('lxcCreate')}
                >
                  <i className="fas fa-plus-circle me-2"></i> Create LXC
                </button>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h6>Management</h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'updates' ? 'active' : ''}`}
                  onClick={() => handleNavigation('updates')}
                >
                  <i className="fas fa-sync me-2"></i> Updates
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'network' ? 'active' : ''}`}
                  onClick={() => handleNavigation('network')}
                >
                  <i className="fas fa-network-wired me-2"></i> Network
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'apps' ? 'active' : ''}`}
                  onClick={() => handleNavigation('apps')}
                >
                  <i className="fas fa-th-large me-2"></i> Applications
                </button>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h6>System</h6>
            <ul className="nav flex-column">
              <li className="nav-item">
                <button 
                  className={`nav-link ${activeView === 'settings' ? 'active' : ''}`}
                  onClick={() => handleNavigation('settings')}
                >
                  <i className="fas fa-cog me-2"></i> Settings
                </button>
              </li>
              <li className="nav-item">
                <button 
                  className="nav-link text-danger"
                  onClick={onLogout}
                >
                  <i className="fas fa-sign-out-alt me-2"></i> Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="main-content">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center h-100">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Conditional render based on activeView */}
            {activeView === 'nodes' && (
              <NodesOverview 
                nodes={nodes} 
                onSelectNode={(node) => handleNavigation('nodeDetails', node)} 
                refreshData={refreshData}
                authData={authData}
                setError={setError}
              />
            )}
            
            {activeView === 'nodeDetails' && selectedNode && (
              <NodeDetails 
                node={selectedNode} 
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'vmList' && (
              <VMList 
                nodes={nodes}
                selectedNode={selectedNode}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'vmCreate' && (
              <VMCreate 
                nodes={nodes}
                selectedNode={selectedNode}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'lxcList' && (
              <LXCList 
                nodes={nodes}
                selectedNode={selectedNode}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'lxcCreate' && (
              <LXCCreate 
                nodes={nodes}
                selectedNode={selectedNode}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'updates' && (
              <UpdatesManager 
                nodes={nodes}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'network' && (
              <NetworkManager 
                nodes={nodes}
                selectedNode={selectedNode}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'apps' && (
              <AppManager 
                nodes={nodes}
                selectedNode={selectedNode}
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
            
            {activeView === 'settings' && (
              <Settings 
                authData={authData}
                refreshData={refreshData}
                setError={setError}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
