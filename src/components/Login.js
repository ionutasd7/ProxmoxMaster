import React, { useState } from 'react';
import axios from 'axios';

function Login({ onLogin, setError }) {
  const [username, setUsername] = useState('api@pam!home');
  const [password, setPassword] = useState('8cd15ef7-d25b-4955-9c32-48d42e23b109');
  const [host, setHost] = useState('pve.ionutlab.com');
  const [isLoading, setIsLoading] = useState(false);
  const [remember, setRemember] = useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Verify connectivity to the Proxmox host
      const pingResult = await window.api.ping(host);
      if (!pingResult.success) {
        setError(`Cannot reach host ${host}. Please check the hostname and your network connection.`);
        setIsLoading(false);
        return;
      }
      
      // Construct API URL - Proxmox uses a ticket-based authentication
      const authUrl = `https://${host}:8006/api2/json/access/ticket`;
      
      // Get authentication ticket
      const response = await axios.post(authUrl, 
        `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          withCredentials: true
        }
      );
      
      if (response.data && response.data.data) {
        const { ticket, CSRFPreventionToken } = response.data.data;
        
        // Store the authentication data
        const authData = {
          host,
          username,
          ticket,
          CSRFPreventionToken,
          timestamp: new Date().getTime()
        };
        
        onLogin(authData);
      } else {
        setError('Invalid response from server. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response && err.response.status === 401) {
        setError('Invalid username or password.');
      } else {
        setError(`Connection error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="card login-card">
        <div className="card-header bg-primary text-white">
          <h3>Proxmox Infrastructure Manager</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="host" className="form-label">Proxmox Host</label>
              <input
                type="text"
                className="form-control"
                id="host"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
              <div className="form-text">Enter your Proxmox host address (e.g., pve.ionutlab.com)</div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="username" className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="mb-3 form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="remember">Remember credentials</label>
            </div>
            
            <button type="submit" className="btn btn-primary w-100" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Connecting...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>
        </div>
        <div className="card-footer text-muted">
          <div className="d-flex justify-content-between">
            <span>v1.0.0</span>
            <span>© 2023 Proxmox Manager</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
