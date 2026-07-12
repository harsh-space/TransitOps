import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Wrench, CheckCircle, RefreshCw, ArrowRight, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function Maintenance({ token }) {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Form State
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch data
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch maintenance logs
        const logsRes = await fetch(`${API_BASE_URL}/maintenance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const logsResult = await logsRes.json();
        if (!logsRes.ok) throw new Error(logsResult.error || 'Failed to fetch maintenance logs.');

        // Fetch vehicles for dropdown selection
        const vehRes = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehResult = await vehRes.json();
        if (!vehRes.ok) throw new Error(vehResult.error || 'Failed to fetch vehicles.');

        if (active) {
          setLogs(resultData => logsResult.data);
          // Only show non-retired vehicles for new maintenance
          setVehicles(vehResult.data.filter(v => v.status !== 'Retired'));
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

    fetchData();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  // Submit new maintenance log
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!selectedVehicle || !serviceType || !cost) {
      setFormError('Please select a vehicle, enter service type, and enter cost.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          vehicle: selectedVehicle,
          serviceType,
          cost: parseFloat(cost),
          date
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to log maintenance record.');

      // Reset form & refresh
      setSelectedVehicle('');
      setServiceType('');
      setCost('');
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Close service ticket
  const handleCloseTicket = async (logId) => {
    if (!window.confirm('Are you sure you want to close this maintenance ticket? This will restore the vehicle status to Available.')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/maintenance/${logId}/close`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to close maintenance ticket.');

      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Find count of active shop vehicles
  const vehiclesInShopCount = vehicles.filter(v => v.status === 'In Shop').length;
  const availableVehiclesCount = vehicles.filter(v => v.status === 'Available').length;

  if (loading && logs.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading Maintenance Dashboard...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Maintenance & Repairs</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Log service bills, track active repairs, and check status transitions</p>
        </div>

        <button 
          onClick={() => setRefreshKey(prev => prev + 1)}
          className="btn-logout"
          style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Error loading maintenance data.</strong>
            <p style={{ fontSize: '0.85rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Visual Status Flip Diagram Panel */}
      <div className="dashboard-panel" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <div className="panel-header" style={{ fontSize: '0.95rem' }}>Asset Status Control Loop</div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          padding: '1rem 0',
          gap: '1.5rem'
        }}>
          {/* Card: Available */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--status-available)',
            borderRadius: '12px',
            padding: '1.25rem 2rem',
            textAlign: 'center',
            minWidth: '180px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ color: 'var(--status-available)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Available</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{availableVehiclesCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Vehicles Ready for Trip</div>
          </div>

          {/* Arrow Loop indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-in-shop)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Log Active Maintenance</span>
              <ArrowRight size={16} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-available)' }}>
              <ArrowLeft size={16} />
              <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Close Service Ticket</span>
            </div>
          </div>

          {/* Card: In Shop */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '2px solid var(--status-in-shop)',
            borderRadius: '12px',
            padding: '1.25rem 2rem',
            textAlign: 'center',
            minWidth: '180px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
          }}>
            <div style={{ color: 'var(--status-in-shop)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>In Shop</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{vehiclesInShopCount}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>Active Work Orders</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '2rem', alignItems: 'start' }}>
        {/* Form Panel */}
        <section className="dashboard-panel" style={{ padding: '1.5rem' }}>
          <div className="panel-header" style={{ fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={16} /> Log Service Record
          </div>

          {formError && (
            <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Select Vehicle *</label>
              <select 
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="">-- Choose Active Vehicle --</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.registrationNumber} ({v.name}) - Status: {v.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Service / Repair Type *</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Engine Oil Change, Brake Replacement"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label>Service Cost (INR ₹) *</label>
              <input 
                type="number" 
                required 
                min="0"
                placeholder="e.g. 5000"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label>Logged Date *</label>
              <input 
                type="date" 
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={submitting}
            >
              {submitting ? 'Saving record...' : 'Create Maintenance Entry'}
            </button>
          </form>
        </section>

        {/* History Table Panel */}
        <section className="dashboard-panel" style={{ padding: '1.5rem' }}>
          <div className="panel-header" style={{ fontSize: '0.95rem' }}>Repair & Service Log History</div>
          
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehicle</th>
                  <th>Service Rendered</th>
                  <th>Cost</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2.5rem 0' }}>
                      No maintenance entries logged yet.
                    </td>
                  </tr>
                ) : (
                  logs.map(log => (
                    <tr key={log._id}>
                      <td style={{ fontWeight: 600 }}>
                        {log.vehicle ? log.vehicle.registrationNumber : '--'}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {log.vehicle ? log.vehicle.name : 'Unknown'}
                        </div>
                      </td>
                      <td style={{ maxWidth: '150px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        {log.serviceType}
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{log.cost.toLocaleString()}</td>
                      <td>{formatDate(log.date)}</td>
                      <td>
                        <span className={`status-badge ${log.status === 'Active' ? 'in-shop' : 'completed'}`}>
                          {log.status === 'Active' ? 'Active' : 'Completed'}
                        </span>
                      </td>
                      <td>
                        {log.status === 'Active' ? (
                          <button
                            onClick={() => handleCloseTicket(log._id)}
                            style={{
                              background: '#e6f4ea',
                              border: '1px solid #a3e2b9',
                              color: '#137333',
                              borderRadius: '4px',
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem'
                            }}
                          >
                            <CheckCircle size={12} /> Close
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ticket Closed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
