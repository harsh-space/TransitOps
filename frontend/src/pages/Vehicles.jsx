import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, AlertCircle, RefreshCw } from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';

const VEHICLE_TYPE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Mini', label: 'Mini' }
];

const VEHICLE_STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'On Trip', label: 'On Trip' },
  { value: 'In Shop', label: 'In Shop' },
  { value: 'Retired', label: 'Retired' }
];

const VEHICLE_REGION_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Bangalore', label: 'Bangalore' },
  { value: 'North', label: 'North' },
  { value: 'South', label: 'South' },
  { value: 'West', label: 'West' },
  { value: 'East', label: 'East' }
];

const API_BASE_URL = 'http://localhost:5000/api';

export default function Vehicles({ token }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // User Info (from localStorage)
  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => {
    const stored = localStorage.getItem('transitops_user');
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored));
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  const isFleetManager = currentUser?.role === 'FleetManager';

  // Filters State
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    registrationNumber: '',
    name: '',
    type: 'Van',
    maxLoadCapacityKg: '',
    odometer: '',
    acquisitionCost: '',
    region: '',
    status: 'Available'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Vehicles
  useEffect(() => {
    let active = true;
    const fetchVehicles = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch vehicles.');
        }
        if (active) {
          setVehicles(result.data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError(err.message || 'Connection error.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchVehicles();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  // Handle Add Form Submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create vehicle.');
      }

      setShowAddModal(false);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Form Submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/vehicles/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update vehicle.');
      }

      setShowEditModal(false);
      setSelectedVehicle(null);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Vehicle
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to decommission/delete this vehicle?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete vehicle.');
      }
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      registrationNumber: '',
      name: '',
      type: 'Van',
      maxLoadCapacityKg: '',
      odometer: '',
      acquisitionCost: '',
      region: '',
      status: 'Available'
    });
    setFormError('');
  };

  const openEditModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      name: vehicle.name,
      type: vehicle.type,
      maxLoadCapacityKg: vehicle.maxLoadCapacityKg,
      odometer: vehicle.odometer,
      acquisitionCost: vehicle.acquisitionCost,
      region: vehicle.region,
      status: vehicle.status
    });
    setShowEditModal(true);
  };

  // Filter Logic
  const filteredVehicles = vehicles.filter(v => {
    const searchMatch = v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
                        v.name.toLowerCase().includes(search.toLowerCase()) ||
                        v.region.toLowerCase().includes(search.toLowerCase());
    
    const typeMatch = filterType === 'All' || v.type === filterType;
    const statusMatch = filterStatus === 'All' || v.status === filterStatus;
    const regionMatch = filterRegion === 'All' || v.region.toLowerCase().includes(filterRegion.toLowerCase());

    return searchMatch && typeMatch && statusMatch && regionMatch;
  });

  // Extract unique regions for filter
  const regionsList = ['All', ...new Set(vehicles.map(v => {
    // Standardize to basic regions for ease of filter (e.g. Bangalore hubs)
    if (v.region.includes('Bangalore')) return 'Bangalore';
    return v.region;
  }))];

  if (loading && vehicles.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading Vehicle Registry...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Vehicle Registry</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage the transport fleet lifecycle, properties, and statuses</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="btn-logout"
            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          
          {isFleetManager && (
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto', borderRadius: '6px' }}
            >
              <Plus size={16} /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Error loading registry data.</strong>
            <p style={{ fontSize: '0.85rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Filters Row */}
      <div className="filters-row" style={{ flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Search</label>
          <input 
            type="text" 
            placeholder="Search Model, Reg No, Region..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-primary)',
              fontSize: '0.85rem'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          <CustomDropdown 
            label="Type" 
            options={VEHICLE_TYPE_OPTIONS} 
            value={filterType} 
            onChange={setFilterType} 
          />
          <CustomDropdown 
            label="Status" 
            options={VEHICLE_STATUS_OPTIONS} 
            value={filterStatus} 
            onChange={setFilterStatus} 
          />
          <CustomDropdown 
            label="Region" 
            options={VEHICLE_REGION_OPTIONS} 
            value={filterRegion} 
            onChange={setFilterRegion} 
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="dashboard-panel" style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Registration No</th>
                <th>Model Name</th>
                <th>Type</th>
                <th>Max Capacity</th>
                <th>Odometer</th>
                <th>Acquisition Cost</th>
                <th>Region</th>
                <th>Status</th>
                {isFleetManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={isFleetManager ? 9 : 8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
                    No vehicles registered matching this filter.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map(vehicle => (
                  <tr key={vehicle._id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{vehicle.registrationNumber}</td>
                    <td style={{ fontWeight: 500 }}>{vehicle.name}</td>
                    <td>{vehicle.type}</td>
                    <td>{vehicle.maxLoadCapacityKg} kg</td>
                    <td>{vehicle.odometer.toLocaleString()} km</td>
                    <td>₹{vehicle.acquisitionCost.toLocaleString()}</td>
                    <td>{vehicle.region}</td>
                    <td>
                      <span className={`status-badge ${vehicle.status.toLowerCase().replace(' ', '-')}`}>
                        {vehicle.status}
                      </span>
                    </td>
                    {isFleetManager && (
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button 
                            onClick={() => openEditModal(vehicle)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
                            title="Edit Vehicle"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(vehicle._id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#ef4444' }}
                            title="Delete/Decommission"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD VEHICLE MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Onboard New Vehicle</h3>

            {formError && (
              <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Reg Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. KA-01-MJ-5005"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Model Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. VAN-05"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <CustomDropdown
                    options={VEHICLE_TYPE_OPTIONS.filter(o => o.value !== 'All')}
                    value={formData.type}
                    onChange={(val) => setFormData({...formData, type: val})}
                    width="100%"
                  />
                </div>
                <div className="form-group">
                  <label>Max Load Capacity (kg) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="e.g. 500"
                    value={formData.maxLoadCapacityKg}
                    onChange={(e) => setFormData({...formData, maxLoadCapacityKg: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Current Odometer (km) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="e.g. 12000"
                    value={formData.odometer}
                    onChange={(e) => setFormData({...formData, odometer: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Acquisition Cost (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="e.g. 1500000"
                    value={formData.acquisitionCost}
                    onChange={(e) => setFormData({...formData, acquisitionCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Region *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. North Bangalore"
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <CustomDropdown
                    options={VEHICLE_STATUS_OPTIONS.filter(o => o.value !== 'All')}
                    value={formData.status}
                    onChange={(val) => setFormData({...formData, status: val})}
                    width="100%"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.5rem' }} disabled={submitting}>
                  {submitting ? 'Registering...' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT VEHICLE MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              Edit Vehicle: {selectedVehicle?.registrationNumber}
            </h3>

            {formError && (
              <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Reg Number *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Model Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Vehicle Type *</label>
                  <CustomDropdown
                    options={VEHICLE_TYPE_OPTIONS.filter(o => o.value !== 'All')}
                    value={formData.type}
                    onChange={(val) => setFormData({...formData, type: val})}
                    width="100%"
                  />
                </div>
                <div className="form-group">
                  <label>Max Load Capacity (kg) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.maxLoadCapacityKg}
                    onChange={(e) => setFormData({...formData, maxLoadCapacityKg: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Odometer (km) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.odometer}
                    onChange={(e) => setFormData({...formData, odometer: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Acquisition Cost (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    value={formData.acquisitionCost}
                    onChange={(e) => setFormData({...formData, acquisitionCost: e.target.value})}
                  />
                </div>
              </div>

              <div className="modal-form-grid">
                <div className="form-group">
                  <label>Region *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <CustomDropdown
                    options={VEHICLE_STATUS_OPTIONS.filter(o => o.value !== 'All')}
                    value={formData.status}
                    onChange={(val) => setFormData({...formData, status: val})}
                    width="100%"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
                    padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  style={{ width: 'auto', padding: '0.5rem 1.5rem', borderRadius: '6px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
