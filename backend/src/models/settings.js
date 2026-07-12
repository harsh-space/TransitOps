const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  depotName: {
    type: String,
    required: true,
    default: 'TransitOps Central Depot'
  },
  currency: {
    type: String,
    default: 'INR (₹)'
  },
  distanceUnit: {
    type: String,
    default: 'Kilometers'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Settings', settingsSchema);
