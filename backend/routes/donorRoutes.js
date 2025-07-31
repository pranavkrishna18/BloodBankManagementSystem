const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  donateBlood,
  getDonationHistory,
  getEligibilityCountdown // 🆕 Import
} = require('../controllers/donorController');

// 💉 Schedule a Donation (future date supported)
router.post('/donate', protect, donateBlood);

// 📜 Get Donation History (latest first)
router.get('/history', protect, getDonationHistory);

// ⏳ Get Eligibility Countdown
router.get('/eligibility', protect, getEligibilityCountdown); // 🆕 New Route

module.exports = router;
