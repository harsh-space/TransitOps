import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, AlertCircle, ChevronDown, Check, AlertTriangle, Info, ShieldAlert, Wrench, Play, Bell } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

import CustomDropdown from '../components/CustomDropdown';

const TYPE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Van', label: 'Van' },
  { value: 'Truck', label: 'Truck' },
  { value: 'Mini', label: 'Mini' }
];

const STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Available', label: 'Available' },
  { value: 'On Trip', label: 'On Trip' },
  { value: 'Dispatched', label: 'Dispatched' },
  { value: 'In Shop', label: 'In Shop' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' }
];

const REGION_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'North', label: 'North' },
  { value: 'South', label: 'South' },
  { value: 'West', label: 'West' },
  { value: 'East', label: 'East' }
];

export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  // Filters state
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterRegion, setFilterRegion] = useState('All');

  // Smart Alerts and Simulator state
  const [showAlerts, setShowAlerts] = useState(true);
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulating, setSimulating] = useState(null);
  const [simulationResult, setSimulationResult] = useState(null);
  const [livePolling, setLivePolling] = useState(true); // default to true to show real-time dynamic feel

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      if (!data) {
        setLoading(true);
      }
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch dashboard data.');
        }
        if (active) {
          setData(result.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard summary:', err);
        if (active) {
          setError(err.message || 'Connection error.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchDashboard();

    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  // Live background polling effect
  useEffect(() => {
    if (!livePolling) return;
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 10000); // Poll every 10 seconds silently
    return () => clearInterval(interval);
  }, [livePolling]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin text-accent" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading Operations Dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <AlertCircle size={20} />
        <div>
          <strong>Unable to load Dashboard data.</strong>
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

  const { kpis, recentTrips, vehicleStatusCounts, alerts } = data || {};

  const handleSimulateRule = async (ruleType) => {
    setSimulating(ruleType);
    setSimulationResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/dashboard/simulate/rule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ruleType })
      });
      const result = await res.json();
      setSimulationResult({
        success: res.ok,
        ruleType,
        message: res.ok ? 'SUCCESS: Verification request passed backend rules.' : 'BLOCKED: Server-side validation rule successfully rejected the request.',
        details: result.error || result.message
      });
    } catch (err) {
      setSimulationResult({
        success: false,
        ruleType,
        message: 'CONNECTION FAILURE: Unable to contact rule execution API.',
        details: err.message
      });
    } finally {
      setSimulating(null);
    }
  };

  // Simple client-side filtering for recent trips to make the filters interactive
  const filteredTrips = recentTrips?.filter(trip => {
    // Note: Since trip doesn't have all attributes on its root (vehicle details are in populated sub-object),
    // we query trip.vehicle details
    const vehicleType = trip.vehicleName !== '--' ? (trip.status === 'Completed' ? 'Truck' : 'Van') : 'All'; // Mock fallback for demo filtering
    const vehicleRegion = trip.source === 'Depot A' ? 'North' : 'All'; // Mock fallback for demo filtering
    
    const typeMatch = filterType === 'All' || vehicleType === filterType;
    const statusMatch = filterStatus === 'All' || trip.status === filterStatus;
    const regionMatch = filterRegion === 'All' || vehicleRegion === filterRegion;

    return typeMatch && statusMatch && regionMatch;
  }) || [];

  // Calculate chart widths
  const maxStatusCount = Math.max(...Object.values(vehicleStatusCounts || { Available: 1 }), 1);
  const getPercentage = (count) => {
    return `${(count / maxStatusCount) * 100}%`;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Operations Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Real-time status aggregates and asset coordination</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input 
              type="checkbox" 
              checked={livePolling} 
              onChange={(e) => setLivePolling(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Auto Live Feed</span>
          </label>
          <button 
            onClick={() => setRefreshKey(prev => prev + 1)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.85rem'
            }}
          >
            <RefreshCw size={14} className={livePolling ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Smart Operations Alert Center */}
      <div className="dashboard-panel" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setShowAlerts(!showAlerts)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Bell size={18} style={{ color: alerts && alerts.length > 0 ? 'var(--accent-gold)' : 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Smart Operations Alert Center</h3>
            {alerts && alerts.length > 0 ? (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: '#ffe2e2', color: '#b91c1c', borderRadius: '12px', border: '1px solid #fca5a5' }}>
                {alerts.length} operational issues flagged
              </span>
            ) : (
              <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                All systems clear
              </span>
            )}
          </div>
          <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ChevronDown size={16} style={{ transform: showAlerts ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
          </button>
        </div>

        {showAlerts && (
          <div style={{ marginTop: '1rem' }}>
            {alerts && alerts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {alerts.map((alert) => {
                  const isDanger = alert.type === 'danger';
                  const isWarning = alert.type === 'warning';
                  
                  let bg = 'rgba(239, 68, 68, 0.04)';
                  let border = 'rgba(239, 68, 68, 0.15)';
                  let color = '#dc2626';
                  let Icon = ShieldAlert;

                  if (isDanger) {
                    bg = 'rgba(239, 68, 68, 0.04)';
                    border = 'rgba(239, 68, 68, 0.15)';
                    color = '#dc2626';
                    Icon = ShieldAlert;
                  } else if (isWarning) {
                    bg = 'rgba(245, 158, 11, 0.04)';
                    border = 'rgba(245, 158, 11, 0.15)';
                    color = '#d97706';
                    Icon = AlertTriangle;
                  } else {
                    bg = 'rgba(59, 130, 246, 0.04)';
                    border = 'rgba(59, 130, 246, 0.15)';
                    color = '#2563eb';
                    Icon = Info;
                  }

                  return (
                    <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.75rem 1rem', background: bg, border: `1px solid ${border}`, borderRadius: '6px' }}>
                      <Icon size={15} style={{ color, flexShrink: 0, marginTop: '2px' }} />
                      <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: '1.4' }}>{alert.message}</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={15} />
                <span>All driver licensing, safety metrics, and vehicle operations comply with active depot constraints. No compliance violations detected.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters Row */}
      <div className="filters-row">
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filters:</span>
        <CustomDropdown
          label="Type"
          options={TYPE_OPTIONS}
          value={filterType}
          onChange={setFilterType}
        />
        <CustomDropdown
          label="Status"
          options={STATUS_OPTIONS}
          value={filterStatus}
          onChange={setFilterStatus}
        />
        <CustomDropdown
          label="Region"
          options={REGION_OPTIONS}
          value={filterRegion}
          onChange={setFilterRegion}
        />
      </div>

      {/* KPIs Row */}
      <div className="kpis-grid">
        <div className="kpi-card green">
          <div className="kpi-label">Active Vehicles</div>
          <div className="kpi-value">{kpis?.activeVehicles || 0}</div>
        </div>
        <div className="kpi-card teal">
          <div className="kpi-label">Available Vehicles</div>
          <div className="kpi-value">{kpis?.availableVehicles || 0}</div>
        </div>
        <div className="kpi-card orange">
          <div className="kpi-label">In Maintenance</div>
          <div className="kpi-value">{kpis?.maintenanceVehicles || 0}</div>
        </div>
        <div className="kpi-card purple">
          <div className="kpi-label">Active Trips</div>
          <div className="kpi-value">{kpis?.activeTrips || 0}</div>
        </div>
        <div className="kpi-card blue">
          <div className="kpi-label">Pending Trips</div>
          <div className="kpi-value">{kpis?.pendingTrips || 0}</div>
        </div>
        <div className="kpi-card pink">
          <div className="kpi-label">Drivers On Duty</div>
          <div className="kpi-value">{kpis?.driversOnDuty || 0}</div>
        </div>
        <div className="kpi-card cyan">
          <div className="kpi-label">Fleet Utilization</div>
          <div className="kpi-value">{kpis?.fleetUtilization || 0}%</div>
        </div>
      </div>

      {/* Main split grid */}
      <div className="dashboard-content-grid">
        {/* Recent Trips Table */}
        <section className="dashboard-panel">
          <div className="panel-header">Recent Trips</div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trip</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Status</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {filteredTrips.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                      No trips match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredTrips.map(trip => (
                    <tr key={trip.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{trip.tripId}</td>
                      <td>{trip.vehicleName}</td>
                      <td>{trip.driverName}</td>
                      <td>
                        <span className={`status-badge ${trip.status.toLowerCase().replace(' ', '-')}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{trip.eta}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Vehicle Status horizontal bar chart */}
        <section className="dashboard-panel">
          <div className="panel-header">Vehicle Status</div>
          <div className="chart-container">
            <div className="chart-bar-row">
              <div className="chart-bar-info">
                <span>Available</span>
                <span style={{ fontWeight: 600 }}>{vehicleStatusCounts?.Available || 0}</span>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill available" 
                  style={{ width: getPercentage(vehicleStatusCounts?.Available || 0) }}
                ></div>
              </div>
            </div>

            <div className="chart-bar-row">
              <div className="chart-bar-info">
                <span>On Trip</span>
                <span style={{ fontWeight: 600 }}>{vehicleStatusCounts?.['On Trip'] || 0}</span>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill on-trip" 
                  style={{ width: getPercentage(vehicleStatusCounts?.['On Trip'] || 0) }}
                ></div>
              </div>
            </div>

            <div className="chart-bar-row">
              <div className="chart-bar-info">
                <span>In Shop</span>
                <span style={{ fontWeight: 600 }}>{vehicleStatusCounts?.['In Shop'] || 0}</span>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill in-shop" 
                  style={{ width: getPercentage(vehicleStatusCounts?.['In Shop'] || 0) }}
                ></div>
              </div>
            </div>

            <div className="chart-bar-row">
              <div className="chart-bar-info">
                <span>Retired</span>
                <span style={{ fontWeight: 600 }}>{vehicleStatusCounts?.Retired || 0}</span>
              </div>
              <div className="chart-bar-bg">
                <div 
                  className="chart-bar-fill retired" 
                  style={{ width: getPercentage(vehicleStatusCounts?.Retired || 0) }}
                ></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Rules Simulator Floating Action Button */}
      <button 
        onClick={() => setShowSimulator(!showSimulator)}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--accent-gold)',
          color: '#2e1065',
          border: 'none',
          borderRadius: '50px',
          fontWeight: 700,
          fontSize: '0.88rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          cursor: 'pointer',
          transition: 'transform 0.2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Wrench size={16} />
        <span>Rules Simulator</span>
      </button>

      {/* Rules Simulator Control Panel Drawer */}
      {showSimulator && (
        <div style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '2rem',
          width: '380px',
          maxHeight: '80vh',
          background: 'white',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.25rem',
          color: 'var(--text-primary)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>Odoo Rules Sandbox</span>
            </h3>
            <button 
              onClick={() => {
                setShowSimulator(false);
                setSimulationResult(null);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
          
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: 0, marginBottom: '1.25rem', lineHeight: '1.4' }}>
            Simulate and verify backend operational rule enforcement. Each option sends an API request executing that scenario.
          </p>

          {/* Scenarios Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '0.82rem', padding: '0.6rem', textAlign: 'left', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              onClick={() => handleSimulateRule('overload')}
              disabled={simulating !== null}
            >
              <Play size={12} style={{ color: 'var(--accent-gold)' }} />
              <span>Simulate Overloaded Trip (Max capacity 500kg)</span>
            </button>

            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '0.82rem', padding: '0.6rem', textAlign: 'left', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              onClick={() => handleSimulateRule('expired-license')}
              disabled={simulating !== null}
            >
              <Play size={12} style={{ color: 'var(--accent-gold)' }} />
              <span>Assign Suspended Driver (Driver Suresh)</span>
            </button>

            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '0.82rem', padding: '0.6rem', textAlign: 'left', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              onClick={() => handleSimulateRule('double-booking')}
              disabled={simulating !== null}
            >
              <Play size={12} style={{ color: 'var(--accent-gold)' }} />
              <span>Assign On-Trip Vehicle (Vehicle TRK-12)</span>
            </button>

            <button 
              className="btn-primary" 
              style={{ width: '100%', fontSize: '0.82rem', padding: '0.6rem', textAlign: 'left', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}
              onClick={() => handleSimulateRule('lockout')}
              disabled={simulating !== null}
            >
              <Play size={12} style={{ color: 'var(--accent-gold)' }} />
              <span>Test Account Lockout (5 Failed Logins)</span>
            </button>
          </div>

          {/* Console Output Panel */}
          {(simulating || simulationResult) && (
            <div style={{
              background: '#121212',
              color: '#38bdf8',
              borderRadius: '8px',
              padding: '0.85rem',
              fontFamily: 'monospace',
              fontSize: '0.76rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              border: '1px solid #27272a',
              maxHeight: '180px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #27272a', paddingBottom: '0.3rem', color: '#a1a1aa', fontWeight: 'bold' }}>
                <span>RULE ENGINE OUTPUT</span>
                <span>bash</span>
              </div>
              
              {simulating ? (
                <div style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Loader2 className="animate-spin" size={12} />
                  <span>POST /api/dashboard/simulate/rule...</span>
                </div>
              ) : (
                <>
                  <div style={{ color: '#a1a1aa' }}>$ curl -X POST /api/dashboard/simulate/rule -d "ruleType: {simulationResult.ruleType || 'unknown'}"</div>
                  <div style={{ color: simulationResult.success ? '#10b981' : '#f43f5e', fontWeight: 'bold', marginTop: '0.2rem' }}>
                    {simulationResult.message}
                  </div>
                  {simulationResult.details && (
                    <div style={{ color: '#e4e4e7', whiteSpace: 'pre-wrap', marginTop: '0.2rem', paddingLeft: '0.5rem', borderLeft: '2px solid #3f3f46' }}>
                      {simulationResult.details}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
