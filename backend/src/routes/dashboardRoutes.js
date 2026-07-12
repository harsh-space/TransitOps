const express = require('express');
const { authenticate } = require('../middleware/auth');
const Vehicle = require('../models/vehicle');
const Driver = require('../models/driver');
const Trip = require('../models/trip');

const router = express.Router();

// GET /api/dashboard/summary
router.get('/summary', authenticate, async (req, res) => {
  try {
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
        vehicleStatusCounts
      }
    });

  } catch (err) {
    console.error('Error fetching dashboard summary:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
