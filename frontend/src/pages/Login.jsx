import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Truck, LayoutDashboard, Route, Users, Coins, ChevronDown, Check } from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

const ROLES = [
  { Icon: LayoutDashboard, name: 'Fleet Manager',    value: 'FleetManager',    scope: 'Fleet registry & full oversight' },
  { Icon: Route,           name: 'Dispatcher',        value: 'Dispatcher',       scope: 'Trip planning & dispatch' },
  { Icon: Users,           name: 'Safety Officer',    value: 'SafetyOfficer',    scope: 'Driver compliance & profiles' },
  { Icon: Coins,           name: 'Financial Analyst', value: 'FinancialAnalyst', scope: 'Fuel logs, expenses & ROI' },
];

/* ── Custom Role Dropdown ── */
function RoleDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const selected = ROLES.find(r => r.value === value) || ROLES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.75rem 1rem',
          background: 'var(--bg-secondary)',
          border: `1px solid ${open ? 'var(--accent-gold)' : 'var(--border-color)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          boxShadow: open ? '0 0 0 3px var(--accent-gold-glow)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px', height: '28px',
            background: '#C5B3D3',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>
            <selected.Icon size={14} strokeWidth={2.2} color="#2e1065" />
          </div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {selected.name}
          </span>
        </div>
        <ChevronDown
          size={16}
          color="var(--text-secondary)"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: '#ffffff',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          zIndex: 100,
          overflow: 'hidden',
        }}>
          {ROLES.map((r) => {
            const isActive = r.value === value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => { onChange(r.value); setOpen(false); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.7rem 1rem',
                  background: isActive ? '#FFE2E2' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.1s',
                  borderBottom: '1px solid #F5CBCB',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#FBEFEF'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: '30px', height: '30px',
                  background: isActive ? '#C5B3D3' : '#F5CBCB',
                  borderRadius: '7px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <r.Icon size={14} strokeWidth={2.2} color={isActive ? '#2e1065' : '#6b5555'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: isActive ? 700 : 500, color: 'var(--text-primary)' }}>
                    {r.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                    {r.scope}
                  </div>
                </div>
                {isActive && <Check size={15} color="#7a668c" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Main Login Component ── */
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('manager@transitops.in');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('FleetManager');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || 'Failed to authenticate.');
        setLoading(false);
        return;
      }
      if (rememberMe) {
        localStorage.setItem('transitops_token', result.data.token);
        localStorage.setItem('transitops_user', JSON.stringify(result.data.user));
      }
      onLogin(result.data.token, result.data.user);
    } catch (err) {
      console.error('Login submit error:', err);
      setError('Connection to auth server failed. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">

      {/* ── LEFT PANEL ── */}
      <div className="login-left">

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div className="login-logo-icon">
            <Truck size={26} strokeWidth={2} />
          </div>
          <span style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.04em', color: '#1a1a1a' }}>
            TransitOps
          </span>
        </div>

        {/* Hero block — vertically centred */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.75rem' }}>

          {/* Headline */}
          <div>
            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              color: '#1a1a1a',
              marginBottom: '0.85rem'
            }}>
              Smart Fleet<br />
              <span style={{ color: '#7a668c' }}>Operations,</span><br />
              One Platform.
            </h1>
            <p style={{ fontSize: '1rem', color: '#555', lineHeight: 1.65, maxWidth: '90%' }}>
              Vehicles, drivers, dispatch, maintenance, fuel &amp; expenses — managed end-to-end in one rule-driven system.
            </p>
          </div>

          {/* Role cards */}
          <div>
            <div style={{
              fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: '#9c8585', marginBottom: '0.75rem'
            }}>
              Four roles, one login
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {ROLES.map(({ Icon, name, scope }) => (
                <div key={name} style={{
                  background: '#FFE2E2',
                  borderRadius: '10px',
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.75rem',
                  border: '1px solid #F5CBCB'
                }}>
                  <div style={{
                    width: '34px', height: '34px',
                    background: '#C5B3D3',
                    borderRadius: '8px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: '1px'
                  }}>
                    <Icon size={16} strokeWidth={2.2} color="#2e1065" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1a1a1a', lineHeight: 1.25 }}>{name}</div>
                    <div style={{ fontSize: '0.82rem', color: '#6b5555', marginTop: '0.2rem', lineHeight: 1.35 }}>{scope}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* ── RIGHT PANEL — form only ── */}
      <div className="login-right">
        <div className="login-form-box">
          <h2>Sign in to your account</h2>
          <p className="subtitle">Enter your credentials to continue</p>

          {error && (
            <div className="error-banner">
              <ShieldAlert className="error-banner-icon" size={18} />
              <div>
                <strong>Authentication failed.</strong>
                <div style={{ marginTop: '0.15rem', fontSize: '0.8rem', lineHeight: '1.25' }}>{error}</div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@transitops.in"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="form-group">
              <label>Role</label>
              <RoleDropdown value={role} onChange={setRole} />
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <a href="#" onClick={(e) => {
                e.preventDefault();
                alert('Please contact your Fleet Administrator to reset your password.');
              }}>Forgot password?</a>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
