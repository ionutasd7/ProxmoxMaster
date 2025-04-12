import React, { useState, useEffect } from 'react';
import axios from 'axios';

function LXCCreate({ nodes, selectedNode, authData, refreshData, setError }) {
  const [activeNode, setActiveNode] = useState(selectedNode || (nodes.length > 0 ? nodes[0].node : null));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageList, setStorageList] = useState([]);
  const [templateList, setTemplateList] = useState([]);
  
  // OS templates
  const [osTypes] = useState([
    { value: 'alpine', label: 'Alpine' },
    { value: 'archlinux', label: 'Arch Linux' },
    { value: 'centos', label: 'CentOS' },
    { value: 'debian', label: 'Debian' },
    { value: 'fedora', label: 'Fedora' },
    { value: 'gentoo', label: 'Gentoo' },
    { value: 'opensuse', label: 'openSUSE' },
    { value: 'ubuntu', label: 'Ubuntu' },
    { value: 'other', label: 'Other' }
  ]);

  // Form state
  const [formData, setFormData] = useState({
    vmid: '',
    hostname: '',
    cores: '1',
    memory: '512',
    swap: '512',
    ostype: 'debian',
    ostemplate: '',
    storage: '',
    diskSize: '8',
    password: '',
    ssh_public_keys: '',
    unprivileged: true,
    start: true,
    netif: 'name=eth0,bridge=vmbr0,ip=dhcp'
  });

  useEffect(() => {
    const fetchStorage = async () => {
      if (!activeNode) return;

      setIsLoading(true);
      try {
        // Fetch storage list
        const storageResponse = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${activeNode}/storage`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (storageResponse.data && storageResponse.data.data) {
          // Filter storage that can contain container templates
          const validStorage = storageResponse.data.data.filter(
            storage => storage.content && (storage.content.includes('vztmpl') || storage.content.includes('rootdir'))
          );
          setStorageList(validStorage);
          
          if (validStorage.length > 0) {
            setFormData(prev => ({ ...prev, storage: validStorage[0].storage }));
          }
        }
        
        // Fetch available templates
        const templateResponse = await axios.get(`https://${authData.host}:8006/api2/json/nodes/${activeNode}/aplinfo`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (templateResponse.data && templateResponse.data.data) {
          setTemplateList(templateResponse.data.data);
          
          // Set first Debian template as default if available
          const debianTemplates = templateResponse.data.data.filter(tpl => tpl.os === 'debian');
          if (debianTemplates.length > 0) {
            setFormData(prev => ({ ...prev, ostemplate: debianTemplates[0].template }));
          } else if (templateResponse.data.data.length > 0) {
            setFormData(prev => ({ ...prev, ostemplate: templateResponse.data.data[0].template }));
          }
        }
      } catch (err) {
        console.error(`Error fetching data for node ${activeNode}:`, err);
        setError(`Failed to fetch data: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Generate a new VMID
    const generateVMID = async () => {
      try {
        const response = await axios.get(`https://${authData.host}:8006/api2/json/cluster/nextid`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (response.data && response.data.data) {
          setFormData(prev => ({ ...prev, vmid: response.data.data }));
        }
      } catch (err) {
        console.error('Error generating VMID:', err);
        // Default to 100 as a fallback
        setFormData(prev => ({ ...prev, vmid: '100' }));
      }
    };

    fetchStorage();
    generateVMID();
  }, [activeNode, authData]);

  const handleNodeChange = (e) => {
    setActiveNode(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOsTypeChange = (e) => {
    const selectedOsType = e.target.value;
    setFormData(prev => ({ ...prev, ostype: selectedOsType }));
    
    // Filter templates based on selected OS type
    const filteredTemplates = templateList.filter(tpl => tpl.os === selectedOsType);
    if (filteredTemplates.length > 0) {
      setFormData(prev => ({ ...prev, ostemplate: filteredTemplates[0].template }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to create this container?')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the API request data
      const apiData = new URLSearchParams();
      apiData.append('vmid', formData.vmid);
      apiData.append('hostname', formData.hostname);
      apiData.append('cores', formData.cores);
      apiData.append('memory', formData.memory);
      apiData.append('swap', formData.swap);
      apiData.append('ostype', formData.ostype);
      apiData.append('ostemplate', formData.ostemplate);
      apiData.append('storage', formData.storage);
      apiData.append('rootfs', `${formData.storage}:${formData.diskSize}`);
      apiData.append('password', formData.password);
      apiData.append('ssh-public-keys', formData.ssh_public_keys);
      apiData.append('unprivileged', formData.unprivileged ? '1' : '0');
      apiData.append('start', formData.start ? '1' : '0');
      apiData.append('net0', formData.netif);
      
      // Create the LXC container
      const response = await axios.post(
        `https://${authData.host}:8006/api2/json/nodes/${activeNode}/lxc`, 
        apiData.toString(),
        {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`,
            'CSRFPreventionToken': authData.CSRFPreventionToken,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      if (response.data && response.data.data) {
        setError(`Container created successfully with ID: ${formData.vmid}`);
        
        // Reset form
        setFormData({
          vmid: '',
          hostname: '',
          cores: '1',
          memory: '512',
          swap: '512',
          ostype: 'debian',
          ostemplate: formData.ostemplate,
          storage: formData.storage,
          diskSize: '8',
          password: '',
          ssh_public_keys: '',
          unprivileged: true,
          start: true,
          netif: 'name=eth0,bridge=vmbr0,ip=dhcp'
        });
        
        // Generate a new VMID
        const nextIdResponse = await axios.get(`https://${authData.host}:8006/api2/json/cluster/nextid`, {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        });
        
        if (nextIdResponse.data && nextIdResponse.data.data) {
          setFormData(prev => ({ ...prev, vmid: nextIdResponse.data.data }));
        }
        
        // Refresh container list
        refreshData();
      }
    } catch (err) {
      console.error('Error creating container:', err);
      setError(`Failed to create container: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFilteredTemplates = () => {
    if (!templateList || templateList.length === 0) return [];
    
    return templateList.filter(tpl => formData.ostype === 'other' || tpl.os === formData.ostype);
  };

  return (
    <div className="lxc-create">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create LXC Container</h1>
        <select
          className="form-select w-auto"
          value={activeNode}
          onChange={handleNodeChange}
        >
          {nodes.map((node) => (
            <option key={node.node} value={node.node}>
              {node.node}
            </option>
          ))}
        </select>
      </div>
      
      {isLoading ? (
        <div className="d-flex justify-content-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="row">
                {/* General Settings */}
                <div className="col-md-6">
                  <h4 className="mb-3">General Settings</h4>
                  
                  <div className="mb-3">
                    <label htmlFor="vmid" className="form-label">Container ID</label>
                    <input
                      type="number"
                      className="form-control"
                      id="vmid"
                      name="vmid"
                      value={formData.vmid}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="form-text">Unique ID for the container</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="hostname" className="form-label">Hostname</label>
                    <input
                      type="text"
                      className="form-control"
                      id="hostname"
                      name="hostname"
                      value={formData.hostname}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="form-text">Hostname of the container</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">Root Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="form-text">Root password for the container</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="ssh_public_keys" className="form-label">SSH Public Keys</label>
                    <textarea
                      className="form-control"
                      id="ssh_public_keys"
                      name="ssh_public_keys"
                      value={formData.ssh_public_keys}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Paste your SSH public key here"
                    ></textarea>
                    <div className="form-text">Optional: SSH public key for root user</div>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="unprivileged"
                      name="unprivileged"
                      checked={formData.unprivileged}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="unprivileged">Unprivileged Container</label>
                    <div className="form-text">Run as unprivileged container (recommended)</div>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="start"
                      name="start"
                      checked={formData.start}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="start">Start after creation</label>
                  </div>
                </div>
                
                {/* Resources */}
                <div className="col-md-6">
                  <h4 className="mb-3">Resources & Template</h4>
                  
                  <div className="mb-3">
                    <label htmlFor="cores" className="form-label">CPU Cores</label>
                    <select
                      className="form-select"
                      id="cores"
                      name="cores"
                      value={formData.cores}
                      onChange={handleInputChange}
                      required
                    >
                      {[1, 2, 4, 6, 8, 12, 16].map(cores => (
                        <option key={cores} value={cores}>{cores}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="memory" className="form-label">Memory (MB)</label>
                    <select
                      className="form-select"
                      id="memory"
                      name="memory"
                      value={formData.memory}
                      onChange={handleInputChange}
                      required
                    >
                      {[256, 512, 1024, 2048, 4096, 8192, 16384].map(memory => (
                        <option key={memory} value={memory}>{memory} MB ({(memory/1024).toFixed(1)} GB)</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="swap" className="form-label">Swap (MB)</label>
                    <select
                      className="form-select"
                      id="swap"
                      name="swap"
                      value={formData.swap}
                      onChange={handleInputChange}
                    >
                      <option value="0">No Swap</option>
                      {[256, 512, 1024, 2048, 4096].map(swap => (
                        <option key={swap} value={swap}>{swap} MB ({(swap/1024).toFixed(1)} GB)</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="storage" className="form-label">Storage</label>
                    <select
                      className="form-select"
                      id="storage"
                      name="storage"
                      value={formData.storage}
                      onChange={handleInputChange}
                      required
                    >
                      {storageList.map(storage => (
                        <option key={storage.storage} value={storage.storage}>{storage.storage} ({storage.type})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="diskSize" className="form-label">Disk Size (GB)</label>
                    <select
                      className="form-select"
                      id="diskSize"
                      name="diskSize"
                      value={formData.diskSize}
                      onChange={handleInputChange}
                      required
                    >
                      {[1, 2, 4, 8, 16, 32, 64, 128].map(size => (
                        <option key={size} value={size}>{size} GB</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="ostype" className="form-label">OS Type</label>
                    <select
                      className="form-select"
                      id="ostype"
                      name="ostype"
                      value={formData.ostype}
                      onChange={handleOsTypeChange}
                      required
                    >
                      {osTypes.map(os => (
                        <option key={os.value} value={os.value}>{os.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="ostemplate" className="form-label">Template</label>
                    <select
                      className="form-select"
                      id="ostemplate"
                      name="ostemplate"
                      value={formData.ostemplate}
                      onChange={handleInputChange}
                      required
                    >
                      {getFilteredTemplates().length > 0 ? (
                        getFilteredTemplates().map(tpl => (
                          <option key={tpl.template} value={tpl.template}>
                            {tpl.os} {tpl.version} ({tpl.section})
                          </option>
                        ))
                      ) : (
                        <option value="">No templates available</option>
                      )}
                    </select>
                    {getFilteredTemplates().length === 0 && (
                      <div className="form-text text-warning">No templates found for selected OS type.</div>
                    )}
                  </div>
                </div>
                
                {/* Network Settings */}
                <div className="col-12 mt-4">
                  <h4 className="mb-3">Network Settings</h4>
                  
                  <div className="mb-3">
                    <label htmlFor="netif" className="form-label">Network Interface</label>
                    <input
                      type="text"
                      className="form-control"
                      id="netif"
                      name="netif"
                      value={formData.netif}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="form-text">Format: name=eth0,bridge=vmbr0,ip=dhcp or name=eth0,bridge=vmbr0,ip=192.168.1.100/24,gw=192.168.1.1</div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="col-12 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={isSubmitting || getFilteredTemplates().length === 0}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating Container...
                      </>
                    ) : (
                      'Create Container'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LXCCreate;
