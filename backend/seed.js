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
        eta: '45 min'
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
        fuelConsumedL: 45
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
        eta: '1h 10m'
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
        eta: 'Awaiting vehicle'
      }
    ];

    for (const t of tripsData) {
      await Trip.create(t);
    }

    console.log('Seeding Fuel and Expenses for Analytics Verification...');
    // Seed some fuel logs
    const fuelLogsData = [
      {
        vehicle: vehicles['VAN-05']._id,
        date: new Date(),
        liters: 30,
        cost: 3000
      },
      {
        vehicle: vehicles['TRK-12']._id,
        date: new Date(),
        liters: 100,
        cost: 10000
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
        date: new Date(),
        status: 'Active'
      }
    ];
    for (const ml of maintenanceLogsData) {
      await MaintenanceLog.create(ml);
    }

    // Seed expenses
    const expensesData = [
      {
        vehicle: vehicles['VAN-05']._id,
        tollCost: 500,
        otherCost: 200
      },
      {
        vehicle: vehicles['TRK-12']._id,
        tollCost: 1500,
        otherCost: 1000
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
