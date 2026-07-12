import React, { useState, useEffect } from 'react';
import { Loader2, Plus, Edit2, Trash2, AlertCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';

const LICENSE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'LMV', label: 'LMV' },
  { value: 'HMV', label: 'HMV' }
];

const DRIVER_STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'On Trip', label: 'On Trip' },
  { value: 'Off Duty', label: 'Off Duty' },
  { value: 'Suspended', label: 'Suspended' }
];

const API_BASE_URL = 'http://localhost:5000/api';

export default function Drivers({ token }) {
  const [drivers, setDrivers] = useState([]);
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

  const hasWriteAccess = currentUser?.role === 'FleetManager' || currentUser?.role === 'SafetyOfficer';

  // Filters State
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterLicenseCategory, setFilterLicenseCategory] = useState('All');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Form Fields State
  const [formData, setFormData] = useState({
    name: '',
    licenseNumber: '',
    licenseCategory: 'LMV',
    licenseExpiry: '',
    contactNumber: '',
    safetyScore: 100,
    tripCompletionRate: 100,
    status: 'Available'
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch Drivers
  useEffect(() => {
    let active = true;
    const fetchDrivers = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/drivers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch drivers.');
        }
        if (active) {
          setDrivers(result.data);
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

    fetchDrivers();
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
      const res = await fetch(`${API_BASE_URL}/drivers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to register driver.');
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
      const res = await fetch(`${API_BASE_URL}/drivers/${selectedDriver._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update driver profile.');
      }

      setShowEditModal(false);
      setSelectedDriver(null);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Driver Status quickly
  const handleStatusToggle = async (driver, nextStatus) => {
    try {
      const res = await fetch(`${API_BASE_URL}/drivers/${driver._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to update status.');
      }
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Handle Delete Driver
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this driver profile?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/drivers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to delete driver.');
      }
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      licenseNumber: '',
      licenseCategory: 'LMV',
      licenseExpiry: '',
      contactNumber: '',
      safetyScore: 100,
      tripCompletionRate: 100,
      status: 'Available'
    });
    setFormError('');
  };

  const openEditModal = (driver) => {
    setSelectedDriver(driver);
    // Format date string to YYYY-MM-DD for date input
    const expiryDate = driver.licenseExpiry ? new Date(driver.licenseExpiry).toISOString().split('T')[0] : '';
    setFormData({
      name: driver.name,
      licenseNumber: driver.licenseNumber,
      licenseCategory: driver.licenseCategory,
      licenseExpiry: expiryDate,
      contactNumber: driver.contactNumber,
      safetyScore: driver.safetyScore,
      tripCompletionRate: driver.tripCompletionRate,
      status: driver.status
    });
    setShowEditModal(true);
  };

  // Filter Logic
  const filteredDrivers = drivers.filter(d => {
    const searchMatch = d.name.toLowerCase().includes(search.toLowerCase()) ||
                        d.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
                        d.contactNumber.includes(search);
    const categoryMatch = filterLicenseCategory === 'All' || d.licenseCategory === filterLicenseCategory;
    const statusMatch = filterStatus === 'All' || d.status === filterStatus;

    return searchMatch && categoryMatch && statusMatch;
  });

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading && drivers.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading Driver Profiles...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Drivers & Safety Profiles</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Monitor driver rosters, license validity, safety compliance metrics, and checkouts</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="btn-logout"
            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          
          {hasWriteAccess && (
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto', borderRadius: '6px' }}
            >
              <Plus size={16} /> Register Driver
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Error loading drivers list.</strong>
            <p style={{ fontSize: '0.85rem' }}>{error}</p>
          </div>
        </div>
      )}

      <div className="filters-row" style={{ flexWrap: 'wrap', gap: '1rem', backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: '1 1 200px' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Search</label>
          <input 
            type="text" 
            placeholder="Search Driver Name, License No, Contact..." 
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
            label="License Class" 
            options={LICENSE_OPTIONS} 
            value={filterLicenseCategory} 
            onChange={setFilterLicenseCategory} 
          />
          <CustomDropdown 
            label="Status" 
            options={DRIVER_STATUS_OPTIONS} 
            value={filterStatus} 
            onChange={setFilterStatus} 
          />
        </div>
      </div>

      {/* Roster Table */}
      <div className="dashboard-panel" style={{ marginTop: '1.5rem', padding: '1rem' }}>
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Driver Name</th>
                <th>License Details</th>
                <th>License Expiry</th>
                <th>Contact Details</th>
                <th>Safety Score</th>
                <th>Completion Rate</th>
                <th>Status</th>
                {hasWriteAccess && <th>Quick Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={hasWriteAccess ? 8 : 7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem 0' }}>
                    No drivers found.
                  </td>
                </tr>
              ) : (
                filteredDrivers.map(driver => {
                  const safetyColor = driver.safetyScore >= 90 ? '#137333' : driver.safetyScore >= 80 ? '#b45309' : '#c5221f';
                  return (
                    <tr key={driver._id} style={{ 
                      backgroundColor: driver.isLicenseExpired ? 'rgba(239, 68, 68, 0.04)' : driver.isLicenseExpiringSoon ? 'rgba(245, 158, 11, 0.04)' : 'transparent' 
                    }}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{driver.name}</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{driver.licenseNumber}</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Class: {driver.licenseCategory}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ fontWeight: driver.isLicenseExpired ? '700' : 'normal' }}>
                            {formatDate(driver.licenseExpiry)}
                          </span>
                          {driver.isLicenseExpired ? (
                            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #fca5a5', padding: '1px 4px', borderRadius: '4px', background: '#fee2e2' }}>
                              <AlertCircle size={10} /> Expired
                            </span>
                          ) : driver.isLicenseExpiringSoon ? (
                            <span style={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #fde68a', padding: '1px 4px', borderRadius: '4px', background: '#fef3c7' }}>
                              <AlertTriangle size={10} /> Expiring soon
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{driver.contactNumber}</td>
                      <td style={{ fontWeight: 700, color: safetyColor }}>{driver.safetyScore}%</td>
                      <td>{driver.tripCompletionRate}%</td>
                      <td>
                        <span className={`status-badge ${driver.status.toLowerCase().replace(' ', '-')}`}>
                          {driver.status}
                        </span>
                      </td>
                      {hasWriteAccess && (
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <button 
                              onClick={() => openEditModal(driver)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'var(--text-secondary)' }}
                              title="Edit Driver"
                            >
                              <Edit2 size={14} />
                            </button>
                            
                            {driver.status === 'Available' ? (
                              <button 
                                onClick={() => handleStatusToggle(driver, 'Suspended')}
                                style={{ background: '#fce8e6', border: '1px solid #fca5a5', color: '#c5221f', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', fontWeight: 600 }}
                              >
                                Suspend
                              </button>
                            ) : driver.status === 'Suspended' ? (
                              <button 
                                onClick={() => handleStatusToggle(driver, 'Available')}
                                style={{ background: '#e6f4ea', border: '1px solid #a3e2b9', color: '#137333', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', fontWeight: 600 }}
                              >
                                Reinstate
                              </button>
                            ) : null}

                            {driver.status === 'Available' && (
                              <button 
                                onClick={() => handleStatusToggle(driver, 'Off Duty')}
                                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', fontWeight: 500 }}
                              >
                                Go Off-Duty
                              </button>
                            )}

                            {driver.status === 'Off Duty' && (
                              <button 
                                onClick={() => handleStatusToggle(driver, 'Available')}
                                style={{ background: '#e6f4ea', border: '1px solid #a3e2b9', color: '#137333', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', padding: '2px 6px', fontWeight: 600 }}
                              >
                                Go On-Duty
                              </button>
                            )}

                            <button 
                              onClick={() => handleDelete(driver._id)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '0.25rem', color: '#ef4444' }}
                              title="Remove Driver"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD DRIVER MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Register Driver Profile</h3>

            {formError && (
              <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. +91 98765 43210"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>License Number *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. DL-1420230005"
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>License Class *</label>
                  <CustomDropdown
                    options={LICENSE_OPTIONS.filter(o => o.value !== 'All')}
                    value={formData.licenseCategory}
                    onChange={(val) => setFormData({...formData, licenseCategory: val})}
                    width="100%"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>License Expiry Date *</label>
                <input 
                  type="date" 
                  required 
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Initial Safety Score (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    placeholder="100"
                    value={formData.safetyScore}
                    onChange={(e) => setFormData({...formData, safetyScore: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>Initial Completion Rate (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    placeholder="100"
                    value={formData.tripCompletionRate}
                    onChange={(e) => setFormData({...formData, tripCompletionRate: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
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
                  {submitting ? 'Registering...' : 'Register Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT DRIVER MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Edit Driver: {selectedDriver?.name}</h3>

            {formError && (
              <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>License Number *</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.licenseNumber}
                    onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>License Class *</label>
                  <CustomDropdown
                    options={LICENSE_OPTIONS.filter(o => o.value !== 'All')}
                    value={formData.licenseCategory}
                    onChange={(val) => setFormData({...formData, licenseCategory: val})}
                    width="100%"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>License Expiry Date *</label>
                <input 
                  type="date" 
                  required 
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group">
                  <label>Safety Score (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.safetyScore}
                    onChange={(e) => setFormData({...formData, safetyScore: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="form-group">
                  <label>Completion Rate (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    value={formData.tripCompletionRate}
                    onChange={(e) => setFormData({...formData, tripCompletionRate: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Driver Status</label>
                <CustomDropdown
                  options={DRIVER_STATUS_OPTIONS.filter(o => o.value !== 'All')}
                  value={formData.status}
                  onChange={(val) => setFormData({...formData, status: val})}
                  width="100%"
                />
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
