import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Route, 
  Wrench, 
  Coins, 
  BarChart3, 
  Settings, 
  LogOut,
  Search
} from 'lucide-react';

const PERMISSIONS = {
  FleetManager: {
    fleet: 'full',
    drivers: 'full',
    trips: 'none',
    maintenance: 'full',
    fuelExpenses: 'none',
    analytics: 'full',
    settings: 'full'
  },
  Dispatcher: {
    fleet: 'view',
    drivers: 'none',
    trips: 'full',
    maintenance: 'none',
    fuelExpenses: 'none',
    analytics: 'none',
    settings: 'none'
  },
  SafetyOfficer: {
    fleet: 'none',
    drivers: 'full',
    trips: 'view',
    maintenance: 'none',
    fuelExpenses: 'none',
    analytics: 'none',
    settings: 'none'
  },
  FinancialAnalyst: {
    fleet: 'view',
    drivers: 'none',
    trips: 'none',
    maintenance: 'none',
    fuelExpenses: 'full',
    analytics: 'full',
    settings: 'view'
  }
};

export default function Layout({ children, user, currentTab, setCurrentTab, onLogout }) {
  const role = user?.role || 'Dispatcher';
  const userPermissions = PERMISSIONS[role] || {};

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, visible: true },
    { id: 'fleet', label: 'Fleet', icon: Truck, visible: userPermissions.fleet !== 'none' },
    { id: 'drivers', label: 'Drivers', icon: Users, visible: userPermissions.drivers !== 'none' },
    { id: 'trips', label: 'Trips', icon: Route, visible: userPermissions.trips !== 'none' },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench, visible: userPermissions.maintenance && userPermissions.maintenance !== 'none' },
    { id: 'fuel', label: 'Fuel & Expenses', icon: Coins, visible: userPermissions.fuelExpenses !== 'none' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, visible: userPermissions.analytics !== 'none' },
    { id: 'settings', label: 'Settings', icon: Settings, visible: userPermissions.settings !== 'none' }
  ];

  // Helper to format role names to be user friendly
  const formatRole = (r) => {
    if (r === 'FleetManager') return 'Fleet Manager';
    if (r === 'SafetyOfficer') return 'Safety Officer';
    if (r === 'FinancialAnalyst') return 'Financial Analyst';
    return r; // e.g. Dispatcher
  };

  // Get initials for Avatar
  const getInitials = (email) => {
    if (!email) return 'U';
    const part = email.split('@')[0];
    if (part.length <= 2) return part.toUpperCase();
    return (part.charAt(0) + part.charAt(part.length - 1)).toUpperCase();
  };

  const getUsername = (email) => {
    if (!email) return 'User';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="login-logo-icon" style={{ width: '32px', height: '32px', fontSize: '1rem' }}>
              <Truck size={16} strokeWidth={2} />
            </div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>TransitOps</h2>
          </div>
          
          <nav className="sidebar-nav">
            {menuItems.map(item => {
              if (!item.visible) return null;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`nav-item ${currentTab === item.id ? 'active' : ''}`}
                  style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="top-bar">
          <div className="search-container">
            <Search size={16} className="text-secondary" />
            <input type="text" placeholder="Search..." disabled style={{ outline: 'none' }} />
          </div>

          <div className="user-profile">
            <span className="role-badge">{formatRole(role)}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{getUsername(user?.email)}</span>
            <div className="user-avatar">
              {getInitials(user?.email)}
            </div>
          </div>
        </header>

        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
