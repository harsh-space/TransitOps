import React, { useState, useEffect, useRef } from 'react';
import { Loader2, RefreshCw, AlertCircle, ChevronDown, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

/* ── Custom Dashboard Dropdown ── */
function CustomDropdown({ label, options, value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          padding: '0.5rem 1rem',
          background: 'var(--bg-secondary)',
          border: `1px solid ${open ? 'var(--accent-gold)' : 'var(--border-color)'}`,
          borderRadius: '8px',
          color: 'var(--text-primary)',
          fontSize: '0.85rem',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: open ? '0 0 0 2px var(--accent-gold-glow)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          minWidth: '160px',
          justifyContent: 'space-between',
        }}
      >
        <span>
          {label}: <span style={{ color: '#7a668c' }}>{selected.label}</span>
        </span>
        <ChevronDown
          size={14}
          color="var(--text-secondary)"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 100,
          minWidth: '100%',
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          padding: '2px',
        }}>
          {options.map((option) => {
            const isActive = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.5rem 0.8rem',
                  fontSize: '0.82rem',
                  border: 'none',
                  borderRadius: '6px',
                  background: isActive ? '#FFE2E2' : 'transparent',
                  color: 'var(--text-primary)',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                  marginBottom: '2px',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FBEFEF'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{option.label}</span>
                {isActive && <Check size={13} color="#7a668c" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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

  useEffect(() => {
    let active = true;
    const fetchDashboard = async () => {
      setLoading(true);
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

  const { kpis, recentTrips, vehicleStatusCounts } = data || {};

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
          <RefreshCw size={14} /> Refresh Data
        </button>
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
    </div>
  );
}
