// In-memory data store for mock fallback mode
const mockStore = {
  settings: {
    depotName: 'TransitOps Bangalore Depot (Mock Mode)',
    currency: 'INR (₹)',
    distanceUnit: 'Kilometers'
  },
  users: [
    {
      _id: 'u1',
      email: 'manager@transitops.in',
      passwordHash: 'password123', // compared directly in mock mode
      role: 'FleetManager',
      failedLoginAttempts: 0,
      lockedUntil: null
    },
    {
      _id: 'u2',
      email: 'dispatcher@transitops.in',
      passwordHash: 'password123',
      role: 'Dispatcher',
      failedLoginAttempts: 0,
      lockedUntil: null
    },
    {
      _id: 'u3',
      email: 'safety@transitops.in',
      passwordHash: 'password123',
      role: 'SafetyOfficer',
      failedLoginAttempts: 0,
      lockedUntil: null
    },
    {
      _id: 'u4',
      email: 'analyst@transitops.in',
      passwordHash: 'password123',
      role: 'FinancialAnalyst',
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  ],
  vehicles: [
    {
      _id: 'v1',
      registrationNumber: 'KA-01-MJ-5005',
      name: 'VAN-05',
      type: 'Van',
      maxLoadCapacityKg: 500,
      odometer: 12000,
      acquisitionCost: 1500000,
      status: 'Available',
      region: 'North Bangalore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'v2',
      registrationNumber: 'KA-03-TR-8812',
      name: 'TRK-12',
      type: 'Truck',
      maxLoadCapacityKg: 8000,
      odometer: 45000,
      acquisitionCost: 3500000,
      status: 'On Trip',
      region: 'South Bangalore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'v3',
      registrationNumber: 'KA-04-MN-9008',
      name: 'MINI-08',
      type: 'Mini',
      maxLoadCapacityKg: 1000,
      odometer: 8000,
      acquisitionCost: 800000,
      status: 'In Shop',
      region: 'West Bangalore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'v4',
      registrationNumber: 'KA-02-VN-3009',
      name: 'VAN-09',
      type: 'Van',
      maxLoadCapacityKg: 600,
      odometer: 95000,
      acquisitionCost: 1200000,
      status: 'Retired',
      region: 'East Bangalore',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  drivers: [
    {
      _id: 'd1',
      name: 'Alex',
      licenseNumber: 'DL-1420230005',
      licenseCategory: 'HMV',
      licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(), // 2 years from now
      contactNumber: '+91 98765 43210',
      safetyScore: 96,
      tripCompletionRate: 98,
      status: 'On Trip',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'd2',
      name: 'John',
      licenseNumber: 'DL-1420230012',
      licenseCategory: 'LMV',
      licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      contactNumber: '+91 98765 43211',
      safetyScore: 92,
      tripCompletionRate: 95,
      status: 'Available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'd3',
      name: 'Priya',
      licenseNumber: 'DL-1420230008',
      licenseCategory: 'LMV',
      licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      contactNumber: '+91 98765 43212',
      safetyScore: 98,
      tripCompletionRate: 100,
      status: 'Available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'd4',
      name: 'Suresh',
      licenseNumber: 'DL-1420233009',
      licenseCategory: 'HMV',
      licenseExpiry: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString(),
      contactNumber: '+91 98765 43213',
      safetyScore: 75,
      tripCompletionRate: 80,
      status: 'Suspended',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  trips: [
    {
      _id: 't1',
      tripId: 'TR001',
      source: 'Depot A',
      destination: 'North Warehouse',
      vehicle: 'v1', // populated in routes helper
      driver: 'd1',
      cargoWeightKg: 450,
      plannedDistanceKm: 270,
      status: 'Dispatched',
      eta: '45 min',
      finalOdometer: null,
      fuelConsumedL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 't2',
      tripId: 'TR002',
      source: 'Depot A',
      destination: 'South Warehouse',
      vehicle: 'v2',
      driver: 'd2',
      cargoWeightKg: 5000,
      plannedDistanceKm: 150,
      status: 'Completed',
      eta: '--',
      finalOdometer: 45150,
      fuelConsumedL: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 't3',
      tripId: 'TR003',
      source: 'Depot A',
      destination: 'West Center',
      vehicle: 'v3',
      driver: 'd3',
      cargoWeightKg: 800,
      plannedDistanceKm: 140,
      status: 'Dispatched',
      eta: '1h 10m',
      finalOdometer: null,
      fuelConsumedL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 't4',
      tripId: 'TR004',
      source: 'Depot A',
      destination: 'East Hub',
      vehicle: null,
      driver: null,
      cargoWeightKg: 300,
      plannedDistanceKm: 130,
      status: 'Draft',
      eta: 'Awaiting vehicle',
      finalOdometer: null,
      fuelConsumedL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  maintenanceLogs: [
    {
      _id: 'm1',
      vehicle: 'v3',
      serviceType: 'Brake Replacement',
      cost: 15000,
      date: new Date().toISOString(),
      status: 'Active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  fuelLogs: [
    {
      _id: 'f1',
      vehicle: 'v1',
      date: new Date().toISOString(),
      liters: 30,
      cost: 3000
    },
    {
      _id: 'f2',
      vehicle: 'v2',
      date: new Date().toISOString(),
      liters: 100,
      cost: 10000
    }
  ],
  expenses: [
    {
      _id: 'e1',
      vehicle: 'v1',
      tollCost: 500,
      otherCost: 200
    },
    {
      _id: 'e2',
      vehicle: 'v2',
      tollCost: 1500,
      otherCost: 1000
    }
  ]
};

module.exports = mockStore;
