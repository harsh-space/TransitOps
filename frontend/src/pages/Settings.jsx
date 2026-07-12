import React, { useState, useEffect, useRef } from 'react';
import { Loader2, Save, CheckCircle2, ShieldAlert, ChevronDown, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

/* ── Custom Form Dropdown for Settings ── */
function FormDropdown({ options, value, onChange, disabled }) {
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
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: disabled ? '#f9f9f9' : 'var(--bg-secondary)',
          border: `1px solid ${open ? 'var(--accent-gold)' : 'var(--border-color)'}`,
          borderRadius: '6px',
          color: disabled ? 'var(--text-muted)' : 'var(--text-primary)',
          fontSize: '0.95rem',
          fontWeight: 500,
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: open ? '0 0 0 2px var(--accent-gold-glow)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
        }}
      >
        <span>{selected.label}</span>
        {!disabled && (
          <ChevronDown
            size={16}
            color="var(--text-secondary)"
            style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
          />
        )}
      </button>

      {open && !disabled && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          right: 0,
          zIndex: 100,
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
                  padding: '0.6rem 1rem',
                  fontSize: '0.9rem',
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
                {isActive && <Check size={14} color="#7a668c" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const CURRENCY_OPTIONS = [
  { value: 'INR (₹)', label: 'INR (₹)' },
  { value: 'USD ($)', label: 'USD ($)' },
  { value: 'EUR (€)', label: 'EUR (€)' },
  { value: 'GBP (£)', label: 'GBP (£)' }
];

const DISTANCE_OPTIONS = [
  { value: 'Kilometers', label: 'Kilometers (km)' },
  { value: 'Miles', label: 'Miles (mi)' }
];

export default function Settings({ token, user }) {
  const [depotName, setDepotName] = useState('');
  const [currency, setCurrency] = useState('INR (₹)');
  const [distanceUnit, setDistanceUnit] = useState('Kilometers');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isFleetManager = user?.role === 'FleetManager';

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/settings`);
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch settings.');
        }
        if (active) {
          setDepotName(result.data.depotName);
          setCurrency(result.data.currency);
          setDistanceUnit(result.data.distanceUnit);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        if (active) {
          setError(err.message || 'Connection error.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchSettings();

    return () => {
      active = false;
    };
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isFleetManager) return;

    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ depotName, currency, distanceUnit })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update settings.');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Error occurred while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Loading System Settings...</span>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Global configuration and role-based permissions matrix</p>
      </div>

      <div className="settings-grid">
        {/* General Settings form */}
        <section className="settings-section">
          <h3>General Configuration</h3>
          
          {!isFleetManager && (
            <div className="error-banner" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#1e40af', marginBottom: '1.5rem' }}>
              <ShieldAlert size={16} style={{ marginTop: '2px' }} />
              <div>
                <strong>Read-only view.</strong>
                <p style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>Only the Fleet Manager can update global operational settings.</p>
              </div>
            </div>
          )}

          {error && (
            <div className="error-banner">
              <ShieldAlert size={16} />
              <div>
                <strong>Error saving configuration.</strong>
                <p style={{ fontSize: '0.8rem' }}>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#065f46', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} />
              <span>Settings updated successfully.</span>
            </div>
          )}

          <form onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="depotName">Depot Name</label>
              <input
                id="depotName"
                type="text"
                value={depotName}
                onChange={(e) => setDepotName(e.target.value)}
                disabled={!isFleetManager}
                placeholder="TransitOps central depot"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency Unit</label>
              <FormDropdown
                options={CURRENCY_OPTIONS}
                value={currency}
                onChange={setCurrency}
                disabled={!isFleetManager}
              />
            </div>

            <div className="form-group">
              <label htmlFor="distanceUnit">Distance Unit</label>
              <FormDropdown
                options={DISTANCE_OPTIONS}
                value={distanceUnit}
                onChange={setDistanceUnit}
                disabled={!isFleetManager}
              />
            </div>

            {isFleetManager && (
              <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save Configuration</span>
                  </>
                )}
              </button>
            )}
          </form>
        </section>

        {/* RBAC Table Matrix */}
        <section className="settings-section">
          <h3>Role-Based Access Control (RBAC)</h3>
          <p className="settings-info-text">Static permission authorization gating. Roles are configured based on organization operational requirements.</p>

          <table className="matrix-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Fleet</th>
                <th>Drivers</th>
                <th>Trips</th>
                <th>Fuel/Exp</th>
                <th>Analytics</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Fleet Manager</td>
                <td><span className="matrix-badge full">Full</span></td>
                <td><span className="matrix-badge full">Full</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge full">Full</span></td>
              </tr>
              <tr>
                <td>Dispatcher</td>
                <td><span className="matrix-badge view">View</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge full">Full</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge none">None</span></td>
              </tr>
              <tr>
                <td>Safety Officer</td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge full">Full</span></td>
                <td><span className="matrix-badge view">View</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge none">None</span></td>
              </tr>
              <tr>
                <td>Financial Analyst</td>
                <td><span className="matrix-badge view">View</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge none">None</span></td>
                <td><span className="matrix-badge full">Full</span></td>
                <td><span className="matrix-badge full">Full</span></td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
