const express = require('express');
const router = express.Router();

const {
  getAllRequests,
  updateRequestStatus,
  getInventory,
  getPublicInventory,
  getAdminAnalytics,        // 🆕 Import analytics controller
  seedInventoryUnits        // 🆕 Optional: for demo/testing
} = require('../controllers/adminController');

const { protect, isAdmin } = require('../middleware/authMiddleware');

// ✅ Route to get all pending blood requests (with optional filters)
router.get('/requests', protect, isAdmin, getAllRequests);

// ✅ Route to update request status (approve/reject)
router.put('/request/:id', protect, isAdmin, updateRequestStatus);

// ✅ Route to get current blood inventory
router.get('/inventory', protect, isAdmin, getInventory);

// ✅ Route to get admin analytics data (weekly trends, top blood groups, location stats)
router.get('/analytics', protect, isAdmin, getAdminAnalytics);

// 🧪 Optional: Seed dummy donations (for testing/demo)
router.post('/seed', protect, isAdmin, seedInventoryUnits);

// Add this if not already present
router.get('/public-inventory',getPublicInventory);


module.exports = router;
