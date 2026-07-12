const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  registrationNumber: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Van', 'Truck', 'Mini'],
    required: true
  },
  maxLoadCapacityKg: {
    type: Number,
    required: true
  },
  odometer: {
    type: Number,
    required: true
  },
  acquisitionCost: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Available', 'On Trip', 'In Shop', 'Retired'],
    default: 'Available'
  },
  region: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
