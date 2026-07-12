import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import PageStub from './pages/PageStub';
import Layout from './components/Layout';
import FuelExpenseManagement from './pages/FuelExpenseManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';

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
        return (
          <PageStub 
            title="Vehicle Registry" 
            owner="Member B (Fleet Operations)" 
            description="Onboard vehicles, monitor active mileage (odometers), acquisition metrics, and manage statuses (Available, On Trip, In Shop, Retired)."
            entities={['Vehicle']}
            routes={[
              'GET /vehicles - Get vehicles roster (supports ?availableOnly=true filter)',
              'POST /vehicles - Onboard new vehicle (enforces unique registration number)',
              'PUT /vehicles/:id - Update vehicle details & status',
              'DELETE /vehicles/:id - Decommission vehicle'
            ]}
          />
        );

      case 'drivers':
        return (
          <PageStub 
            title="Drivers & Safety Profiles" 
            owner="Member B (Fleet Operations)" 
            description="Manage driver records, track safety percentages, compliance levels, license categories, and license expirations."
            entities={['Driver']}
            routes={[
              'GET /drivers - Get drivers roster (supports ?availableOnly=true filter)',
              'POST /drivers - Register new driver (enforces unique license number)',
              'PUT /drivers/:id - Update driver profile & status (Available, On Trip, Off Duty, Suspended)'
            ]}
          />
        );

      case 'trips':
        return (
          <PageStub 
            title="Trip Dispatcher" 
            owner="Member B (Fleet Operations)" 
            description="Schedule transport operations, track cargo weight constraints, assign drivers/vehicles, and control the trip lifecycle (Draft, Dispatched, Completed, Cancelled)."
            entities={['Trip', 'Vehicle', 'Driver']}
            routes={[
              'GET /trips - List transport trips',
              'POST /trips - Create new dispatch record (validates cargo capacity & driver/vehicle availability)',
              'PUT /trips/:id/dispatch - Transition trip to Dispatched (flips asset statuses to On Trip)',
              'PUT /trips/:id/complete - Transition trip to Completed (records final odometer & fuel, returns assets to Available)',
              'PUT /trips/:id/cancel - Transition trip to Cancelled (returns assets to Available)'
            ]}
          />
        );

      case 'maintenance':
        return (
          <PageStub 
            title="Maintenance & Repairs" 
            owner="Member B (Fleet Operations)" 
            description="Log repair costs, track active work orders, and trigger automatic status changes (logging active maintenance flips vehicle status to In Shop)."
            entities={['MaintenanceLog', 'Vehicle']}
            routes={[
              'GET /maintenance-logs - Get all service records',
              'POST /maintenance-logs - Log new maintenance ticket (automatically sets vehicle status to In Shop)',
              'PUT /maintenance-logs/:id/close - Close service ticket (restores vehicle status to Available, unless Retired)'
            ]}
          />
        );

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
