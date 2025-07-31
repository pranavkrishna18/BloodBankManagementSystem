// recipientRoutes.js
const express = require('express');
const router = express.Router();

const { protect, isRecipient } = require('../middleware/authMiddleware');

const {
  requestBlood,
  getRequestHistory,
  getApprovedRequestsGrouped
} = require('../controllers/recipientController');

// 🩸 Request blood (POST)
router.post('/request', protect, isRecipient, requestBlood);

// 📄 View personal blood request history
router.get('/my-requests', protect, isRecipient, getRequestHistory);

// 📊 View approved requests grouped by blood type
router.get('/approved-requests', protect, isRecipient, getApprovedRequestsGrouped);

module.exports = router;
