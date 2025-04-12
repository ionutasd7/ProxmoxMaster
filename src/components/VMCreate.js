import React, { useState, useEffect } from 'react';
import axios from 'axios';

function VMCreate({ nodes, selectedNode, authData, refreshData, setError }) {
  const [activeNode, setActiveNode] = useState(selectedNode || (nodes.length > 0 ? nodes[0].node : null));
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageList, setStorageList] = useState([]);
  const [isoList, setIsoList] = useState([]);
  const [osList, setOSList] = useState([
    { value: 'win10', label: 'Windows 10/2019' },
    { value: 'win11', label: 'Windows 11/2022' },
    { value: 'ubuntu', label: 'Ubuntu' },
    { value: 'debian', label: 'Debian' },
    { value: 'centos', label: 'CentOS' },
    { value: 'other', label: 'Other' }
  ]);

  // Form state
  const [formData, setFormData] = useState({
    vmid: '',
    name: '',
    cores: '1',
    memory: '1024',
    ostype: 'other',
    storage: '',
    diskSize: '32',
    iso: '',
    startAtBoot: true,
    useCloud: false,
    cloudImage: '',
    sshKeys: ''
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
          // Filter storage that can contain disk images
          const validStorage = storageResponse.data.data.filter(
            storage => storage.content && (storage.content.includes('images') || storage.content.includes('rootdir'))
          );
          setStorageList(validStorage);
          
          if (validStorage.length > 0) {
            setFormData(prev => ({ ...prev, storage: validStorage[0].storage }));
            
            // Fetch ISOs for the first storage
            const contentResponse = await axios.get(
              `https://${authData.host}:8006/api2/json/nodes/${activeNode}/storage/${validStorage[0].storage}/content`, 
              {
                headers: {
                  'Authorization': `PVEAuthCookie=${authData.ticket}`
                }
              }
            );
            
            if (contentResponse.data && contentResponse.data.data) {
              // Filter for ISOs
              const isos = contentResponse.data.data.filter(
                item => item.content === 'iso'
              );
              setIsoList(isos);
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching storage for node ${activeNode}:`, err);
        setError(`Failed to fetch storage: ${err.message}`);
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

  const handleStorageChange = async (e) => {
    const selectedStorage = e.target.value;
    setFormData(prev => ({ ...prev, storage: selectedStorage }));
    
    // Fetch ISOs for the selected storage
    try {
      setIsLoading(true);
      const contentResponse = await axios.get(
        `https://${authData.host}:8006/api2/json/nodes/${activeNode}/storage/${selectedStorage}/content`, 
        {
          headers: {
            'Authorization': `PVEAuthCookie=${authData.ticket}`
          }
        }
      );
      
      if (contentResponse.data && contentResponse.data.data) {
        // Filter for ISOs
        const isos = contentResponse.data.data.filter(
          item => item.content === 'iso'
        );
        setIsoList(isos);
        
        if (isos.length > 0) {
          setFormData(prev => ({ ...prev, iso: isos[0].volid }));
        } else {
          setFormData(prev => ({ ...prev, iso: '' }));
        }
      }
    } catch (err) {
      console.error(`Error fetching ISOs for storage ${selectedStorage}:`, err);
      setError(`Failed to fetch ISOs: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!confirm('Are you sure you want to create this VM?')) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare the API request data
      const apiData = new URLSearchParams();
      apiData.append('vmid', formData.vmid);
      apiData.append('name', formData.name);
      apiData.append('cores', formData.cores);
      apiData.append('memory', formData.memory);
      apiData.append('ostype', formData.ostype);
      apiData.append('storage', formData.storage);
      apiData.append('disk', `${formData.storage}:${formData.diskSize}`);
      apiData.append('start', '0'); // Don't start the VM automatically after creation
      apiData.append('onboot', formData.startAtBoot ? '1' : '0');
      
      if (formData.useCloud) {
        // Cloud-init settings
        apiData.append('agent', '1');
        apiData.append('ide2', `${formData.storage}:cloudinit`);
        if (formData.sshKeys) {
          apiData.append('sshkeys', encodeURIComponent(formData.sshKeys));
        }
      } else {
        // Standard ISO installation
        apiData.append('ide2', `${formData.iso},media=cdrom`);
      }
      
      // Create the VM
      const response = await axios.post(
        `https://${authData.host}:8006/api2/json/nodes/${activeNode}/qemu`, 
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
        setError(`VM created successfully with ID: ${formData.vmid}`);
        
        // Reset form
        setFormData({
          vmid: '',
          name: '',
          cores: '1',
          memory: '1024',
          ostype: 'other',
          storage: formData.storage,
          diskSize: '32',
          iso: formData.iso,
          startAtBoot: true,
          useCloud: false,
          cloudImage: '',
          sshKeys: ''
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
        
        // Refresh VM list
        refreshData();
      }
    } catch (err) {
      console.error('Error creating VM:', err);
      setError(`Failed to create VM: ${err.response?.data?.message || err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="vm-create">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Create Virtual Machine</h1>
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
                    <label htmlFor="vmid" className="form-label">VM ID</label>
                    <input
                      type="number"
                      className="form-control"
                      id="vmid"
                      name="vmid"
                      value={formData.vmid}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="form-text">Unique ID for the VM</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                    <div className="form-text">Name of the VM</div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="ostype" className="form-label">OS Type</label>
                    <select
                      className="form-select"
                      id="ostype"
                      name="ostype"
                      value={formData.ostype}
                      onChange={handleInputChange}
                      required
                    >
                      {osList.map(os => (
                        <option key={os.value} value={os.value}>{os.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="startAtBoot"
                      name="startAtBoot"
                      checked={formData.startAtBoot}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="startAtBoot">Start at Boot</label>
                  </div>
                </div>
                
                {/* Resources */}
                <div className="col-md-6">
                  <h4 className="mb-3">Resources</h4>
                  
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
                      {[512, 1024, 2048, 4096, 8192, 16384, 32768].map(memory => (
                        <option key={memory} value={memory}>{memory} MB ({(memory/1024).toFixed(1)} GB)</option>
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
                      onChange={handleStorageChange}
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
                      {[8, 16, 32, 64, 128, 256, 512, 1024].map(size => (
                        <option key={size} value={size}>{size} GB</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Installation */}
                <div className="col-12 mt-4">
                  <h4 className="mb-3">Installation Method</h4>
                  
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="useCloud"
                      name="useCloud"
                      checked={formData.useCloud}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="useCloud">Use Cloud-Init</label>
                  </div>
                  
                  {formData.useCloud ? (
                    <div className="mb-3">
                      <label htmlFor="sshKeys" className="form-label">SSH Public Keys</label>
                      <textarea
                        className="form-control"
                        id="sshKeys"
                        name="sshKeys"
                        value={formData.sshKeys}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Paste your SSH public key here"
                      ></textarea>
                      <div className="form-text">Optional: SSH public key for Cloud-Init</div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      <label htmlFor="iso" className="form-label">ISO Image</label>
                      <select
                        className="form-select"
                        id="iso"
                        name="iso"
                        value={formData.iso}
                        onChange={handleInputChange}
                        required={!formData.useCloud}
                      >
                        <option value="">Select an ISO image</option>
                        {isoList.map(iso => (
                          <option key={iso.volid} value={iso.volid}>{iso.volid.split('/')[1]}</option>
                        ))}
                      </select>
                      {isoList.length === 0 && (
                        <div className="form-text text-warning">No ISO images found in selected storage. Please upload an ISO first.</div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Submit Button */}
                <div className="col-12 mt-4">
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100"
                    disabled={isSubmitting || (isoList.length === 0 && !formData.useCloud)}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating VM...
                      </>
                    ) : (
                      'Create VM'
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

export default VMCreate;
