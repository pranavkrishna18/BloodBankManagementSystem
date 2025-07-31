const express = require('express');
const router = express.Router();

// ✅ Use correct controller
const { getPublicInventory } = require('../controllers/publicController');

// 🌍 Public: Get Blood Inventory
router.get('/inventory', getPublicInventory);

module.exports = router;
