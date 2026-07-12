import React from 'react';
import { 
  Truck, 
  Users, 
  Route, 
  Wrench, 
  Coins, 
  BarChart3, 
  Search, 
  Plus,
  AlertCircle
} from 'lucide-react';

export default function PageStub({ title, description }) {
  // Determine view type based on title
  const isFleet = title.includes("Vehicle");
  const isDrivers = title.includes("Driver");
  const isTrips = title.includes("Trip");
  const isMaintenance = title.includes("Maintenance");
  const isFuel = title.includes("Fuel");
  const isAnalytics = title.includes("Reports");

  // Render Table Header Helper
  const renderTableHeader = (columns) => (
    <thead>
      <tr>
        {columns.map((col, idx) => (
          <th key={idx} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', textTransform: 'uppercase' }}>
            {col}
          </th>
        ))}
      </tr>
    </thead>
  );

  // Render Empty State Panel Helper
  const renderEmptyStatePanel = (Icon, heading, subtext, actionLabel) => (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4rem 2rem',
      textAlign: 'center',
      background: 'var(--bg-secondary)',
      borderRadius: '8px',
      border: '1px dashed var(--border-color)',
      marginTop: '1.5rem',
      color: 'var(--text-primary)'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
        color: 'var(--accent-gold)'
      }}>
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>{heading}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px', marginBottom: '1.5rem', lineHeight: '1.4' }}>
        {subtext}
      </p>
      {actionLabel && (
        <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'not-allowed', opacity: 0.7 }} disabled>
          <Plus size={14} />
          {actionLabel}
        </button>
      )}
    </div>
  );

  return (
    <div style={{ width: '100%' }}>
      {/* Title & Description Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{description}</p>
        </div>
      </div>

      {/* Vehicle Registry Stub */}
      {isFleet && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div className="search-container" style={{ width: '350px' }}>
              <Search size={16} className="text-secondary" />
              <input type="text" placeholder="Search vehicles by name, type, or registration..." disabled />
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'not-allowed', opacity: 0.7 }} disabled>
              <Plus size={14} /> Onboard Vehicle
            </button>
          </div>
          <div className="dashboard-panel" style={{ padding: 0 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              {renderTableHeader(['Registration Number', 'Vehicle Name', 'Type', 'Odometer', 'Capacity', 'Status', 'Region'])}
            </table>
            {renderEmptyStatePanel(Truck, "No Vehicles Onboarded", "Onboard your transport vehicles to manage dispatch routes, safety constraints, and maintenance scheduling.", "Add Your First Vehicle")}
          </div>
        </div>
      )}

      {/* Drivers Stub */}
      {isDrivers && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div className="search-container" style={{ width: '350px' }}>
              <Search size={16} className="text-secondary" />
              <input type="text" placeholder="Search drivers by name or license number..." disabled />
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'not-allowed', opacity: 0.7 }} disabled>
              <Plus size={14} /> Add Driver
            </button>
          </div>
          <div className="dashboard-panel" style={{ padding: 0 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              {renderTableHeader(['Driver Name', 'License Number', 'Category', 'License Expiry', 'Safety Score', 'Status'])}
            </table>
            {renderEmptyStatePanel(Users, "No Drivers Registered", "Add driver profile details and verify license classifications before dispatching active fleet trips.", "Register New Driver")}
          </div>
        </div>
      )}

      {/* Trip Dispatcher Stub */}
      {isTrips && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-primary)' }}>All Trips (0)</span>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>Drafts</span>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>Dispatched</span>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>Completed</span>
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'not-allowed', opacity: 0.7 }} disabled>
              <Plus size={14} /> Create Trip
            </button>
          </div>
          {renderEmptyStatePanel(Route, "No Active Trips Scheduled", "Plan dispatcher trips, check driver status expirations, validate cargo load capacities, and manage delivery lifecycles.", "Create New Trip")}
        </div>
      )}

      {/* Maintenance Stub */}
      {isMaintenance && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '1rem' }}>
            <div className="search-container" style={{ width: '350px' }}>
              <Search size={16} className="text-secondary" />
              <input type="text" placeholder="Search maintenance logs by vehicle..." disabled />
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'not-allowed', opacity: 0.7 }} disabled>
              <Plus size={14} /> Log Service Record
            </button>
          </div>
          <div className="dashboard-panel" style={{ padding: 0 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              {renderTableHeader(['Vehicle', 'Service Type', 'Cost', 'Date', 'Status'])}
            </table>
            {renderEmptyStatePanel(Wrench, "All Vehicles Operational", "There are no active vehicle service tickets. Add a record to put a vehicle 'In Shop' and remove it from the dispatch pool.", "Log Maintenance Record")}
          </div>
        </div>
      )}

      {/* Fuel & Expenses Stub */}
      {isFuel && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', fontWeight: 600, background: 'var(--bg-tertiary)', borderRadius: '4px', color: 'var(--text-primary)' }}>Fuel Logs (0)</span>
              <span style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'not-allowed' }}>Other Expenses (0)</span>
            </div>
            <button className="btn-primary" style={{ width: 'auto', padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'not-allowed', opacity: 0.7 }} disabled>
              <Plus size={14} /> Log Fuel transaction
            </button>
          </div>
          <div className="dashboard-panel" style={{ padding: 0 }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              {renderTableHeader(['Date', 'Vehicle', 'Refill Liters', 'Cost', 'Recorded By'])}
            </table>
            {renderEmptyStatePanel(Coins, "No Fuel Logs Recorded", "Record vehicle fuel fill-ups and toll receipts to roll up overall fleet operational costs.", "Log First Fuel Entry")}
          </div>
        </div>
      )}

      {/* Reports & Analytics Stub */}
      {isAnalytics && (
        <div>
          {/* Mock KPI Grid */}
          <div className="kpis-grid" style={{ marginBottom: '2rem' }}>
            <div className="kpi-card green">
              <div className="kpi-label">Average Fuel Efficiency</div>
              <div className="kpi-value" style={{ color: 'var(--text-muted)' }}>0.0 km/L</div>
            </div>
            <div className="kpi-card green">
              <div className="kpi-label">Active Fleet Utilization</div>
              <div className="kpi-value" style={{ color: 'var(--text-muted)' }}>0.0%</div>
            </div>
            <div className="kpi-card orange">
              <div className="kpi-label">Total Operational Cost</div>
              <div className="kpi-value" style={{ color: 'var(--text-muted)' }}>₹0.00</div>
            </div>
            <div className="kpi-card blue">
              <div className="kpi-label">Overall Fleet ROI</div>
              <div className="kpi-value" style={{ color: 'var(--text-muted)' }}>0.0%</div>
            </div>
          </div>
          {renderEmptyStatePanel(BarChart3, "No Analytical Data Found", "Fuel transaction logs, maintenance tickets, and completed trip distance data will compile to populate charts.", "")}
        </div>
      )}
    </div>
  );
}
