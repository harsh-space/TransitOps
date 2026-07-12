const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  licenseNumber: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  licenseCategory: {
    type: String,
    enum: ['LMV', 'HMV'],
    required: true
  },
  licenseExpiry: {
    type: Date,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  safetyScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  tripCompletionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'Off Duty', 'Suspended'],
    default: 'Available'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Driver', driverSchema);
