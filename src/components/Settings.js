import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings({ authData, refreshData, setError }) {
  const [isLoading, setIsLoading] = useState(false);
  const [userSettings, setUserSettings] = useState({
    apiUsername: authData.username || '',
    apiHost: authData.host || '',
    sshUsername: 'root',
    sshPassword: 'Poolamea01@',
    refreshInterval: 30, // seconds
    theme: 'light',
    confirmDangerousActions: true,
    showNotifications: true
  });
  const [savedSettings, setSavedSettings] = useState(null);
  
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.loadConfig();
      
      if (result.success && result.config) {
        // Merge saved settings with current settings
        const mergedSettings = {
          ...userSettings,
          ...result.config.settings
        };
        
        setUserSettings(mergedSettings);
        setSavedSettings(mergedSettings);
      }
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(`Failed to load settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    try {
      // Save settings
      const result = await window.api.saveConfig({
        authData, // Preserve auth data
        settings: userSettings // Save user settings
      });
      
      if (result.success) {
        setError('Settings saved successfully');
        setSavedSettings(userSettings);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(`Failed to save settings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      // Test API connection
      const apiUrl = `https://${userSettings.apiHost}:8006/api2/json/version`;
      
      try {
        const response = await axios.get(apiUrl);
        setError('API connection successful! ' + (response.data?.data?.version || ''));
      } catch (err) {
        setError(`API connection failed: ${err.message}`);
      }
      
      // Test SSH connection
      try {
        const sshResult = await window.api.sshCommand({
          host: userSettings.apiHost,
          username: userSettings.sshUsername,
          password: userSettings.sshPassword,
          command: 'hostname'
        });
        
        if (sshResult.code === 0) {
          setError(`SSH connection successful! Connected to: ${sshResult.data.trim()}`);
        } else {
          setError(`SSH connection failed with code ${sshResult.code}`);
        }
      } catch (err) {
        setError(`SSH connection failed: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset to the saved settings?')) {
      setUserSettings(savedSettings || userSettings);
    }
  };

  const hasPendingChanges = () => {
    if (!savedSettings) return false;
    
    return JSON.stringify(savedSettings) !== JSON.stringify(userSettings);
  };

  return (
    <div className="settings">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Settings</h1>
        <div>
          <button 
            className="btn btn-primary me-2" 
            onClick={handleSaveSettings}
            disabled={isLoading || !hasPendingChanges()}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i> Save Settings
              </>
            )}
          </button>
          <button 
            className="btn btn-outline-secondary me-2" 
            onClick={handleReset}
            disabled={isLoading || !hasPendingChanges()}
          >
            <i className="fas fa-undo me-2"></i> Reset
          </button>
          <button 
            className="btn btn-info" 
            onClick={checkConnection}
            disabled={isLoading}
          >
            <i className="fas fa-network-wired me-2"></i> Test Connection
          </button>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">API Configuration</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="apiHost" className="form-label">Proxmox Host</label>
                <input
                  type="text"
                  className="form-control"
                  id="apiHost"
                  name="apiHost"
                  value={userSettings.apiHost}
                  onChange={handleInputChange}
                />
                <div className="form-text">Hostname of your Proxmox server (e.g., pve.ionutlab.com)</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="apiUsername" className="form-label">API Username</label>
                <input
                  type="text"
                  className="form-control"
                  id="apiUsername"
                  name="apiUsername"
                  value={userSettings.apiUsername}
                  onChange={handleInputChange}
                />
                <div className="form-text">API user (e.g., api@pam!home)</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="refreshInterval" className="form-label">Auto-refresh Interval (seconds)</label>
                <input
                  type="number"
                  className="form-control"
                  id="refreshInterval"
                  name="refreshInterval"
                  value={userSettings.refreshInterval}
                  onChange={handleInputChange}
                  min="5"
                  max="300"
                />
                <div className="form-text">How often to refresh data (0 to disable)</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">SSH Configuration</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="sshUsername" className="form-label">SSH Username</label>
                <input
                  type="text"
                  className="form-control"
                  id="sshUsername"
                  name="sshUsername"
                  value={userSettings.sshUsername}
                  onChange={handleInputChange}
                />
                <div className="form-text">Username for SSH connection (default: root)</div>
              </div>
              
              <div className="mb-3">
                <label htmlFor="sshPassword" className="form-label">SSH Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="sshPassword"
                  name="sshPassword"
                  value={userSettings.sshPassword}
                  onChange={handleInputChange}
                />
                <div className="form-text">Password for SSH connection</div>
              </div>
              
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                SSH credentials are stored locally. Make sure your computer is secure.
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">User Interface</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="theme" className="form-label">Theme</label>
                <select
                  className="form-select"
                  id="theme"
                  name="theme"
                  value={userSettings.theme}
                  onChange={handleInputChange}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System Default</option>
                </select>
              </div>
              
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="confirmDangerousActions"
                  name="confirmDangerousActions"
                  checked={userSettings.confirmDangerousActions}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="confirmDangerousActions">
                  Confirm dangerous actions
                </label>
              </div>
              
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="showNotifications"
                  name="showNotifications"
                  checked={userSettings.showNotifications}
                  onChange={handleInputChange}
                />
                <label className="form-check-label" htmlFor="showNotifications">
                  Show desktop notifications
                </label>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">About</h5>
            </div>
            <div className="card-body">
              <h4>Proxmox Infrastructure Manager</h4>
              <p>Version 1.0.0</p>
              <p>A desktop application to manage your Proxmox infrastructure</p>
              <p>Features:</p>
              <ul>
                <li>Deploy and manage VMs and LXC containers</li>
                <li>Apply updates to VMs, containers, and nodes</li>
                <li>Manage network configuration</li>
                <li>Install and manage applications on containers</li>
              </ul>
              <p className="text-muted">&copy; 2023 Proxmox Manager</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
