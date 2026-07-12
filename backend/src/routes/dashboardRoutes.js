const express = require('express');
const { authenticate } = require('../middleware/auth');
const Vehicle = require('../models/vehicle');
const Driver = require('../models/driver');
const Trip = require('../models/trip');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const allVehicles = mockStore.vehicles;
      const activeVehicles = allVehicles.filter(v => v.status !== 'Retired').length;
      const availableVehicles = allVehicles.filter(v => v.status === 'Available').length;
      const maintenanceVehicles = allVehicles.filter(v => v.status === 'In Shop').length;
      const onTripVehicles = allVehicles.filter(v => v.status === 'On Trip').length;

      const allTrips = mockStore.trips;
      const activeTrips = allTrips.filter(t => t.status === 'Dispatched' || t.status === 'On Trip').length;
      const pendingTrips = allTrips.filter(t => t.status === 'Draft').length;

      const allDrivers = mockStore.drivers;
      const driversOnDuty = allDrivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

      let fleetUtilization = 0;
      if (activeVehicles > 0) {
        fleetUtilization = Math.round((onTripVehicles / activeVehicles) * 100);
      }

      // Sort and format recent trips
      const sortedTrips = [...allTrips].sort((a,b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);
      const formattedRecentTrips = sortedTrips.map(trip => {
        const vehicle = allVehicles.find(v => v._id === trip.vehicle);
        const driver = allDrivers.find(d => d._id === trip.driver);
        return {
          id: trip._id,
          tripId: trip.tripId,
          source: trip.source,
          destination: trip.destination,
          vehicleName: vehicle ? vehicle.name : '--',
          driverName: driver ? driver.name : '--',
          status: trip.status,
          eta: trip.eta || '--',
          cargoWeightKg: trip.cargoWeightKg,
          plannedDistanceKm: trip.plannedDistanceKm
        };
      });

      const vehicleStatusCounts = {
        Available: allVehicles.filter(v => v.status === 'Available').length,
        'On Trip': allVehicles.filter(v => v.status === 'On Trip').length,
        'In Shop': allVehicles.filter(v => v.status === 'In Shop').length,
        Retired: allVehicles.filter(v => v.status === 'Retired').length
      };

      // Mock alerts scanning
      const alerts = [];
      const unsafeDrivers = allDrivers.filter(d => d.safetyScore < 80);
      unsafeDrivers.forEach(d => {
        alerts.push({
          id: `unsafe-driver-${d._id}`,
          type: 'danger',
          message: `Safety Concern: Driver ${d.name} has a low safety score of ${d.safetyScore}%`,
          timestamp: new Date()
        });
      });

      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      allDrivers.forEach(d => {
        const expiry = new Date(d.licenseExpiry);
        if (expiry < today) {
          alerts.push({
            id: `license-expired-${d._id}`,
            type: 'danger',
            message: `Compliance Risk: Driver ${d.name}'s license expired on ${expiry.toLocaleDateString()}`,
            timestamp: new Date()
          });
        } else if (expiry <= thirtyDaysFromNow) {
          const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
          alerts.push({
            id: `license-expiring-${d._id}`,
            type: 'warning',
            message: `License Alert: Driver ${d.name}'s license expires in ${daysLeft} days (${expiry.toLocaleDateString()})`,
            timestamp: new Date()
          });
        }
      });

      allDrivers.filter(d => d.status === 'Suspended').forEach(d => {
        alerts.push({
          id: `driver-suspended-${d._id}`,
          type: 'warning',
          message: `Dispatch Warning: Driver ${d.name} is currently Suspended from operations`,
          timestamp: new Date()
        });
      });

      allVehicles.filter(v => v.status === 'In Shop').forEach(v => {
        alerts.push({
          id: `vehicle-shop-${v._id}`,
          type: 'info',
          message: `Maintenance: Vehicle ${v.name} (${v.registrationNumber}) is currently in the workshop`,
          timestamp: new Date()
        });
      });

      allVehicles.filter(v => v.status === 'Retired').forEach(v => {
        alerts.push({
          id: `vehicle-retired-${v._id}`,
          type: 'info',
          message: `Fleet Notice: Vehicle ${v.name} (${v.registrationNumber}) has been retired from the fleet`,
          timestamp: new Date()
        });
      });

      return res.json({
        success: true,
        data: {
          kpis: {
            activeVehicles,
            availableVehicles,
            maintenanceVehicles,
            activeTrips,
            pendingTrips,
            driversOnDuty,
            fleetUtilization
          },
          recentTrips: formattedRecentTrips,
          vehicleStatusCounts,
          alerts
        }
      });
    }

    // 1. Vehicles
    const allVehicles = await Vehicle.find({});
    const activeVehicles = allVehicles.filter(v => v.status !== 'Retired').length;
    const availableVehicles = allVehicles.filter(v => v.status === 'Available').length;
    const maintenanceVehicles = allVehicles.filter(v => v.status === 'In Shop').length;
    const onTripVehicles = allVehicles.filter(v => v.status === 'On Trip').length;

    // 2. Trips
    const allTrips = await Trip.find({});
    const activeTrips = allTrips.filter(t => t.status === 'Dispatched' || t.status === 'On Trip').length;
    const pendingTrips = allTrips.filter(t => t.status === 'Draft').length;

    // 3. Drivers
    const allDrivers = await Driver.find({});
    // Drivers on duty: Available or On Trip
    const driversOnDuty = allDrivers.filter(d => d.status === 'Available' || d.status === 'On Trip').length;

    // 4. Fleet Utilization %
    // Fleet Utilization = (Vehicles On Trip / Total Active Vehicles) * 100
    let fleetUtilization = 0;
    if (activeVehicles > 0) {
      fleetUtilization = Math.round((onTripVehicles / activeVehicles) * 100);
    }

    // 5. Recent Trips (limit to 10, newest updated first)
    const recentTrips = await Trip.find({})
      .populate('vehicle')
      .populate('driver')
      .sort({ updatedAt: -1 })
      .limit(10);

    // Format recent trips for UI display
    const formattedRecentTrips = recentTrips.map(trip => ({
      id: trip._id,
      tripId: trip.tripId,
      source: trip.source,
      destination: trip.destination,
      vehicleName: trip.vehicle ? trip.vehicle.name : '--',
      driverName: trip.driver ? trip.driver.name : '--',
      status: trip.status,
      eta: trip.eta || '--',
      cargoWeightKg: trip.cargoWeightKg,
      plannedDistanceKm: trip.plannedDistanceKm
    }));

    // 6. Vehicle Status counts (Available, On Trip, In Shop, Retired)
    const vehicleStatusCounts = {
      Available: allVehicles.filter(v => v.status === 'Available').length,
      'On Trip': allVehicles.filter(v => v.status === 'On Trip').length,
      'In Shop': allVehicles.filter(v => v.status === 'In Shop').length,
      Retired: allVehicles.filter(v => v.status === 'Retired').length
    };

    // 6. Alerts Scanning
    const alerts = [];

    // Safety Alert: Low Safety Score Drivers
    const unsafeDrivers = allDrivers.filter(d => d.safetyScore < 80);
    unsafeDrivers.forEach(d => {
      alerts.push({
        id: `unsafe-driver-${d._id}`,
        type: 'danger',
        message: `Safety Concern: Driver ${d.name} has a low safety score of ${d.safetyScore}%`,
        timestamp: new Date()
      });
    });

    // Compliance Alert: Expired or Expiring Licenses
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    allDrivers.forEach(d => {
      const expiry = new Date(d.licenseExpiry);
      if (expiry < today) {
        alerts.push({
          id: `license-expired-${d._id}`,
          type: 'danger',
          message: `Compliance Risk: Driver ${d.name}'s license expired on ${expiry.toLocaleDateString()}`,
          timestamp: new Date()
        });
      } else if (expiry <= thirtyDaysFromNow) {
        const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        alerts.push({
          id: `license-expiring-${d._id}`,
          type: 'warning',
          message: `License Alert: Driver ${d.name}'s license expires in ${daysLeft} days (${expiry.toLocaleDateString()})`,
          timestamp: new Date()
        });
      }
    });

    // Operational Alert: Suspended Drivers
    allDrivers.filter(d => d.status === 'Suspended').forEach(d => {
      alerts.push({
        id: `driver-suspended-${d._id}`,
        type: 'warning',
        message: `Dispatch Warning: Driver ${d.name} is currently Suspended from operations`,
        timestamp: new Date()
      });
    });

    // Asset Alert: Vehicles in Maintenance
    allVehicles.filter(v => v.status === 'In Shop').forEach(v => {
      alerts.push({
        id: `vehicle-shop-${v._id}`,
        type: 'info',
        message: `Maintenance: Vehicle ${v.name} (${v.registrationNumber}) is currently in the workshop`,
        timestamp: new Date()
      });
    });

    // Operational Alert: Retired Vehicles
    allVehicles.filter(v => v.status === 'Retired').forEach(v => {
      alerts.push({
        id: `vehicle-retired-${v._id}`,
        type: 'info',
        message: `Fleet Notice: Vehicle ${v.name} (${v.registrationNumber}) has been retired from the fleet`,
        timestamp: new Date()
      });
    });

    return res.json({
      success: true,
      data: {
        kpis: {
          activeVehicles,
          availableVehicles,
          maintenanceVehicles,
          activeTrips,
          pendingTrips,
          driversOnDuty,
          fleetUtilization
        },
        recentTrips: formattedRecentTrips,
        vehicleStatusCounts,
        alerts
      }
    });

  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/dashboard/simulate/rule
router.post('/simulate/rule', authenticate, async (req, res) => {
  const { ruleType } = req.body;

  try {
    if (ruleType === 'overload') {
      const vehicle = await Vehicle.findOne({ name: 'VAN-05' });
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Vehicle VAN-05 not found. Please run seed script first.' });
      }
      
      const cargoWeight = 650;
      if (cargoWeight > vehicle.maxLoadCapacityKg) {
        return res.status(400).json({
          success: false,
          error: `Capacity exceeded by ${cargoWeight - vehicle.maxLoadCapacityKg} kg. Vehicle ${vehicle.name} has max capacity of ${vehicle.maxLoadCapacityKg} kg. Dispatch blocked.`
        });
      }
      return res.json({ success: true, message: 'Trip validation passed (unexpected).' });
    }

    if (ruleType === 'expired-license') {
      const driver = await Driver.findOne({ name: 'Suresh' });
      if (!driver) {
        return res.status(404).json({ success: false, error: 'Driver Suresh not found. Please run seed script first.' });
      }

      if (driver.status === 'Suspended') {
        return res.status(400).json({
          success: false,
          error: `Compliance Violation: Driver ${driver.name} is currently Suspended and cannot be assigned to trips.`
        });
      }
      return res.json({ success: true, message: 'Driver validation passed (unexpected).' });
    }

    if (ruleType === 'double-booking') {
      const vehicle = await Vehicle.findOne({ name: 'TRK-12' });
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Vehicle TRK-12 not found. Please run seed script first.' });
      }

      if (vehicle.status === 'On Trip') {
        return res.status(400).json({
          success: false,
          error: `Booking Conflict: Vehicle ${vehicle.name} is already assigned to an active trip and is not Available.`
        });
      }
      return res.json({ success: true, message: 'Booking validation passed (unexpected).' });
    }

    if (ruleType === 'lockout') {
      return res.status(423).json({
        success: false,
        error: 'Account locked after 5 failed login attempts. Please try again in 15 minutes.'
      });
    }

    return res.status(400).json({ success: false, error: 'Invalid rule type.' });

  } catch (err) {
    console.error('Simulation error:', err);
    return res.status(500).json({ success: false, error: 'Simulation internal error.' });
  }
});

module.exports = router;
