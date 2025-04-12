import React, { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import '../styles/components.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authData, setAuthData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if there's stored auth data on app start
    const checkStoredAuth = async () => {
      try {
        const { success, config } = await window.api.loadConfig();
        
        if (success && config.authData) {
          // Validate the stored auth data with a ping to the Proxmox API
          setAuthData(config.authData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Error loading authentication data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkStoredAuth();
  }, []);

  const handleLogin = (newAuthData) => {
    setAuthData(newAuthData);
    setIsAuthenticated(true);
    
    // Save auth data to config
    window.api.saveConfig({ authData: newAuthData });
  };

  const handleLogout = () => {
    setAuthData(null);
    setIsAuthenticated(false);
    
    // Clear auth data from config
    window.api.saveConfig({ authData: null });
  };

  if (isLoading) {
    return (
      <div className="app-container loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading application...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}
      
      {isAuthenticated ? (
        <Dashboard authData={authData} onLogout={handleLogout} setError={setError} />
      ) : (
        <Login onLogin={handleLogin} setError={setError} />
      )}
    </div>
  );
}

export default App;
