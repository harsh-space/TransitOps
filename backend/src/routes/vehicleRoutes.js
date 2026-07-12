const express = require('express');
const Vehicle = require('../models/vehicle');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/vehicles
router.get('/', authenticate, authorize('fleet', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      let data = mockStore.vehicles;
      const { availableOnly, type, status, region } = req.query;

      if (availableOnly === 'true') {
        data = data.filter(v => v.status === 'Available');
      } else if (status && status !== 'All') {
        data = data.filter(v => v.status === status);
      }

      if (type && type !== 'All') {
        data = data.filter(v => v.type === type);
      }

      if (region && region !== 'All') {
        data = data.filter(v => v.region.toLowerCase().includes(region.toLowerCase()));
      }

      return res.json({ success: true, data });
    }

    const { availableOnly, type, status, region } = req.query;
    const query = {};

    if (availableOnly === 'true') {
      query.status = 'Available';
    } else if (status && status !== 'All') {
      query.status = status;
    }

    if (type && type !== 'All') {
      query.type = type;
    }

    if (region && region !== 'All') {
      query.region = region;
    }

    const vehicles = await Vehicle.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, data: vehicles });
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/vehicles/:id
router.get('/:id', authenticate, authorize('fleet', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const vehicle = mockStore.vehicles.find(v => v._id === req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Vehicle not found.' });
      }
      return res.json({ success: true, data: vehicle });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }
    return res.json({ success: true, data: vehicle });
  } catch (err) {
    console.error('Error fetching vehicle:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/vehicles
router.post('/', authenticate, authorize('fleet', 'full'), async (req, res) => {
  const { registrationNumber, name, type, maxLoadCapacityKg, odometer, acquisitionCost, region, status } = req.body;

  if (!registrationNumber || !name || !type || maxLoadCapacityKg === undefined || odometer === undefined || acquisitionCost === undefined || !region) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const existing = mockStore.vehicles.find(v => v.registrationNumber === registrationNumber.toUpperCase().trim());
      if (existing) {
        return res.status(400).json({ success: false, error: `Vehicle registration number '${registrationNumber}' is already registered.` });
      }

      const vehicle = {
        _id: 'v_' + Date.now(),
        registrationNumber: registrationNumber.toUpperCase().trim(),
        name,
        type,
        maxLoadCapacityKg: parseFloat(maxLoadCapacityKg),
        odometer: parseFloat(odometer),
        acquisitionCost: parseFloat(acquisitionCost),
        region,
        status: status || 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStore.vehicles.unshift(vehicle);
      return res.status(201).json({ success: true, data: vehicle });
    }

    // Unique check
    const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: `Vehicle registration number '${registrationNumber}' is already registered.` });
    }

    const vehicle = new Vehicle({
      registrationNumber: registrationNumber.toUpperCase().trim(),
      name,
      type,
      maxLoadCapacityKg,
      odometer,
      acquisitionCost,
      region,
      status: status || 'Available'
    });

    await vehicle.save();
    return res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    console.error('Error creating vehicle:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/vehicles/:id
router.put('/:id', authenticate, authorize('fleet', 'full'), async (req, res) => {
  const { registrationNumber, name, type, maxLoadCapacityKg, odometer, acquisitionCost, region, status } = req.body;

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const vehicle = mockStore.vehicles.find(v => v._id === req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Vehicle not found.' });
      }

      if (registrationNumber && registrationNumber.toUpperCase().trim() !== vehicle.registrationNumber) {
        const existing = mockStore.vehicles.find(v => v.registrationNumber === registrationNumber.toUpperCase().trim());
        if (existing) {
          return res.status(400).json({ success: false, error: `Vehicle registration number '${registrationNumber}' is already in use by another vehicle.` });
        }
        vehicle.registrationNumber = registrationNumber.toUpperCase().trim();
      }

      if (name !== undefined) vehicle.name = name;
      if (type !== undefined) vehicle.type = type;
      if (maxLoadCapacityKg !== undefined) vehicle.maxLoadCapacityKg = parseFloat(maxLoadCapacityKg);
      if (odometer !== undefined) vehicle.odometer = parseFloat(odometer);
      if (acquisitionCost !== undefined) vehicle.acquisitionCost = parseFloat(acquisitionCost);
      if (region !== undefined) vehicle.region = region;
      if (status !== undefined) vehicle.status = status;
      vehicle.updatedAt = new Date().toISOString();

      return res.json({ success: true, data: vehicle });
    }

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }

    // Check unique registration if updating registration number
    if (registrationNumber && registrationNumber.toUpperCase().trim() !== vehicle.registrationNumber) {
      const existing = await Vehicle.findOne({ registrationNumber: registrationNumber.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({ success: false, error: `Vehicle registration number '${registrationNumber}' is already in use by another vehicle.` });
      }
      vehicle.registrationNumber = registrationNumber.toUpperCase().trim();
    }

    if (name !== undefined) vehicle.name = name;
    if (type !== undefined) vehicle.type = type;
    if (maxLoadCapacityKg !== undefined) vehicle.maxLoadCapacityKg = maxLoadCapacityKg;
    if (odometer !== undefined) vehicle.odometer = odometer;
    if (acquisitionCost !== undefined) vehicle.acquisitionCost = acquisitionCost;
    if (region !== undefined) vehicle.region = region;
    if (status !== undefined) vehicle.status = status;

    await vehicle.save();
    return res.json({ success: true, data: vehicle });
  } catch (err) {
    console.error('Error updating vehicle:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', authenticate, authorize('fleet', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const idx = mockStore.vehicles.findIndex(v => v._id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Vehicle not found.' });
      }
      mockStore.vehicles.splice(idx, 1);
      return res.json({ success: true, data: { message: 'Vehicle deleted successfully.' } });
    }

    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }
    return res.json({ success: true, data: { message: 'Vehicle deleted successfully.' } });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
