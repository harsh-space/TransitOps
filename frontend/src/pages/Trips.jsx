import React, { useState, useEffect } from 'react';
import { Loader2, Plus, AlertCircle, Play, CheckCircle, XCircle, Info, RefreshCw } from 'lucide-react';
import CustomDropdown from '../components/CustomDropdown';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Trips({ token }) {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
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

  const isDispatcher = currentUser?.role === 'Dispatcher';
  const hasAccess = currentUser?.role === 'Dispatcher' || currentUser?.role === 'SafetyOfficer';

  // Modal / Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Create Form State
  const [formData, setFormData] = useState({
    tripId: '',
    source: '',
    destination: '',
    vehicle: '',
    driver: '',
    cargoWeightKg: '',
    plannedDistanceKm: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Complete Form State
  const [completeData, setCompleteData] = useState({
    finalOdometer: '',
    fuelConsumedL: ''
  });
  const [completeError, setCompleteError] = useState('');
  const [completing, setCompleting] = useState(false);

  // Live validation calculations in Add Form
  const [liveValidation, setLiveValidation] = useState({
    isValid: true,
    capacityError: '',
    licenseError: '',
    vehicleStatusError: '',
    driverStatusError: ''
  });

  // Fetch all data
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const tripsRes = await fetch(`${API_BASE_URL}/trips`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const tripsResult = await tripsRes.json();
        if (!tripsRes.ok) throw new Error(tripsResult.error || 'Failed to fetch trips.');

        const vehRes = await fetch(`${API_BASE_URL}/vehicles`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const vehResult = await vehRes.json();
        if (!vehRes.ok) throw new Error(vehResult.error || 'Failed to fetch vehicles.');

        const drvRes = await fetch(`${API_BASE_URL}/drivers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const drvResult = await drvRes.json();
        if (!drvRes.ok) throw new Error(drvResult.error || 'Failed to fetch drivers.');

        if (active) {
          setTrips(tripsResult.data);
          setVehicles(vehResult.data);
          setDrivers(drvResult.data);
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

  // Handle live validation when form inputs change
  useEffect(() => {
    let isValid = true;
    let capacityError = '';
    let licenseError = '';
    let vehicleStatusError = '';
    let driverStatusError = '';

    const selectedVeh = vehicles.find(v => v._id === formData.vehicle);
    const selectedDrv = drivers.find(d => d._id === formData.driver);

    // 1. Cargo weight vs vehicle capacity
    if (selectedVeh && formData.cargoWeightKg) {
      const weight = parseFloat(formData.cargoWeightKg);
      if (weight > selectedVeh.maxLoadCapacityKg) {
        capacityError = `Cargo weight (${weight} kg) exceeds vehicle max capacity (${selectedVeh.maxLoadCapacityKg} kg).`;
        isValid = false;
      }
    }

    // 2. Driver license expiry
    if (selectedDrv && selectedDrv.licenseExpiry) {
      if (new Date(selectedDrv.licenseExpiry) < new Date()) {
        licenseError = `Selected driver's license has expired.`;
        isValid = false;
      }
    }

    // 3. Vehicle status (warn if not Available - though in draft we can save it, but we can't dispatch it later)
    if (selectedVeh && selectedVeh.status !== 'Available') {
      vehicleStatusError = `Vehicle is currently '${selectedVeh.status}' and cannot be dispatched immediately.`;
    }

    // 4. Driver status
    if (selectedDrv && selectedDrv.status !== 'Available') {
      driverStatusError = `Driver is currently '${selectedDrv.status}' and cannot be dispatched immediately.`;
    }

    setLiveValidation({
      isValid,
      capacityError,
      licenseError,
      vehicleStatusError,
      driverStatusError
    });

  }, [formData.vehicle, formData.driver, formData.cargoWeightKg, vehicles, drivers]);

  // Handle Add Trip Submission
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          cargoWeightKg: parseFloat(formData.cargoWeightKg),
          plannedDistanceKm: parseFloat(formData.plannedDistanceKm),
          vehicle: formData.vehicle || null,
          driver: formData.driver || null
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to create trip.');

      setShowAddModal(false);
      resetForm();
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Dispatch Trip
  const handleDispatch = async (tripId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/dispatch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Dispatch validation failed.');

      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Cancel Trip
  const handleCancel = async (tripId) => {
    if (!window.confirm('Are you sure you want to cancel this trip?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Cancellation failed.');

      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete Trip
  const handleDelete = async (tripId) => {
    if (!window.confirm('Are you sure you want to delete this trip record?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Delete failed.');

      setRefreshKey(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Open Complete Modal
  const openCompleteModal = (trip) => {
    setSelectedTrip(trip);
    setCompleteData({
      finalOdometer: trip.vehicle ? String(trip.vehicle.odometer + trip.plannedDistanceKm) : '',
      fuelConsumedL: ''
    });
    setCompleteError('');
    setShowCompleteModal(true);
  };

  // Complete Trip Submit
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    setCompleteError('');
    setCompleting(true);

    try {
      const res = await fetch(`${API_BASE_URL}/trips/${selectedTrip._id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          finalOdometer: parseFloat(completeData.finalOdometer),
          fuelConsumedL: parseFloat(completeData.fuelConsumedL)
        })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to complete trip.');

      setShowCompleteModal(false);
      setSelectedTrip(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      setCompleteError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tripId: '',
      source: '',
      destination: '',
      vehicle: '',
      driver: '',
      cargoWeightKg: '',
      plannedDistanceKm: ''
    });
    setFormError('');
  };

  // Kanban Columns
  const columns = {
    Draft: trips.filter(t => t.status === 'Draft'),
    Dispatched: trips.filter(t => t.status === 'Dispatched'),
    Completed: trips.filter(t => t.status === 'Completed'),
    Cancelled: trips.filter(t => t.status === 'Cancelled')
  };

  if (loading && trips.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading Trip Dispatcher...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Trip Dispatch Board</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Schedule trips, validate capacity limits, check driver licenses, and trace active transits</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="btn-logout"
            style={{ padding: '0.5rem 0.75rem', width: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
          >
            <RefreshCw size={14} /> Refresh
          </button>
          
          {isDispatcher && (
            <button 
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', width: 'auto', borderRadius: '6px' }}
            >
              <Plus size={16} /> Create Trip (Draft)
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="error-banner" style={{ marginBottom: '1.5rem' }}>
          <AlertCircle size={20} />
          <div>
            <strong>Error loading dispatch data.</strong>
            <p style={{ fontSize: '0.85rem' }}>{error}</p>
          </div>
        </div>
      )}

      {/* Kanban Board Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1.25rem',
        alignItems: 'start'
      }}>
        {Object.entries(columns).map(([colName, colTrips]) => (
          <div key={colName} style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '1rem',
            minHeight: '65vh'
          }}>
            {/* Column Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.5rem'
            }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                {colName}
              </span>
              <span style={{
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                padding: '0.1rem 0.5rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700
              }}>
                {colTrips.length}
              </span>
            </div>

            {/* Trip Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {colTrips.map(trip => (
                <div key={trip._id} style={{
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '1rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                  position: 'relative'
                }}>
                  {/* Card Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{trip.tripId}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{trip.plannedDistanceKm} km</span>
                  </div>

                  {/* Route details */}
                  <div style={{ fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                      <strong>From:</strong> <span>{trip.source}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-secondary)' }}>
                      <strong>To:</strong> <span>{trip.destination}</span>
                    </div>
                  </div>

                  {/* Assignments */}
                  <div style={{
                    fontSize: '0.78rem',
                    borderTop: '1px dashed var(--border-color)',
                    paddingTop: '0.5rem',
                    marginBottom: '0.75rem',
                    color: 'var(--text-primary)'
                  }}>
                    <div style={{ marginBottom: '0.2rem' }}>
                      🚚 <strong>Veh:</strong> {trip.vehicle ? `${trip.vehicle.registrationNumber} (${trip.vehicle.name})` : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </div>
                    <div>
                      👤 <strong>Drv:</strong> {trip.driver ? trip.driver.name : <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}
                    </div>
                    <div style={{ marginTop: '0.2rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      Cargo Load: <strong>{trip.cargoWeightKg} kg</strong>
                    </div>
                  </div>

                  {/* Operations Buttons (if isDispatcher) */}
                  {isDispatcher && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem' }}>
                      {trip.status === 'Draft' && (
                        <>
                          <button
                            onClick={() => handleDispatch(trip._id)}
                            style={{
                              background: '#e6f4ea', border: '1px solid #a3e2b9', color: '#137333',
                              borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                            }}
                          >
                            <Play size={10} /> Dispatch
                          </button>
                          <button
                            onClick={() => handleDelete(trip._id)}
                            style={{
                              background: '#fce8e6', border: '1px solid #fca5a5', color: '#c5221f',
                              borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                              fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </>
                      )}

                      {trip.status === 'Dispatched' && (
                        <>
                          <button
                            onClick={() => openCompleteModal(trip)}
                            style={{
                              background: '#e6f4ea', border: '1px solid #a3e2b9', color: '#137333',
                              borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                              fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                            }}
                          >
                            <CheckCircle size={10} /> Complete
                          </button>
                          <button
                            onClick={() => handleCancel(trip._id)}
                            style={{
                              background: '#fce8e6', border: '1px solid #fca5a5', color: '#c5221f',
                              borderRadius: '4px', padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                              fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                            }}
                          >
                            <XCircle size={10} /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {trip.status === 'Completed' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '4px', textAlign: 'center' }}>
                      🏁 Final Odo: {trip.finalOdometer} km | Fuel: {trip.fuelConsumedL} L
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- CREATE TRIP MODAL --- */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Create Transport Trip (Draft)</h3>

            {formError && (
              <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{formError}</span>
              </div>
            )}

            {/* LIVE VALIDATION BANNER */}
            {(!liveValidation.isValid || liveValidation.vehicleStatusError || liveValidation.driverStatusError) && (
              <div style={{
                background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309',
                padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.82rem'
              }}>
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
                  <Info size={14} /> Dispatch Eligibility Warning:
                </div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                  {liveValidation.capacityError && <li style={{ fontWeight: 600 }}>{liveValidation.capacityError}</li>}
                  {liveValidation.licenseError && <li style={{ fontWeight: 600 }}>{liveValidation.licenseError}</li>}
                  {liveValidation.vehicleStatusError && <li>{liveValidation.vehicleStatusError}</li>}
                  {liveValidation.driverStatusError && <li>{liveValidation.driverStatusError}</li>}
                </ul>
              </div>
            )}

            <form onSubmit={handleAddSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Trip ID *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="TR005"
                    value={formData.tripId}
                    onChange={(e) => setFormData({...formData, tripId: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Cargo Weight (kg) *</label>
                  <input 
                    type="number" 
                    required 
                    min="0"
                    placeholder="e.g. 450"
                    value={formData.cargoWeightKg}
                    onChange={(e) => setFormData({...formData, cargoWeightKg: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label>Source Location *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Depot A"
                    value={formData.source}
                    onChange={(e) => setFormData({...formData, source: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Destination Location *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. North Warehouse"
                    value={formData.destination}
                    onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group">
                  <label>Assign Vehicle (Optional)</label>
                  <CustomDropdown
                    options={[
                      { value: '', label: '-- Choose Vehicle --' },
                      ...vehicles.map(v => ({
                        value: v._id,
                        label: `${v.registrationNumber} (${v.name}) [${v.status}]`
                      }))
                    ]}
                    value={formData.vehicle}
                    onChange={(val) => setFormData({...formData, vehicle: val})}
                    width="100%"
                  />
                </div>
                <div className="form-group">
                  <label>Assign Driver (Optional)</label>
                  <CustomDropdown
                    options={[
                      { value: '', label: '-- Choose Driver --' },
                      ...drivers.map(d => ({
                        value: d._id,
                        label: `${d.name} [${d.status}]`
                      }))
                    ]}
                    value={formData.driver}
                    onChange={(val) => setFormData({...formData, driver: val})}
                    width="100%"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Planned Distance (km) *</label>
                <input 
                  type="number" 
                  required 
                  min="1"
                  placeholder="e.g. 150"
                  value={formData.plannedDistanceKm}
                  onChange={(e) => setFormData({...formData, plannedDistanceKm: e.target.value})}
                />
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
                  {submitting ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- COMPLETE TRIP MODAL --- */}
      {showCompleteModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Complete Trip: {selectedTrip?.tripId}</h3>

            {completeError && (
              <div className="error-banner" style={{ padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <AlertCircle size={16} />
                <span>{completeError}</span>
              </div>
            )}

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
              ℹ️ Current vehicle odometer: <strong>{selectedTrip?.vehicle?.odometer} km</strong>
            </div>

            <form onSubmit={handleCompleteSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Final Odometer Reading (km) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="e.g. 12500"
                  value={completeData.finalOdometer}
                  onChange={(e) => setCompleteData({...completeData, finalOdometer: e.target.value})}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Fuel Consumed (Liters) *</label>
                <input 
                  type="number" 
                  required 
                  min="0"
                  placeholder="e.g. 35"
                  value={completeData.fuelConsumedL}
                  onChange={(e) => setCompleteData({...completeData, fuelConsumedL: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button 
                  type="button" 
                  onClick={() => setShowCompleteModal(false)}
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
                  disabled={completing}
                >
                  {completing ? 'Completing...' : 'Complete Trip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
