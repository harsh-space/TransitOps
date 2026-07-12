const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  trip: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trip',
    default: null
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  tollCost: {
    type: Number,
    default: 0
  },
  otherCost: {
    type: Number,
    default: 0
  },
  maintenanceCostLinked: {
    type: Number,
    default: 0
  },
  maintenanceLog: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MaintenanceLog',
    default: null
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Expense', expenseSchema);
