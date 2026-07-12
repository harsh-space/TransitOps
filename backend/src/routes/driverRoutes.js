const express = require('express');
const Driver = require('../models/driver');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// GET /api/drivers
router.get('/', authenticate, authorize('drivers', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      let data = mockStore.drivers;
      const { availableOnly, status } = req.query;

      if (availableOnly === 'true') {
        data = data.filter(d => d.status === 'Available');
      } else if (status && status !== 'All') {
        data = data.filter(d => d.status === status);
      }

      const today = new Date();
      const formattedDrivers = data.map(d => {
        const isExpired = new Date(d.licenseExpiry) < today;
        const daysToExpiry = Math.ceil((new Date(d.licenseExpiry) - today) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = !isExpired && daysToExpiry <= 30;

        return {
          ...d,
          isLicenseExpired: isExpired,
          isLicenseExpiringSoon,
          daysToExpiry
        };
      });

      return res.json({ success: true, data: formattedDrivers });
    }

    const { availableOnly, status } = req.query;
    const query = {};

    if (availableOnly === 'true') {
      query.status = 'Available';
    } else if (status && status !== 'All') {
      query.status = status;
    }

    const drivers = await Driver.find(query).sort({ createdAt: -1 });
    
    // Add extra field dynamic calculations (license expiry status)
    const today = new Date();
    const formattedDrivers = drivers.map(d => {
      const isExpired = new Date(d.licenseExpiry) < today;
      const daysToExpiry = Math.ceil((new Date(d.licenseExpiry) - today) / (1000 * 60 * 60 * 24));
      const isExpiringSoon = !isExpired && daysToExpiry <= 30;

      return {
        ...d.toObject(),
        isLicenseExpired: isExpired,
        isLicenseExpiringSoon,
        daysToExpiry
      };
    });

    return res.json({ success: true, data: formattedDrivers });
  } catch (err) {
    console.error('Error fetching drivers:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// GET /api/drivers/:id
router.get('/:id', authenticate, authorize('drivers', 'view'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const driver = mockStore.drivers.find(d => d._id === req.params.id);
      if (!driver) {
        return res.status(404).json({ success: false, error: 'Driver not found.' });
      }

      const today = new Date();
      const isExpired = new Date(driver.licenseExpiry) < today;
      const daysToExpiry = Math.ceil((new Date(driver.licenseExpiry) - today) / (1000 * 60 * 60 * 24));
      const isExpiringSoon = !isExpired && daysToExpiry <= 30;

      return res.json({
        success: true,
        data: {
          ...driver,
          isLicenseExpired: isExpired,
          isLicenseExpiringSoon,
          daysToExpiry
        }
      });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found.' });
    }

    const today = new Date();
    const isExpired = new Date(driver.licenseExpiry) < today;
    const daysToExpiry = Math.ceil((new Date(driver.licenseExpiry) - today) / (1000 * 60 * 60 * 24));
    const isExpiringSoon = !isExpired && daysToExpiry <= 30;

    return res.json({
      success: true,
      data: {
        ...driver.toObject(),
        isLicenseExpired: isExpired,
        isLicenseExpiringSoon,
        daysToExpiry
      }
    });
  } catch (err) {
    console.error('Error fetching driver:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// POST /api/drivers
router.post('/', authenticate, authorize('drivers', 'full'), async (req, res) => {
  const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, tripCompletionRate, status } = req.body;

  if (!name || !licenseNumber || !licenseCategory || !licenseExpiry || !contactNumber) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const existing = mockStore.drivers.find(d => d.licenseNumber === licenseNumber.toUpperCase().trim());
      if (existing) {
        return res.status(400).json({ success: false, error: `Driver with license number '${licenseNumber}' is already registered.` });
      }

      const driver = {
        _id: 'd_' + Date.now(),
        name,
        licenseNumber: licenseNumber.toUpperCase().trim(),
        licenseCategory,
        licenseExpiry,
        contactNumber,
        safetyScore: safetyScore !== undefined ? safetyScore : 100,
        tripCompletionRate: tripCompletionRate !== undefined ? tripCompletionRate : 100,
        status: status || 'Available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      mockStore.drivers.unshift(driver);
      return res.status(201).json({ success: true, data: driver });
    }

    // Unique check
    const existing = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, error: `Driver with license number '${licenseNumber}' is already registered.` });
    }

    const driver = new Driver({
      name,
      licenseNumber: licenseNumber.toUpperCase().trim(),
      licenseCategory,
      licenseExpiry,
      contactNumber,
      safetyScore: safetyScore !== undefined ? safetyScore : 100,
      tripCompletionRate: tripCompletionRate !== undefined ? tripCompletionRate : 100,
      status: status || 'Available'
    });

    await driver.save();
    return res.status(201).json({ success: true, data: driver });
  } catch (err) {
    console.error('Error creating driver:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/drivers/:id
router.put('/:id', authenticate, authorize('drivers', 'full'), async (req, res) => {
  const { name, licenseNumber, licenseCategory, licenseExpiry, contactNumber, safetyScore, tripCompletionRate, status } = req.body;

  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const driver = mockStore.drivers.find(d => d._id === req.params.id);
      if (!driver) {
        return res.status(404).json({ success: false, error: 'Driver not found.' });
      }

      if (licenseNumber && licenseNumber.toUpperCase().trim() !== driver.licenseNumber) {
        const existing = mockStore.drivers.find(d => d.licenseNumber === licenseNumber.toUpperCase().trim());
        if (existing) {
          return res.status(400).json({ success: false, error: `Driver license number '${licenseNumber}' is already registered to another driver.` });
        }
        driver.licenseNumber = licenseNumber.toUpperCase().trim();
      }

      if (name !== undefined) driver.name = name;
      if (licenseCategory !== undefined) driver.licenseCategory = licenseCategory;
      if (licenseExpiry !== undefined) driver.licenseExpiry = licenseExpiry;
      if (contactNumber !== undefined) driver.contactNumber = contactNumber;
      if (safetyScore !== undefined) driver.safetyScore = safetyScore;
      if (tripCompletionRate !== undefined) driver.tripCompletionRate = tripCompletionRate;
      if (status !== undefined) driver.status = status;
      driver.updatedAt = new Date().toISOString();

      return res.json({ success: true, data: driver });
    }

    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found.' });
    }

    // Check unique license number if updating it
    if (licenseNumber && licenseNumber.toUpperCase().trim() !== driver.licenseNumber) {
      const existing = await Driver.findOne({ licenseNumber: licenseNumber.toUpperCase().trim() });
      if (existing) {
        return res.status(400).json({ success: false, error: `Driver license number '${licenseNumber}' is already registered to another driver.` });
      }
      driver.licenseNumber = licenseNumber.toUpperCase().trim();
    }

    if (name !== undefined) driver.name = name;
    if (licenseCategory !== undefined) driver.licenseCategory = licenseCategory;
    if (licenseExpiry !== undefined) driver.licenseExpiry = licenseExpiry;
    if (contactNumber !== undefined) driver.contactNumber = contactNumber;
    if (safetyScore !== undefined) driver.safetyScore = safetyScore;
    if (tripCompletionRate !== undefined) driver.tripCompletionRate = tripCompletionRate;
    if (status !== undefined) driver.status = status;

    await driver.save();
    return res.json({ success: true, data: driver });
  } catch (err) {
    console.error('Error updating driver:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// DELETE /api/drivers/:id
router.delete('/:id', authenticate, authorize('drivers', 'full'), async (req, res) => {
  try {
    if (global.useMock) {
      const mockStore = require('../mockStore');
      const idx = mockStore.drivers.findIndex(d => d._id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ success: false, error: 'Driver not found.' });
      }
      mockStore.drivers.splice(idx, 1);
      return res.json({ success: true, data: { message: 'Driver deleted successfully.' } });
    }

    const driver = await Driver.findByIdAndDelete(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, error: 'Driver not found.' });
    }
    return res.json({ success: true, data: { message: 'Driver deleted successfully.' } });
  } catch (err) {
    console.error('Error deleting driver:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
