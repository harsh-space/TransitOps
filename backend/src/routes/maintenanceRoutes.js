const express = require('express');
const MaintenanceLog = require('../models/maintenanceLog');
const Vehicle = require('../models/vehicle');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/maintenance
router.get('/', authenticate, authorize('maintenance', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      // Populate vehicle data
      const data = mockStore.maintenanceLogs.map(log => ({
        ...log,
        vehicle: mockStore.vehicles.find(v => v._id === log.vehicle) || null
      }));
      return res.json({ success: true, data });
    }

    const logs = await MaintenanceLog.find({})
      .populate('vehicle')
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Error fetching maintenance logs:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/maintenance
// Logs a new maintenance service, automatically flipping vehicle status to 'In Shop'
router.post('/', authenticate, authorize('maintenance', 'full'), async (req, res) => {
  const { vehicle: vehicleId, serviceType, cost, date, status } = req.body;

  if (!vehicleId || !serviceType || cost === undefined) {
    return res.status(400).json({ success: false, error: 'Vehicle, service type, and cost are required.' });
  }

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const vehicle = mockStore.vehicles.find(v => v._id === vehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, error: 'Vehicle not found.' });
      }
      if (vehicle.status === 'Retired') {
        return res.status(400).json({ success: false, error: 'Cannot put a retired vehicle in maintenance.' });
      }

      const log = {
        _id: 'm_' + Date.now(),
        vehicle: vehicleId,
        serviceType,
        cost: parseFloat(cost),
        date: date || new Date().toISOString(),
        status: status || 'Active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStore.maintenanceLogs.unshift(log);

      // Auto flip vehicle status to 'In Shop'
      vehicle.status = 'In Shop';
      vehicle.updatedAt = new Date().toISOString();

      const populatedLog = { ...log, vehicle };
      return res.status(201).json({ success: true, data: populatedLog });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }

    if (vehicle.status === 'Retired') {
      return res.status(400).json({ success: false, error: 'Cannot put a retired vehicle in maintenance.' });
    }

    const log = new MaintenanceLog({
      vehicle: vehicleId,
      serviceType,
      cost,
      date: date || new Date(),
      status: status || 'Active'
    });

    await log.save();

    // Auto flip vehicle status to 'In Shop'
    vehicle.status = 'In Shop';
    await vehicle.save();

    const populatedLog = await log.populate('vehicle');
    return res.status(201).json({ success: true, data: populatedLog });
  } catch (err) {
    console.error('Error creating maintenance log:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/maintenance/:id/close
// Closes a service ticket and restores vehicle to 'Available' unless Retired
router.put('/:id/close', authenticate, authorize('maintenance', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const log = mockStore.maintenanceLogs.find(l => l._id === req.params.id);
      if (!log) {
        return res.status(404).json({ success: false, error: 'Maintenance log not found.' });
      }

      log.status = 'Completed';
      log.updatedAt = new Date().toISOString();

      const vehicle = mockStore.vehicles.find(v => v._id === log.vehicle);
      if (vehicle && vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        vehicle.updatedAt = new Date().toISOString();
      }

      const populatedLog = { ...log, vehicle: vehicle || null };
      return res.json({ success: true, data: populatedLog });
    }

    const log = await MaintenanceLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found.' });
    }

    log.status = 'Completed';
    await log.save();

    const vehicle = await Vehicle.findById(log.vehicle);
    if (vehicle) {
      if (vehicle.status !== 'Retired') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    const populatedLog = await log.populate('vehicle');
    return res.json({ success: true, data: populatedLog });
  } catch (err) {
    console.error('Error closing maintenance log:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/maintenance/:id
router.delete('/:id', authenticate, authorize('maintenance', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const idx = mockStore.maintenanceLogs.findIndex(l => l._id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Maintenance log not found.' });
      }
      mockStore.maintenanceLogs.splice(idx, 1);
      return res.json({ success: true, data: { message: 'Maintenance log deleted successfully.' } });
    }

    const log = await MaintenanceLog.findByIdAndDelete(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, error: 'Maintenance log not found.' });
    }
    return res.json({ success: true, data: { message: 'Maintenance log deleted successfully.' } });
  } catch (err) {
    console.error('Error deleting maintenance log:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
