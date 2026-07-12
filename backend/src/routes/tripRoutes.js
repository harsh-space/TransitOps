const express = require('express');
const Trip = require('../models/trip');
const Vehicle = require('../models/vehicle');
const Driver = require('../models/driver');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Helper: populate trip with vehicle/driver from mockStore
function populateMockTrip(trip, mockStore) {
  return {
    ...trip,
    vehicle: trip.vehicle ? (mockStore.vehicles.find(v => v._id === trip.vehicle) || null) : null,
    driver: trip.driver ? (mockStore.drivers.find(d => d._id === trip.driver) || null) : null
  };
}

// GET /api/trips
router.get('/', authenticate, authorize('trips', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const data = [...mockStore.trips]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(t => populateMockTrip(t, mockStore));
      return res.json({ success: true, data });
    }

    const trips = await Trip.find({})
      .populate('vehicle')
      .populate('driver')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: trips });
  } catch (err) {
    console.error('Error fetching trips:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/trips/:id
router.get('/:id', authenticate, authorize('trips', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const trip = mockStore.trips.find(t => t._id === req.params.id);
      if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
      return res.json({ success: true, data: populateMockTrip(trip, mockStore) });
    }

    const trip = await Trip.findById(req.params.id).populate('vehicle').populate('driver');
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
    return res.json({ success: true, data: trip });
  } catch (err) {
    console.error('Error fetching trip:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/trips
router.post('/', authenticate, authorize('trips', 'full'), async (req, res) => {
  const { tripId, source, destination, vehicle, driver, cargoWeightKg, plannedDistanceKm } = req.body;

  if (!tripId || !source || !destination || cargoWeightKg === undefined || plannedDistanceKm === undefined) {
    return res.status(400).json({ success: false, error: 'tripId, source, destination, cargo weight, and distance are required.' });
  }

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');

      const existing = mockStore.trips.find(t => t.tripId === tripId.toUpperCase().trim());
      if (existing) {
        return res.status(400).json({ success: false, error: `Trip ID '${tripId}' is already registered.` });
      }

      // Validate cargo capacity
      if (vehicle) {
        const veh = mockStore.vehicles.find(v => v._id === vehicle);
        if (veh && parseFloat(cargoWeightKg) > veh.maxLoadCapacityKg) {
          return res.status(400).json({
            success: false,
            error: `Cargo weight (${cargoWeightKg} kg) exceeds vehicle maximum capacity (${veh.maxLoadCapacityKg} kg for ${veh.name}).`
          });
        }
      }

      const trip = {
        _id: 't_' + Date.now(),
        tripId: tripId.toUpperCase().trim(),
        source,
        destination,
        vehicle: vehicle || null,
        driver: driver || null,
        cargoWeightKg: parseFloat(cargoWeightKg),
        plannedDistanceKm: parseFloat(plannedDistanceKm),
        status: 'Draft',
        eta: vehicle ? 'Awaiting dispatch' : 'Awaiting vehicle',
        finalOdometer: null,
        fuelConsumedL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStore.trips.unshift(trip);
      return res.status(201).json({ success: true, data: populateMockTrip(trip, mockStore) });
    }

    const existing = await Trip.findOne({ tripId: tripId.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: `Trip ID '${tripId}' is already registered.` });
    }

    if (vehicle) {
      const veh = await Vehicle.findById(vehicle);
      if (veh && cargoWeightKg > veh.maxLoadCapacityKg) {
        return res.status(400).json({
          success: false,
          error: `Cargo weight (${cargoWeightKg} kg) exceeds vehicle maximum capacity (${veh.maxLoadCapacityKg} kg for ${veh.name}).`
        });
      }
    }

    const trip = new Trip({
      tripId: tripId.toUpperCase().trim(),
      source,
      destination,
      vehicle: vehicle || null,
      driver: driver || null,
      cargoWeightKg,
      plannedDistanceKm,
      status: 'Draft',
      eta: vehicle ? 'Awaiting dispatch' : 'Awaiting vehicle'
    });

    await trip.save();
    const populated = await trip.populate(['vehicle', 'driver']);
    return res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('Error creating trip:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// PUT /api/trips/:id
router.put('/:id', authenticate, authorize('trips', 'full'), async (req, res) => {
  const { source, destination, vehicle, driver, cargoWeightKg, plannedDistanceKm } = req.body;

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const trip = mockStore.trips.find(t => t._id === req.params.id);
      if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
      if (trip.status !== 'Draft') return res.status(400).json({ success: false, error: 'Cannot edit trip after dispatch.' });

      const updatedVehicle = vehicle !== undefined ? (vehicle || null) : trip.vehicle;
      const updatedWeight = cargoWeightKg !== undefined ? parseFloat(cargoWeightKg) : trip.cargoWeightKg;

      if (updatedVehicle) {
        const veh = mockStore.vehicles.find(v => v._id === updatedVehicle);
        if (veh && updatedWeight > veh.maxLoadCapacityKg) {
          return res.status(400).json({ success: false, error: `Cargo weight (${updatedWeight} kg) exceeds vehicle max capacity (${veh.maxLoadCapacityKg} kg).` });
        }
      }

      if (source !== undefined) trip.source = source;
      if (destination !== undefined) trip.destination = destination;
      if (vehicle !== undefined) trip.vehicle = vehicle || null;
      if (driver !== undefined) trip.driver = driver || null;
      if (cargoWeightKg !== undefined) trip.cargoWeightKg = parseFloat(cargoWeightKg);
      if (plannedDistanceKm !== undefined) trip.plannedDistanceKm = parseFloat(plannedDistanceKm);
      trip.eta = trip.vehicle ? 'Awaiting dispatch' : 'Awaiting vehicle';
      trip.updatedAt = new Date().toISOString();

      return res.json({ success: true, data: populateMockTrip(trip, mockStore) });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
    if (trip.status !== 'Draft') return res.status(400).json({ success: false, error: 'Cannot edit trip after dispatch.' });

    if (source !== undefined) trip.source = source;
    if (destination !== undefined) trip.destination = destination;
    if (vehicle !== undefined) trip.vehicle = vehicle || null;
    if (driver !== undefined) trip.driver = driver || null;
    if (cargoWeightKg !== undefined) trip.cargoWeightKg = cargoWeightKg;
    if (plannedDistanceKm !== undefined) trip.plannedDistanceKm = plannedDistanceKm;

    await trip.save();
    const populated = await trip.populate(['vehicle', 'driver']);
    return res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error updating trip:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

// POST /api/trips/:id/dispatch  — Core Business Rule Engine
router.post('/:id/dispatch', authenticate, authorize('trips', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const trip = mockStore.trips.find(t => t._id === req.params.id);
      if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
      if (trip.status !== 'Draft') return res.status(400).json({ success: false, error: `Cannot dispatch a trip in '${trip.status}' status.` });
      if (!trip.vehicle || !trip.driver) return res.status(400).json({ success: false, error: 'A vehicle and driver must be assigned.' });

      const vehicle = mockStore.vehicles.find(v => v._id === trip.vehicle);
      const driver = mockStore.drivers.find(d => d._id === trip.driver);

      const errors = [];
      if (!vehicle) errors.push('Assigned vehicle not found.');
      else if (vehicle.status === 'Retired') errors.push('Assigned vehicle is retired.');
      else if (vehicle.status === 'In Shop') errors.push('Assigned vehicle is in maintenance/shop.');
      else if (vehicle.status === 'On Trip') errors.push('Assigned vehicle is already on another trip.');

      if (!driver) errors.push('Assigned driver not found.');
      else {
        if (driver.status === 'Suspended') errors.push('Assigned driver is suspended.');
        else if (driver.status === 'Off Duty') errors.push('Assigned driver is off duty.');
        else if (driver.status === 'On Trip') errors.push('Assigned driver is already on another trip.');
        if (new Date(driver.licenseExpiry) < new Date()) errors.push("Assigned driver's license has expired.");
      }

      if (trip.cargoWeightKg > vehicle?.maxLoadCapacityKg) {
        errors.push(`Cargo weight (${trip.cargoWeightKg} kg) exceeds vehicle max capacity (${vehicle.maxLoadCapacityKg} kg).`);
      }

      if (errors.length > 0) {
        return res.status(400).json({ success: false, error: 'Validation failed: ' + errors.join('; ') });
      }

      trip.status = 'Dispatched';
      trip.eta = 'On Trip';
      trip.updatedAt = new Date().toISOString();
      vehicle.status = 'On Trip';
      vehicle.updatedAt = new Date().toISOString();
      driver.status = 'On Trip';
      driver.updatedAt = new Date().toISOString();

      return res.json({ success: true, data: populateMockTrip(trip, mockStore) });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
    if (trip.status !== 'Draft') return res.status(400).json({ success: false, error: `Cannot dispatch a trip in '${trip.status}' status.` });
    if (!trip.vehicle || !trip.driver) return res.status(400).json({ success: false, error: 'A vehicle and driver must be assigned.' });

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);
    const errors = [];

    if (!vehicle) errors.push('Assigned vehicle not found.');
    else if (vehicle.status === 'Retired') errors.push('Assigned vehicle is retired.');
    else if (vehicle.status === 'In Shop') errors.push('Assigned vehicle is in maintenance/shop.');
    else if (vehicle.status === 'On Trip') errors.push('Assigned vehicle is already on another trip.');

    if (!driver) errors.push('Assigned driver not found.');
    else {
      if (driver.status === 'Suspended') errors.push('Assigned driver is suspended.');
      else if (driver.status === 'Off Duty') errors.push('Assigned driver is off duty.');
      else if (driver.status === 'On Trip') errors.push('Assigned driver is already on another trip.');
      if (new Date(driver.licenseExpiry) < new Date()) errors.push("Assigned driver's license has expired.");
    }

    if (vehicle && trip.cargoWeightKg > vehicle.maxLoadCapacityKg) {
      errors.push(`Cargo weight (${trip.cargoWeightKg} kg) exceeds vehicle max capacity (${vehicle.maxLoadCapacityKg} kg).`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: 'Validation failed: ' + errors.join('; ') });
    }

    trip.status = 'Dispatched';
    trip.eta = 'On Trip';
    vehicle.status = 'On Trip';
    driver.status = 'On Trip';

    await trip.save();
    await vehicle.save();
    await driver.save();

    const populated = await trip.populate(['vehicle', 'driver']);
    return res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error dispatching trip:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/trips/:id/complete
router.post('/:id/complete', authenticate, authorize('trips', 'full'), async (req, res) => {
  const { finalOdometer, fuelConsumedL } = req.body;

  if (finalOdometer === undefined || fuelConsumedL === undefined) {
    return res.status(400).json({ success: false, error: 'Final odometer and fuel consumed are required.' });
  }

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const trip = mockStore.trips.find(t => t._id === req.params.id);
      if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
      if (trip.status !== 'Dispatched') return res.status(400).json({ success: false, error: 'Only dispatched trips can be completed.' });

      const vehicle = trip.vehicle ? mockStore.vehicles.find(v => v._id === trip.vehicle) : null;
      const driver = trip.driver ? mockStore.drivers.find(d => d._id === trip.driver) : null;

      if (vehicle) {
        if (parseFloat(finalOdometer) < vehicle.odometer) {
          return res.status(400).json({ success: false, error: `Final odometer (${finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km).` });
        }
        vehicle.odometer = parseFloat(finalOdometer);
        if (vehicle.status !== 'Retired') vehicle.status = 'Available';
        vehicle.updatedAt = new Date().toISOString();
      }

      if (driver && driver.status !== 'Suspended') {
        driver.status = 'Available';
        driver.updatedAt = new Date().toISOString();
      }

      trip.status = 'Completed';
      trip.eta = '--';
      trip.finalOdometer = parseFloat(finalOdometer);
      trip.fuelConsumedL = parseFloat(fuelConsumedL);
      trip.updatedAt = new Date().toISOString();

      return res.json({ success: true, data: populateMockTrip(trip, mockStore) });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
    if (trip.status !== 'Dispatched') return res.status(400).json({ success: false, error: 'Only dispatched trips can be completed.' });

    const vehicle = await Vehicle.findById(trip.vehicle);
    const driver = await Driver.findById(trip.driver);

    if (vehicle) {
      if (parseFloat(finalOdometer) < vehicle.odometer) {
        return res.status(400).json({ success: false, error: `Final odometer (${finalOdometer} km) cannot be less than vehicle's current odometer (${vehicle.odometer} km).` });
      }
      vehicle.odometer = parseFloat(finalOdometer);
      if (vehicle.status !== 'Retired') vehicle.status = 'Available';
      await vehicle.save();
    }

    if (driver && driver.status !== 'Suspended') {
      driver.status = 'Available';
      await driver.save();
    }

    trip.status = 'Completed';
    trip.eta = '--';
    trip.finalOdometer = parseFloat(finalOdometer);
    trip.fuelConsumedL = parseFloat(fuelConsumedL);
    await trip.save();

    const populated = await trip.populate(['vehicle', 'driver']);
    return res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error completing trip:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/trips/:id/cancel
router.post('/:id/cancel', authenticate, authorize('trips', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const trip = mockStore.trips.find(t => t._id === req.params.id);
      if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
      if (trip.status === 'Completed' || trip.status === 'Cancelled') {
        return res.status(400).json({ success: false, error: `Cannot cancel a trip that is already ${trip.status.toLowerCase()}.` });
      }

      if (trip.status === 'Dispatched') {
        const vehicle = trip.vehicle ? mockStore.vehicles.find(v => v._id === trip.vehicle) : null;
        const driver = trip.driver ? mockStore.drivers.find(d => d._id === trip.driver) : null;
        if (vehicle && vehicle.status !== 'Retired') { vehicle.status = 'Available'; vehicle.updatedAt = new Date().toISOString(); }
        if (driver && driver.status !== 'Suspended') { driver.status = 'Available'; driver.updatedAt = new Date().toISOString(); }
      }

      trip.status = 'Cancelled';
      trip.eta = '--';
      trip.updatedAt = new Date().toISOString();

      return res.json({ success: true, data: populateMockTrip(trip, mockStore) });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
    if (trip.status === 'Completed' || trip.status === 'Cancelled') {
      return res.status(400).json({ success: false, error: `Cannot cancel a trip that is already ${trip.status.toLowerCase()}.` });
    }

    if (trip.status === 'Dispatched') {
      const vehicle = await Vehicle.findById(trip.vehicle);
      const driver = await Driver.findById(trip.driver);
      if (vehicle && vehicle.status !== 'Retired') { vehicle.status = 'Available'; await vehicle.save(); }
      if (driver && driver.status !== 'Suspended') { driver.status = 'Available'; await driver.save(); }
    }

    trip.status = 'Cancelled';
    trip.eta = '--';
    await trip.save();

    const populated = await trip.populate(['vehicle', 'driver']);
    return res.json({ success: true, data: populated });
  } catch (err) {
    console.error('Error cancelling trip:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/trips/:id
router.delete('/:id', authenticate, authorize('trips', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const idx = mockStore.trips.findIndex(t => t._id === req.params.id);
      if (idx === -1) return res.status(404).json({ success: false, error: 'Trip not found.' });
      if (mockStore.trips[idx].status === 'Dispatched') return res.status(400).json({ success: false, error: 'Cannot delete a dispatched trip. Cancel it first.' });
      mockStore.trips.splice(idx, 1);
      return res.json({ success: true, data: { message: 'Trip deleted successfully.' } });
    }

    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ success: false, error: 'Trip not found.' });
    if (trip.status === 'Dispatched') return res.status(400).json({ success: false, error: 'Cannot delete a dispatched trip. Cancel it first.' });

    await Trip.findByIdAndDelete(req.params.id);
    return res.json({ success: true, data: { message: 'Trip deleted successfully.' } });
  } catch (err) {
    console.error('Error deleting trip:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
