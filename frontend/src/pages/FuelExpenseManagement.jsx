import React, { useState, useEffect } from 'react';
import { Plus, Loader2, AlertCircle, RefreshCw, Landmark, Fuel, Calendar, Wrench, Route } from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';

const API_BASE_URL = 'http://localhost:5000/api';

export default function FuelExpenseManagement({ token }) {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [fuelModalOpen, setFuelModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // Form states
  const [fuelForm, setFuelForm] = useState({
    vehicle: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    cost: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    vehicle: '',
    trip: '',
    maintenanceLog: '',
    tollCost: '',
    otherCost: '',
    maintenanceCostLinked: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        
        // Fetch fuel logs, expenses, vehicles, trips, maintenance logs
        const [fuelRes, expRes, vehRes, tripRes, maintRes] = await Promise.all([
          fetch(`${API_BASE_URL}/fuel-logs`, { headers }),
          fetch(`${API_BASE_URL}/expenses`, { headers }),
          fetch(`${API_BASE_URL}/vehicles`, { headers }),
          fetch(`${API_BASE_URL}/trips`, { headers }),
          fetch(`${API_BASE_URL}/maintenance-logs`, { headers })
        ]);

        if (!fuelRes.ok || !expRes.ok || !vehRes.ok || !tripRes.ok || !maintRes.ok) {
          throw new Error('Failed to retrieve financial and operations logs.');
        }

        const fuelData = await fuelRes.json();
        const expData = await expRes.json();
        const vehData = await vehRes.json();
        const tripData = await tripRes.json();
        const maintData = await maintRes.json();

        if (active) {
          setFuelLogs(fuelData.data || []);
          setExpenses(expData.data || []);
          setVehicles(vehData.data || []);
          setTrips(tripData.data || []);
          setMaintenanceLogs(maintData.data || []);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
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

  // Handle Fuel Log Submission
  const handleFuelSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    if (!fuelForm.vehicle || !fuelForm.liters || !fuelForm.cost) {
      setFormError('Please fill out all required fields.');
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/fuel-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(fuelForm)
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to log fuel refuel.');
      }

      setFuelLogs(prev => [result.data, ...prev]);
      setFuelModalOpen(false);
      setFuelForm({
        vehicle: '',
        date: new Date().toISOString().split('T')[0],
        liters: '',
        cost: ''
      });
      setRefreshKey(prev => prev + 1); // trigger totals refresh
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Expense Submission
  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    if (!expenseForm.vehicle) {
      setFormError('Vehicle selection is required.');
      setFormSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...expenseForm,
          tollCost: Number(expenseForm.tollCost || 0),
          otherCost: Number(expenseForm.otherCost || 0)
        })
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to log operational expense.');
      }

      setExpenses(prev => [result.data, ...prev]);
      setExpenseModalOpen(false);
      setExpenseForm({
        vehicle: '',
        trip: '',
        maintenanceLog: '',
        tollCost: '',
        otherCost: '',
        maintenanceCostLinked: 0,
        date: new Date().toISOString().split('T')[0]
      });
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle change in linked maintenance log (automatically pulls the cost)
  const handleMaintenanceChange = (maintId) => {
    const selectedLog = maintenanceLogs.find(ml => ml._id === maintId);
    setExpenseForm(prev => ({
      ...prev,
      maintenanceLog: maintId,
      maintenanceCostLinked: selectedLog ? selectedLog.cost : 0
    }));
  };

  // Live total calculations
  const totalFuelCost = fuelLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalMaintenanceCost = maintenanceLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
  const totalOtherExpenses = expenses.reduce((sum, exp) => sum + (exp.tollCost || 0) + (exp.otherCost || 0), 0);
  const grandTotalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

  // Format helper for Indian Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin text-accent" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading Expense & Fuel registries...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <AlertCircle size={20} />
        <div>
          <strong>Error loading operational records</strong>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>{error}</p>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            style={{ 
              marginTop: '0.75rem', 
              padding: '0.4rem 0.8rem', 
              background: '#7f1d1d', 
              border: '1px solid #fca5a5', 
              color: 'white', 
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 120px)', paddingBottom: '80px', position: 'relative' }}>
      
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Fuel & Expense Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Log refuelings, tolls, and maintenance services to calculate total vehicle costs</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setFuelModalOpen(true)}
            className="btn-primary" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Fuel size={16} /> Log Fuel
          </button>
          <button 
            onClick={() => setExpenseModalOpen(true)}
            className="btn-primary" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem', background: '#FFE2E2', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
            onMouseLeave={e => e.currentTarget.style.background = '#FFE2E2'}
          >
            <Plus size={16} /> Add Expense
          </button>
        </div>
      </div>

      {/* Grid of Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Fuel Logs Panel */}
        <div className="dashboard-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Refueling History (Fuel Logs)</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 500 }}>
              {fuelLogs.length} logs
            </span>
          </div>
          <div className="data-table-wrapper">
            {fuelLogs.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No refueling transactions logged yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Type</th>
                    <th>Refuel Date</th>
                    <th>Liters</th>
                    <th>Refuel Cost</th>
                    <th>Avg Cost/L</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelLogs.map((log) => (
                    <tr key={log._id}>
                      <td style={{ fontWeight: 600 }}>{log.vehicle?.registrationNumber || '--'}</td>
                      <td>
                        <span className={`status-badge ${log.vehicle?.type ? log.vehicle.type.toLowerCase() : 'draft'}`}>
                          {log.vehicle?.type || 'Unknown'}
                        </span>
                      </td>
                      <td>{new Date(log.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{log.liters} L</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(log.cost)}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {log.liters > 0 ? formatCurrency(log.cost / log.liters) + '/L' : '--'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Expenses Panel */}
        <div className="dashboard-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Operational Expenses</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'none', fontWeight: 500 }}>
              {expenses.length} records
            </span>
          </div>
          <div className="data-table-wrapper">
            {expenses.length === 0 ? (
              <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No other operational expenses logged yet.</p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Expense Date</th>
                    <th>Toll Cost</th>
                    <th>Other Cost</th>
                    <th>Linked Trip</th>
                    <th>Linked Maintenance</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((exp) => {
                    const totalCost = (exp.tollCost || 0) + (exp.otherCost || 0) + (exp.maintenanceCostLinked || 0);
                    return (
                      <tr key={exp._id}>
                        <td style={{ fontWeight: 600 }}>{exp.vehicle?.registrationNumber || '--'}</td>
                        <td>{new Date(exp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                        <td>{formatCurrency(exp.tollCost)}</td>
                        <td>{formatCurrency(exp.otherCost)}</td>
                        <td>
                          {exp.trip ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#7b6ba8', fontWeight: 600 }}>
                              <Route size={12} /> {exp.trip.tripId}
                            </span>
                          ) : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                        </td>
                        <td>
                          {exp.maintenanceLog ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <span style={{ fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: '#c4836a' }}>
                                <Wrench size={12} /> {exp.maintenanceLog.serviceType}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                ({formatCurrency(exp.maintenanceCostLinked)})
                              </span>
                            </div>
                          ) : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {formatCurrency(totalCost)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* ── Live Total Operational Cost Footer ── */}
      <footer style={{
        position: 'fixed',
        bottom: 0,
        left: '260px', // matches sidebar width
        right: 0,
        height: '75px',
        backgroundColor: '#FFE2E2',
        borderTop: '1px solid var(--border-color)',
        boxShadow: '0 -4px 16px rgba(43, 27, 27, 0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        zIndex: 90
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>TOTAL FUEL REFUELED</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7a668c' }}>{formatCurrency(totalFuelCost)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
            <span style={{ fontTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>TOTAL MAINTENANCE SERVICES</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7a668c' }}>{formatCurrency(totalMaintenanceCost)}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
            <span style={{ fontTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>TOTAL TOLLS & OTHERS</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#7a668c' }}>{formatCurrency(totalOtherExpenses)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontTransform: 'uppercase', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>GRAND TOTAL OPERATIONAL COST</span>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(grandTotalCost)}</span>
        </div>
      </footer>

      {/* ── Log Fuel Modal ── */}
      {fuelModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Log Fuel Refueling</h3>
              <button 
                onClick={() => { setFuelModalOpen(false); setFormError(''); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="error-banner" style={{ margin: 0, padding: '0.75rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFuelSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label>Select Vehicle *</label>
                <CustomDropdown
                  options={[
                    { value: '', label: '-- Choose Vehicle --' },
                    ...vehicles.map(v => ({
                      value: v._id,
                      label: `${v.registrationNumber} (${v.name})`
                    }))
                  ]}
                  value={fuelForm.vehicle}
                  onChange={(val) => setFuelForm(prev => ({ ...prev, vehicle: val }))}
                  width="100%"
                />
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  value={fuelForm.date} 
                  onChange={e => setFuelForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Liters Refueled (L) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="e.g. 45" 
                  value={fuelForm.liters} 
                  onChange={e => setFuelForm(prev => ({ ...prev, liters: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Cost (₹) *</label>
                <input 
                  type="number" 
                  placeholder="e.g. 4500" 
                  value={fuelForm.cost} 
                  onChange={e => setFuelForm(prev => ({ ...prev, cost: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setFuelModalOpen(false); setFormError(''); }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formSubmitting}
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {formSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Save Fuel Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Expense Modal ── */}
      {expenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Log Operational Expense</h3>
              <button 
                onClick={() => { setExpenseModalOpen(false); setFormError(''); }}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                &times;
              </button>
            </div>

            {formError && (
              <div className="error-banner" style={{ margin: 0, padding: '0.75rem' }}>
                <AlertCircle size={16} />
                <span style={{ fontSize: '0.85rem' }}>{formError}</span>
              </div>
            )}

            <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              <div className="form-group">
                <label>Select Vehicle *</label>
                <select 
                  value={expenseForm.vehicle} 
                  onChange={e => setExpenseForm(prev => ({ ...prev, vehicle: e.target.value }))}
                  required
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v._id} value={v._id}>{v.registrationNumber} ({v.name})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date" 
                  value={expenseForm.date} 
                  onChange={e => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Toll Cost (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={expenseForm.tollCost} 
                    onChange={e => setExpenseForm(prev => ({ ...prev, tollCost: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>Other Cost (₹)</label>
                  <input 
                    type="number" 
                    placeholder="0" 
                    value={expenseForm.otherCost} 
                    onChange={e => setExpenseForm(prev => ({ ...prev, otherCost: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Link to Trip (Optional)</label>
                <select 
                  value={expenseForm.trip} 
                  onChange={e => setExpenseForm(prev => ({ ...prev, trip: e.target.value }))}
                >
                  <option value="">-- No linked trip --</option>
                  {trips
                    .filter(t => !expenseForm.vehicle || (t.vehicle && t.vehicle._id === expenseForm.vehicle))
                    .map(t => (
                      <option key={t._id} value={t._id}>
                        {t.tripId} ({t.source} &rarr; {t.destination})
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Link to Maintenance Ticket (Optional)</label>
                <select 
                  value={expenseForm.maintenanceLog} 
                  onChange={e => handleMaintenanceChange(e.target.value)}
                >
                  <option value="">-- No linked maintenance --</option>
                  {maintenanceLogs
                    .filter(ml => !expenseForm.vehicle || (ml.vehicle && ml.vehicle._id === expenseForm.vehicle))
                    .map(ml => (
                      <option key={ml._id} value={ml._id}>
                        {ml.serviceType} ({formatCurrency(ml.cost)})
                      </option>
                    ))}
                </select>
              </div>

              {expenseForm.maintenanceCostLinked > 0 && (
                <div style={{ fontSize: '0.8rem', padding: '0.5rem', background: '#FBEFEF', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Linked Maintenance Cost:</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(expenseForm.maintenanceCostLinked)}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  onClick={() => { setExpenseModalOpen(false); setFormError(''); }}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formSubmitting}
                  className="btn-primary" 
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  {formSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Log Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
