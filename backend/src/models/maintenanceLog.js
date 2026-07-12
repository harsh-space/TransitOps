const mongoose = require('mongoose');

const maintenanceLogSchema = new mongoose.Schema({
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  serviceType: {
    type: String,
    required: true
  },
  cost: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Active', 'Completed'],
    default: 'Active'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MaintenanceLog', maintenanceLogSchema);
