const express = require('express');
const Settings = require('../models/settings');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create defaults if not found
      settings = await Settings.create({
        depotName: 'TransitOps Bangalore Depot',
        currency: 'INR (₹)',
        distanceUnit: 'Kilometers'
      });
    }
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Error fetching settings:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

// PUT /api/settings - Restricted to FleetManager
router.put('/', authenticate, async (req, res) => {
  if (req.user.role !== 'FleetManager') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Only Fleet Managers can update global settings.'
    });
  }

  const { depotName, currency, distanceUnit } = req.body;

  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (depotName !== undefined) settings.depotName = depotName;
    if (currency !== undefined) settings.currency = currency;
    if (distanceUnit !== undefined) settings.distanceUnit = distanceUnit;

    await settings.save();
    return res.json({ success: true, data: settings });
  } catch (err) {
    console.error('Error updating settings:', err);
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
});

module.exports = router;
