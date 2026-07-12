require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user');
const Vehicle = require('./src/models/vehicle');
const Driver = require('./src/models/driver');
const Trip = require('./src/models/trip');
const Settings = require('./src/models/settings');
const FuelLog = require('./src/models/fuelLog');
const Expense = require('./src/models/expense');
const MaintenanceLog = require('./src/models/maintenanceLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/transitops';

async function seed() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear all existing collections
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Vehicle.deleteMany({});
    await Driver.deleteMany({});
    await Trip.deleteMany({});
    await Settings.deleteMany({});
    await FuelLog.deleteMany({});
    await Expense.deleteMany({});
    await MaintenanceLog.deleteMany({});

    console.log('Seeding Settings...');
    const defaultSettings = await Settings.create({
      depotName: 'TransitOps Bangalore Depot',
      currency: 'INR (₹)',
      distanceUnit: 'Kilometers'
    });

    console.log('Seeding Users...');
    // Note: The User schema's pre-save hook will handle password hashing
    const users = [
      {
        email: 'manager@transitops.in',
        passwordHash: 'password123',
        role: 'FleetManager'
      },
      {
        email: 'dispatcher@transitops.in',
        passwordHash: 'password123',
        role: 'Dispatcher'
      },
      {
        email: 'safety@transitops.in',
        passwordHash: 'password123',
        role: 'SafetyOfficer'
      },
      {
        email: 'analyst@transitops.in',
        passwordHash: 'password123',
        role: 'FinancialAnalyst'
      }
    ];

    for (const u of users) {
      await User.create(u);
    }

    console.log('Seeding Vehicles...');
    const vehiclesData = [
      {
        registrationNumber: 'KA-01-MJ-5005',
        name: 'VAN-05',
        type: 'Van',
        maxLoadCapacityKg: 500,
        odometer: 12000,
        acquisitionCost: 1500000,
        status: 'Available',
        region: 'North Bangalore'
      },
      {
        registrationNumber: 'KA-03-TR-8812',
        name: 'TRK-12',
        type: 'Truck',
        maxLoadCapacityKg: 8000,
        odometer: 45000,
        acquisitionCost: 3500000,
        status: 'On Trip',
        region: 'South Bangalore'
      },
      {
        registrationNumber: 'KA-04-MN-9008',
        name: 'MINI-08',
        type: 'Mini',
        maxLoadCapacityKg: 1000,
        odometer: 8000,
        acquisitionCost: 800000,
        status: 'In Shop',
        region: 'West Bangalore'
      },
      {
        registrationNumber: 'KA-02-VN-3009',
        name: 'VAN-09',
        type: 'Van',
        maxLoadCapacityKg: 600,
        odometer: 95000,
        acquisitionCost: 1200000,
        status: 'Retired',
        region: 'East Bangalore'
      }
    ];

    const vehicles = {};
    for (const v of vehiclesData) {
      const created = await Vehicle.create(v);
      vehicles[v.name] = created;
    }

    console.log('Seeding Drivers...');
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 2); // Valid for 2 years

    const driversData = [
      {
        name: 'Alex',
        licenseNumber: 'DL-1420230005',
        licenseCategory: 'HMV',
        licenseExpiry: futureDate,
        contactNumber: '+91 98765 43210',
        safetyScore: 96,
        tripCompletionRate: 98,
        status: 'On Trip'
      },
      {
        name: 'John',
        licenseNumber: 'DL-1420230012',
        licenseCategory: 'LMV',
        licenseExpiry: futureDate,
        contactNumber: '+91 98765 43211',
        safetyScore: 92,
        tripCompletionRate: 95,
        status: 'Available'
      },
      {
        name: 'Priya',
        licenseNumber: 'DL-1420230008',
        licenseCategory: 'LMV',
        licenseExpiry: futureDate,
        contactNumber: '+91 98765 43212',
        safetyScore: 98,
        tripCompletionRate: 100,
        status: 'Available'
      },
      {
        name: 'Suresh',
        licenseNumber: 'DL-1420233009',
        licenseCategory: 'HMV',
        licenseExpiry: futureDate,
        contactNumber: '+91 98765 43213',
        safetyScore: 75,
        tripCompletionRate: 80,
        status: 'Suspended'
      }
    ];

    const drivers = {};
    for (const d of driversData) {
      const created = await Driver.create(d);
      drivers[d.name] = created;
    }

    console.log('Seeding Trips...');
    const tripsData = [
      {
        tripId: 'TR001',
        source: 'Depot A',
        destination: 'North Warehouse',
        vehicle: vehicles['VAN-05']._id,
        driver: drivers['Alex']._id,
        cargoWeightKg: 450,
        plannedDistanceKm: 270,
        status: 'Dispatched',
        eta: '45 min',
        revenue: 0,
        createdAt: new Date('2026-07-10T10:00:00Z'),
        updatedAt: new Date('2026-07-10T10:00:00Z')
      },
      {
        tripId: 'TR002',
        source: 'Depot A',
        destination: 'South Warehouse',
        vehicle: vehicles['TRK-12']._id,
        driver: drivers['John']._id,
        cargoWeightKg: 5000,
        plannedDistanceKm: 150,
        status: 'Completed',
        eta: '--',
        finalOdometer: 45150,
        fuelConsumedL: 45,
        revenue: 45000,
        createdAt: new Date('2026-01-15T08:00:00Z'),
        updatedAt: new Date('2026-01-15T14:30:00Z')
      },
      {
        tripId: 'TR003',
        source: 'Depot A',
        destination: 'West Center',
        vehicle: vehicles['MINI-08']._id,
        driver: drivers['Priya']._id,
        cargoWeightKg: 800,
        plannedDistanceKm: 140,
        status: 'Dispatched',
        eta: '1h 10m',
        revenue: 0,
        createdAt: new Date('2026-07-12T09:00:00Z'),
        updatedAt: new Date('2026-07-12T09:00:00Z')
      },
      {
        tripId: 'TR004',
        source: 'Depot A',
        destination: 'East Hub',
        vehicle: null,
        driver: null,
        cargoWeightKg: 300,
        plannedDistanceKm: 130,
        status: 'Draft',
        eta: 'Awaiting vehicle',
        revenue: 0,
        createdAt: new Date('2026-07-12T08:30:00Z'),
        updatedAt: new Date('2026-07-12T08:30:00Z')
      },
      {
        tripId: 'TR005',
        source: 'Depot B',
        destination: 'South Warehouse',
        vehicle: vehicles['TRK-12']._id,
        driver: drivers['John']._id,
        cargoWeightKg: 6000,
        plannedDistanceKm: 220,
        status: 'Completed',
        eta: '--',
        finalOdometer: 45370,
        fuelConsumedL: 66,
        revenue: 65000,
        createdAt: new Date('2026-02-18T09:00:00Z'),
        updatedAt: new Date('2026-02-18T16:00:00Z')
      },
      {
        tripId: 'TR006',
        source: 'Depot A',
        destination: 'North Warehouse',
        vehicle: vehicles['VAN-05']._id,
        driver: drivers['Alex']._id,
        cargoWeightKg: 400,
        plannedDistanceKm: 280,
        status: 'Completed',
        eta: '--',
        finalOdometer: 12280,
        fuelConsumedL: 28,
        revenue: 35000,
        createdAt: new Date('2026-03-10T10:00:00Z'),
        updatedAt: new Date('2026-03-10T17:00:00Z')
      },
      {
        tripId: 'TR007',
        source: 'Depot A',
        destination: 'East Hub',
        vehicle: vehicles['MINI-08']._id,
        driver: drivers['Priya']._id,
        cargoWeightKg: 900,
        plannedDistanceKm: 135,
        status: 'Completed',
        eta: '--',
        finalOdometer: 8135,
        fuelConsumedL: 15,
        revenue: 28000,
        createdAt: new Date('2026-04-05T08:00:00Z'),
        updatedAt: new Date('2026-04-05T12:00:00Z')
      },
      {
        tripId: 'TR008',
        source: 'Depot B',
        destination: 'East Hub',
        vehicle: vehicles['TRK-12']._id,
        driver: drivers['John']._id,
        cargoWeightKg: 7500,
        plannedDistanceKm: 300,
        status: 'Completed',
        eta: '--',
        finalOdometer: 45670,
        fuelConsumedL: 90,
        revenue: 90000,
        createdAt: new Date('2026-05-20T07:00:00Z'),
        updatedAt: new Date('2026-05-20T17:00:00Z')
      },
      {
        tripId: 'TR009',
        source: 'Depot A',
        destination: 'South Warehouse',
        vehicle: vehicles['VAN-05']._id,
        driver: drivers['Alex']._id,
        cargoWeightKg: 480,
        plannedDistanceKm: 160,
        status: 'Completed',
        eta: '--',
        finalOdometer: 12440,
        fuelConsumedL: 18,
        revenue: 22000,
        createdAt: new Date('2026-06-25T11:00:00Z'),
        updatedAt: new Date('2026-06-25T16:00:00Z')
      },
      {
        tripId: 'TR010',
        source: 'Depot A',
        destination: 'West Center',
        vehicle: vehicles['MINI-08']._id,
        driver: drivers['Priya']._id,
        cargoWeightKg: 850,
        plannedDistanceKm: 145,
        status: 'Completed',
        eta: '--',
        finalOdometer: 8280,
        fuelConsumedL: 16,
        revenue: 30000,
        createdAt: new Date('2026-07-02T09:00:00Z'),
        updatedAt: new Date('2026-07-02T13:00:00Z')
      }
    ];

    const seededTrips = [];
    for (const t of tripsData) {
      const createdTrip = new Trip(t);
      // To bypass Mongoose auto-overwriting timestamps on create:
      if (t.createdAt) {
        createdTrip.createdAt = t.createdAt;
        createdTrip.updatedAt = t.updatedAt;
      }
      await createdTrip.save();
      seededTrips.push(createdTrip);
    }

    console.log('Seeding Fuel and Expenses for Analytics Verification...');
    // Seed some fuel logs
    const fuelLogsData = [
      {
        vehicle: vehicles['VAN-05']._id,
        date: new Date('2026-03-09T08:00:00Z'),
        liters: 30,
        cost: 3000
      },
      {
        vehicle: vehicles['VAN-05']._id,
        date: new Date('2026-06-24T08:00:00Z'),
        liters: 20,
        cost: 2100
      },
      {
        vehicle: vehicles['TRK-12']._id,
        date: new Date('2026-01-14T08:00:00Z'),
        liters: 50,
        cost: 5000
      },
      {
        vehicle: vehicles['TRK-12']._id,
        date: new Date('2026-02-17T08:00:00Z'),
        liters: 70,
        cost: 7200
      },
      {
        vehicle: vehicles['TRK-12']._id,
        date: new Date('2026-05-19T08:00:00Z'),
        liters: 95,
        cost: 9800
      },
      {
        vehicle: vehicles['MINI-08']._id,
        date: new Date('2026-04-04T08:00:00Z'),
        liters: 18,
        cost: 1850
      },
      {
        vehicle: vehicles['MINI-08']._id,
        date: new Date('2026-07-01T08:00:00Z'),
        liters: 20,
        cost: 2100
      }
    ];
    for (const fl of fuelLogsData) {
      await FuelLog.create(fl);
    }

    // Seed some maintenance logs
    const maintenanceLogsData = [
      {
        vehicle: vehicles['MINI-08']._id,
        serviceType: 'Brake Replacement',
        cost: 15000,
        date: new Date('2026-04-10T08:00:00Z'),
        status: 'Completed'
      },
      {
        vehicle: vehicles['VAN-05']._id,
        serviceType: 'Oil Change',
        cost: 3500,
        date: new Date('2026-05-12T08:00:00Z'),
        status: 'Completed'
      },
      {
        vehicle: vehicles['TRK-12']._id,
        serviceType: 'Engine Tuning',
        cost: 25000,
        date: new Date('2026-06-01T08:00:00Z'),
        status: 'Completed'
      }
    ];
    
    const seededMaintenanceLogs = [];
    for (const ml of maintenanceLogsData) {
      const created = await MaintenanceLog.create(ml);
      seededMaintenanceLogs.push(created);
    }

    // Seed expenses
    const expensesData = [
      {
        vehicle: vehicles['VAN-05']._id,
        trip: seededTrips.find(t => t.tripId === 'TR006')._id,
        tollCost: 500,
        otherCost: 200,
        date: new Date('2026-03-10T12:00:00Z')
      },
      {
        vehicle: vehicles['TRK-12']._id,
        trip: seededTrips.find(t => t.tripId === 'TR002')._id,
        tollCost: 1500,
        otherCost: 1000,
        date: new Date('2026-01-15T12:00:00Z')
      },
      {
        vehicle: vehicles['TRK-12']._id,
        trip: seededTrips.find(t => t.tripId === 'TR008')._id,
        tollCost: 2000,
        otherCost: 1500,
        date: new Date('2026-05-20T12:00:00Z')
      },
      {
        vehicle: vehicles['MINI-08']._id,
        maintenanceLog: seededMaintenanceLogs[0]._id,
        maintenanceCostLinked: seededMaintenanceLogs[0].cost,
        tollCost: 0,
        otherCost: 300,
        date: new Date('2026-04-10T12:00:00Z')
      },
      {
        vehicle: vehicles['VAN-05']._id,
        maintenanceLog: seededMaintenanceLogs[1]._id,
        maintenanceCostLinked: seededMaintenanceLogs[1].cost,
        tollCost: 100,
        otherCost: 0,
        date: new Date('2026-05-12T12:00:00Z')
      },
      {
        vehicle: vehicles['TRK-12']._id,
        maintenanceLog: seededMaintenanceLogs[2]._id,
        maintenanceCostLinked: seededMaintenanceLogs[2].cost,
        tollCost: 500,
        otherCost: 500,
        date: new Date('2026-06-01T12:00:00Z')
      }
    ];
    for (const exp of expensesData) {
      await Expense.create(exp);
    }

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding data:', err);
    process.exit(1);
  }
}

seed();
