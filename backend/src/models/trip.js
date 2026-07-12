const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    uppercase: true
  },
  source: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Driver',
    default: null
  },
  cargoWeightKg: {
    type: Number,
    required: true
  },
  plannedDistanceKm: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Draft', 'Dispatched', 'Completed', 'Cancelled'],
    default: 'Draft'
  },
  eta: {
    type: String,
    default: 'Awaiting vehicle'
  },
  finalOdometer: {
    type: Number,
    default: null
  },
  fuelConsumedL: {
    type: Number,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trip', tripSchema);
