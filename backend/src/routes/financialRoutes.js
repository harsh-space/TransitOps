const express = require('express');
const { authenticate } = require('../middleware/auth');
const Vehicle = require('../models/vehicle');
const Trip = require('../models/trip');
const FuelLog = require('../models/fuelLog');
const Expense = require('../models/expense');
const MaintenanceLog = require('../models/maintenanceLog');

const router = express.Router();

// GET /api/fuel-logs - Retrieve all fuel transaction logs
router.get('/fuel-logs', authenticate, async (req, res) => {
  try {
    const logs = await FuelLog.find({})
      .populate('vehicle')
      .sort({ date: -1 });
    
    return res.json({ success: true, data: logs });
  } catch (err) {
    console.error('Error fetching fuel logs:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve fuel logs.' });
  }
});

// POST /api/fuel-logs - Log a new fuel refueling record
router.post('/fuel-logs', authenticate, async (req, res) => {
  try {
    const { vehicle, date, liters, cost } = req.body;
    
    if (!vehicle || !liters || !cost) {
      return res.status(400).json({ success: false, error: 'Vehicle, liters, and cost are required fields.' });
    }

    // Check if vehicle exists
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }

    const newLog = await FuelLog.create({
      vehicle,
      date: date || new Date(),
      liters: Number(liters),
      cost: Number(cost)
    });

    const populatedLog = await FuelLog.findById(newLog._id).populate('vehicle');

    return res.status(201).json({ success: true, data: populatedLog });
  } catch (err) {
    console.error('Error logging fuel:', err);
    return res.status(500).json({ success: false, error: 'Failed to log fuel transaction.' });
  }
});

// GET /api/expenses - Retrieve all operational expenses
router.get('/expenses', authenticate, async (req, res) => {
  try {
    const expenses = await Expense.find({})
      .populate('vehicle')
      .populate('trip')
      .populate('maintenanceLog')
      .sort({ date: -1 });
    
    return res.json({ success: true, data: expenses });
  } catch (err) {
    console.error('Error fetching expenses:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve expenses.' });
  }
});

// POST /api/expenses - Log a new operational expense (tolls, parking, repairs, etc.)
router.post('/expenses', authenticate, async (req, res) => {
  try {
    const { vehicle, trip, maintenanceLog, tollCost, otherCost, maintenanceCostLinked, date } = req.body;

    if (!vehicle) {
      return res.status(400).json({ success: false, error: 'Vehicle is a required field.' });
    }

    // Verify vehicle exists
    const vehicleDoc = await Vehicle.findById(vehicle);
    if (!vehicleDoc) {
      return res.status(404).json({ success: false, error: 'Vehicle not found.' });
    }

    // Check optional references if provided
    if (trip) {
      const tripDoc = await Trip.findById(trip);
      if (!tripDoc) {
        return res.status(404).json({ success: false, error: 'Linked trip not found.' });
      }
    }

    if (maintenanceLog) {
      const maintenanceDoc = await MaintenanceLog.findById(maintenanceLog);
      if (!maintenanceDoc) {
        return res.status(404).json({ success: false, error: 'Linked maintenance log not found.' });
      }
    }

    const newExpense = await Expense.create({
      vehicle,
      trip: trip || null,
      maintenanceLog: maintenanceLog || null,
      tollCost: Number(tollCost || 0),
      otherCost: Number(otherCost || 0),
      maintenanceCostLinked: Number(maintenanceCostLinked || 0),
      date: date || new Date()
    });

    const populatedExpense = await Expense.findById(newExpense._id)
      .populate('vehicle')
      .populate('trip')
      .populate('maintenanceLog');

    return res.status(201).json({ success: true, data: populatedExpense });
  } catch (err) {
    console.error('Error logging expense:', err);
    return res.status(500).json({ success: false, error: 'Failed to log expense.' });
  }
});

// GET /api/analytics/summary - Fetch fleet aggregate financial and ROI data
router.get('/analytics/summary', authenticate, async (req, res) => {
  try {
    const allVehicles = await Vehicle.find({});
    const completedTrips = await Trip.find({ status: 'Completed' });
    const allFuelLogs = await FuelLog.find({});
    const allMaintenance = await MaintenanceLog.find({});
    const allExpenses = await Expense.find({});

    // 1. Fuel Efficiency = Distance ÷ Fuel (for completed trips with recorded fuel consumed, falling back to overall logs if needed)
    const totalDistance = completedTrips.reduce((sum, t) => sum + (t.plannedDistanceKm || 0), 0);
    const totalTripFuel = completedTrips.reduce((sum, t) => sum + (t.fuelConsumedL || 0), 0);
    const totalFuelLiters = allFuelLogs.reduce((sum, fl) => sum + (fl.liters || 0), 0);
    
    // Calculate fuel efficiency (km/L). Prefer trip-specific distance/fuel if available, otherwise total distance / total refueled liters.
    let fuelEfficiency = 0;
    if (totalTripFuel > 0) {
      fuelEfficiency = totalDistance / totalTripFuel;
    } else if (totalFuelLiters > 0) {
      fuelEfficiency = totalDistance / totalFuelLiters;
    }
    fuelEfficiency = Number(fuelEfficiency.toFixed(2));

    // 2. Fleet Utilization % = (Vehicles On Trip / Total Active Vehicles) * 100
    const activeVehicles = allVehicles.filter(v => v.status !== 'Retired');
    const onTripVehicles = allVehicles.filter(v => v.status === 'On Trip');
    const fleetUtilization = activeVehicles.length > 0 
      ? Math.round((onTripVehicles.length / activeVehicles.length) * 100) 
      : 0;

    // 3. Operational Cost = Fuel Cost + Maintenance Cost + Other Expenses (Tolls, Others)
    const totalFuelCost = allFuelLogs.reduce((sum, fl) => sum + (fl.cost || 0), 0);
    const totalMaintenanceCost = allMaintenance.reduce((sum, ml) => sum + (ml.cost || 0), 0);
    const totalOtherExpenses = allExpenses.reduce((sum, e) => sum + (e.tollCost || 0) + (e.otherCost || 0), 0);
    const operationalCost = totalFuelCost + totalMaintenanceCost + totalOtherExpenses;

    // 4. Fleet Vehicle ROI = (Revenue − (Maintenance + Fuel)) ÷ Acquisition Cost
    const totalRevenue = completedTrips.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const totalAcquisitionCost = activeVehicles.reduce((sum, v) => sum + (v.acquisitionCost || 0), 0);
    
    let fleetROI = 0;
    if (totalAcquisitionCost > 0) {
      fleetROI = ((totalRevenue - (totalMaintenanceCost + totalFuelCost)) / totalAcquisitionCost) * 100;
    }
    fleetROI = Number(fleetROI.toFixed(1));

    // 5. Monthly Revenue series (for the bar chart) - Last 6 months
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const revenueByMonth = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      revenueByMonth[mName] = 0;
    }

    completedTrips.forEach(trip => {
      const date = trip.updatedAt || trip.createdAt;
      if (date) {
        const mName = months[new Date(date).getMonth()];
        if (revenueByMonth[mName] !== undefined) {
          revenueByMonth[mName] += (trip.revenue || 0);
        }
      }
    });

    const monthlyRevenue = Object.keys(revenueByMonth).map(month => ({
      month,
      revenue: revenueByMonth[month]
    }));

    // 6. Top Costliest Vehicles ranking (Fuel + Maintenance + Tolls/Other Expenses)
    const vehiclesBreakdown = allVehicles.map(v => {
      const vehicleFuel = allFuelLogs
        .filter(fl => fl.vehicle && fl.vehicle.toString() === v._id.toString())
        .reduce((sum, fl) => sum + (fl.cost || 0), 0);

      const vehicleMaintenance = allMaintenance
        .filter(ml => ml.vehicle && ml.vehicle.toString() === v._id.toString())
        .reduce((sum, ml) => sum + (ml.cost || 0), 0);

      const vehicleExpenses = allExpenses
        .filter(e => e.vehicle && e.vehicle.toString() === v._id.toString())
        .reduce((sum, e) => sum + (e.tollCost || 0) + (e.otherCost || 0), 0);

      const vehicleTotalCost = vehicleFuel + vehicleMaintenance + vehicleExpenses;

      const vehicleRevenue = completedTrips
        .filter(t => t.vehicle && t.vehicle.toString() === v._id.toString())
        .reduce((sum, t) => sum + (t.revenue || 0), 0);

      const vehicleROI = v.acquisitionCost > 0 
        ? ((vehicleRevenue - (vehicleMaintenance + vehicleFuel)) / v.acquisitionCost) * 100 
        : 0;

      return {
        id: v._id,
        name: v.name,
        registrationNumber: v.registrationNumber,
        type: v.type,
        acquisitionCost: v.acquisitionCost,
        fuelCost: vehicleFuel,
        maintenanceCost: vehicleMaintenance,
        otherCost: vehicleExpenses,
        totalCost: vehicleTotalCost,
        revenue: vehicleRevenue,
        roi: Number(vehicleROI.toFixed(1))
      };
    });

    const topCostliestVehicles = [...vehiclesBreakdown]
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 5); // limit to top 5

    return res.json({
      success: true,
      data: {
        kpis: {
          fuelEfficiency,
          fleetUtilization,
          operationalCost,
          fleetROI
        },
        monthlyRevenue,
        topCostliestVehicles,
        allVehiclesFinancials: vehiclesBreakdown // useful for CSV export
      }
    });

  } catch (err) {
    console.error('Error generating analytics summary:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate analytics summary.' });
  }
});

// GET /api/vehicles - List all vehicles
router.get('/vehicles', authenticate, async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).sort({ name: 1 });
    return res.json({ success: true, data: vehicles });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch vehicles.' });
  }
});

// GET /api/trips - List all trips
router.get('/trips', authenticate, async (req, res) => {
  try {
    const trips = await Trip.find({}).populate('vehicle').sort({ createdAt: -1 });
    return res.json({ success: true, data: trips });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch trips.' });
  }
});

// GET /api/maintenance-logs - List all maintenance logs
router.get('/maintenance-logs', authenticate, async (req, res) => {
  try {
    const logs = await MaintenanceLog.find({}).populate('vehicle').sort({ date: -1 });
    return res.json({ success: true, data: logs });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to fetch maintenance logs.' });
  }
});

module.exports = router;
