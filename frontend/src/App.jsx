import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import PageStub from './pages/PageStub';
import Layout from './components/Layout';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import Trips from './pages/Trips';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('transitops_token') || null);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Validate session on load
    const storedUser = localStorage.getItem('transitops_user');
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse user from local storage:', err);
        handleLogout();
      }
    }
    setInitializing(false);
  }, [token]);

  const handleLogin = (authToken, loggedInUser) => {
    setToken(authToken);
    setUser(loggedInUser);
    setCurrentTab('dashboard'); // Redirect to dashboard on login
  };

  const handleLogout = () => {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
    setToken(null);
    setUser(null);
    setCurrentTab('dashboard');
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#FBEFEF', color: '#2b1b1b' }}>
        <h3>Loading TransitOps Platform...</h3>
      </div>
    );
  }

  // Not logged in -> Render login page
  if (!token || !user) {
    return <Login onLogin={handleLogin} />;
  }

  // Logged in -> Render shell layout wrapping current tab view
  const renderView = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard token={token} />;
        
      case 'fleet':
        return <Vehicles token={token} />;

      case 'drivers':
        return <Drivers token={token} />;

      case 'trips':
        return <Trips token={token} />;

      case 'maintenance':
        return <Maintenance token={token} />;

      case 'fuel':
        return (
          <PageStub 
            title="Fuel & Expense Management" 
            owner="Member C (Financials)" 
            description="Log fuel refueling records and trip expenses (tolls, parking, repairs) to compute per-vehicle total operational costs."
            entities={['FuelLog', 'Expense', 'Trip', 'Vehicle']}
            routes={[
              'GET /fuel-logs - List fuel transaction records',
              'POST /fuel-logs - Log new fuel transaction',
              'GET /expenses - List operational expenses',
              'POST /expenses - Log new expense record (linked optionally to a Trip or Maintenance log)'
            ]}
          />
        );

      case 'analytics':
        return (
          <PageStub 
            title="Reports & Analytics" 
            owner="Member C (Financials)" 
            description="Visualize fleet efficiency (Distance ÷ Fuel), utilization metrics, operational costs roll-up, and vehicle ROI computations with CSV export reports."
            entities={['Vehicle', 'Trip', 'FuelLog', 'Expense']}
            routes={[
              'GET /analytics/summary - Get aggregated operational cost and ROI reports',
              'GET /analytics/export-csv - Generate and download analytical report as CSV file'
            ]}
          />
        );

      case 'settings':
        return <Settings token={token} user={user} />;

      default:
        return <Dashboard token={token} />;
    }
  };

  return (
    <Layout 
      user={user} 
      currentTab={currentTab} 
      setCurrentTab={setCurrentTab} 
      onLogout={handleLogout}
    >
      {renderView()}
    </Layout>
  );
}
