import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { 
  Download, 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Calculator, 
  TrendingUp, 
  Percent, 
  ShieldAlert 
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000/api';

export default function ReportsAnalytics({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchAnalytics = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/analytics/summary`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await res.json();
        if (!res.ok) {
          throw new Error(result.error || 'Failed to fetch analytics summary.');
        }
        if (active) {
          setData(result.data);
        }
      } catch (err) {
        console.error('Error fetching analytics summary:', err);
        if (active) {
          setError(err.message || 'Connection error.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
    return () => {
      active = false;
    };
  }, [token, refreshKey]);

  // CSV Export Handler
  const handleExportCSV = () => {
    if (!data || !data.allVehiclesFinancials) {
      alert('No data available to export.');
      return;
    }

    const headers = [
      'Registration Number',
      'Vehicle Name',
      'Vehicle Type',
      'Acquisition Cost (INR)',
      'Fuel Cost (INR)',
      'Maintenance Cost (INR)',
      'Other Expense Cost (INR)',
      'Total Operational Cost (INR)',
      'Revenue Generated (INR)',
      'ROI (%)'
    ];

    const rows = data.allVehiclesFinancials.map(v => [
      v.registrationNumber,
      v.name,
      v.type,
      v.acquisitionCost,
      v.fuelCost,
      v.maintenanceCost,
      v.otherCost,
      v.totalCost,
      v.revenue,
      v.roi
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        // Escape quotes and commas if any string values have them
        const stringVal = String(val);
        if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `TransitOps_Fleet_Financials_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Indian Currency Formatting
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem' }}>
        <Loader2 className="animate-spin text-accent" size={36} style={{ color: 'var(--accent-gold)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>Compiling aggregate analytics and ROI models...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-banner" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <AlertCircle size={20} />
        <div>
          <strong>Failed to load analytics dashboard.</strong>
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

  const { kpis, monthlyRevenue, topCostliestVehicles } = data || {};

  // Color constants aligned with the application theme
  const CHART_COLORS = {
    revenue: '#7B6BA8', // Deep lavender
    fuel: '#C4836A',    // terracotta
    maintenance: '#B85C6E', // rose raspberry
    expenses: '#5B8C7A',    // sage teal
    activeGold: '#C5B3D3' // Lavender accent
  };

  // Stacked chart data formatting for top costliest vehicles
  const costliestChartData = topCostliestVehicles?.map(v => ({
    name: `${v.name} (${v.registrationNumber})`,
    'Fuel Cost': v.fuelCost,
    'Maintenance Cost': v.maintenanceCost,
    'Other Expenses': v.otherCost,
    total: v.totalCost
  })) || [];

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Reports & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Fleet performance, operational costs roll-up, and vehicle returns on investment</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            onClick={handleExportCSV}
            className="btn-primary" 
            style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          >
            <Download size={16} /> Export CSV
          </button>
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
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* 4 KPI Cards Grid */}
      <div className="kpis-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '2.5rem' }}>
        
        {/* KPI 1: Fuel Efficiency */}
        <div className="kpi-card green" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '135px' }}>
          <div>
            <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fuel Efficiency</span>
              <Calculator size={13} style={{ color: 'var(--status-available)' }} />
            </div>
            <div className="kpi-value" style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
              {kpis?.fuelEfficiency || 0} <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-secondary)' }}>km/L</span>
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 600 }}>
            FORMULA: <span style={{ color: '#7a668c' }}>Distance &divide; Fuel</span>
          </div>
        </div>

        {/* KPI 2: Fleet Utilization */}
        <div className="kpi-card purple" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '135px' }}>
          <div>
            <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fleet Utilization</span>
              <Percent size={13} style={{ color: 'var(--status-on-trip)' }} />
            </div>
            <div className="kpi-value" style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
              {kpis?.fleetUtilization || 0}%
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 600 }}>
            FORMULA: <span style={{ color: '#7a668c' }}>On-Trip / Active Vehicles</span>
          </div>
        </div>

        {/* KPI 3: Operational Cost */}
        <div className="kpi-card orange" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '135px' }}>
          <div>
            <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Operational Cost</span>
              <ShieldAlert size={13} style={{ color: 'var(--status-in-shop)' }} />
            </div>
            <div className="kpi-value" style={{ fontSize: '1.8rem', marginTop: '0.25rem', fontWeight: 800 }}>
              {formatCurrency(kpis?.operationalCost || 0)}
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 600 }}>
            FORMULA: <span style={{ color: '#7a668c' }}>Fuel + Maintenance + Expenses</span>
          </div>
        </div>

        {/* KPI 4: Vehicle ROI */}
        <div className="kpi-card blue" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '135px' }}>
          <div>
            <div className="kpi-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Fleet Vehicle ROI</span>
              <TrendingUp size={13} style={{ color: '#3b82f6' }} />
            </div>
            <div className="kpi-value" style={{ fontSize: '2rem', marginTop: '0.25rem' }}>
              {kpis?.fleetROI || 0}%
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', marginTop: '0.5rem', fontWeight: 600 }}>
            FORMULA: <span style={{ color: '#7a668c' }}>(Revenue - Cost) &divide; Acquisition</span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Monthly Revenue Bar Chart */}
        <div className="dashboard-panel">
          <div className="panel-header">Monthly Revenue</div>
          <div style={{ width: '100%', height: '320px' }}>
            {monthlyRevenue && monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyRevenue}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5CBCB" />
                  <XAxis 
                    dataKey="month" 
                    stroke="var(--text-secondary)" 
                    fontSize={11} 
                    fontWeight={600} 
                  />
                  <YAxis 
                    stroke="var(--text-secondary)" 
                    fontSize={11}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000) + 'k' : val}`}
                  />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  <Bar 
                    dataKey="revenue" 
                    fill={CHART_COLORS.revenue} 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  >
                    {monthlyRevenue.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.revenue} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No completed trip revenue data available.
              </div>
            )}
          </div>
        </div>

        {/* Top Costliest Vehicles Stacked Chart */}
        <div className="dashboard-panel">
          <div className="panel-header">Top Costliest Vehicles (Operational Breakdown)</div>
          <div style={{ width: '100%', height: '320px' }}>
            {costliestChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={costliestChartData}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F5CBCB" />
                  <XAxis 
                    type="number"
                    stroke="var(--text-secondary)" 
                    fontSize={11}
                    tickFormatter={(val) => `₹${val >= 1000 ? (val / 1000) + 'k' : val}`}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    stroke="var(--text-secondary)" 
                    fontSize={11} 
                    width={140}
                  />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    iconSize={10}
                  />
                  <Bar dataKey="Fuel Cost" stackId="cost" fill={CHART_COLORS.fuel} />
                  <Bar dataKey="Maintenance Cost" stackId="cost" fill={CHART_COLORS.maintenance} />
                  <Bar dataKey="Other Expenses" stackId="cost" fill={CHART_COLORS.expenses} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                No vehicle operational cost data found.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Vehicle financial breakdown list */}
      <div className="dashboard-panel" style={{ marginTop: '2rem' }}>
        <div className="panel-header">Vehicle Financial Registry & ROI Snapshot</div>
        <div className="data-table-wrapper">
          {!data || !data.allVehiclesFinancials || data.allVehiclesFinancials.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>No vehicles found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Vehicle Model</th>
                  <th>Type</th>
                  <th>Fuel Costs</th>
                  <th>Maintenance Costs</th>
                  <th>Other Expenses</th>
                  <th>Total Cost</th>
                  <th>Revenues</th>
                  <th>Acquisition</th>
                  <th>ROI (%)</th>
                </tr>
              </thead>
              <tbody>
                {data.allVehiclesFinancials.map(v => (
                  <tr key={v.id}>
                    <td style={{ fontWeight: 600 }}>{v.registrationNumber}</td>
                    <td>{v.name}</td>
                    <td>
                      <span className={`status-badge ${v.type.toLowerCase()}`}>{v.type}</span>
                    </td>
                    <td>{formatCurrency(v.fuelCost)}</td>
                    <td>{formatCurrency(v.maintenanceCost)}</td>
                    <td>{formatCurrency(v.otherCost)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(v.totalCost)}</td>
                    <td style={{ color: '#137333', fontWeight: 600 }}>{formatCurrency(v.revenue)}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatCurrency(v.acquisitionCost)}</td>
                    <td style={{ fontWeight: 700, color: v.roi >= 0 ? '#137333' : '#C5221F' }}>
                      {v.roi}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

    </div>
  );
}
