import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import PageStub from './pages/PageStub';
import Layout from './components/Layout';
import FuelExpenseManagement from './pages/FuelExpenseManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';
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
        return <FuelExpenseManagement token={token} />;

      case 'analytics':
        return <ReportsAnalytics token={token} />;

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
