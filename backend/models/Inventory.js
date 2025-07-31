const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  bloodType: { type: String, required: true },
  units: { type: Number, default: 0 }
});

module.exports = mongoose.models.Inventory || mongoose.model('Inventory', inventorySchema);
