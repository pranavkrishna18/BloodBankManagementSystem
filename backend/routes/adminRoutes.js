const express = require('express');
const router = express.Router();

const {
  getAllRequests,
  updateRequestStatus,
  getInventory,
  getPublicInventory,
  getAdminAnalytics,        // 🆕 Import analytics controller
  seedInventoryUnits,       // 🆕 Optional: for demo/testing
  getCities,                 // 🆕 Get list of cities
  getPendingDonations,       // 🆕 Get pending donations
  approveDonation            // 🆕 Approve/reject donations
} = require('../controllers/adminController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

// ✅ Route to get all pending blood requests (with optional filters)
router.get('/requests', protect, isAdmin, getAllRequests);

// ✅ Route to update request status (approve/reject)
router.put('/request/:id', protect, isAdmin, updateRequestStatus);

// ✅ Route to get all pending donations
router.get('/donations', protect, isAdmin, getPendingDonations);

// ✅ Route to approve/reject pending donation
router.put('/donation/:id', protect, isAdmin, approveDonation);

// ✅ Route to get current blood inventory
router.get('/inventory', protect, isAdmin, getInventory);

// ✅ Route to get admin analytics data (weekly trends, top blood groups, location stats)
router.get('/analytics', protect, isAdmin, getAdminAnalytics);

// 🧪 Optional: Seed dummy donations (for testing/demo)
router.post('/seed', protect, isAdmin, seedInventoryUnits);

// ✅ Get public inventory
router.get('/public-inventory', getPublicInventory);

// ✅ Get list of cities (public)
router.get('/cities', getCities);

// ✅ Get list of cities (public alternative route)
router.get('/public-cities', getCities);

module.exports = router;
