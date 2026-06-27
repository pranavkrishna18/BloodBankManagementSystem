require('dotenv').config();
const mongoose = require('mongoose');

console.log('Checking MongoDB connection...');
console.log('MONGO_URI:', process.env.MONGO_URI ? 'Set ✓' : 'NOT SET ✗');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
    
    // Check if models can be loaded
    const User = require('./models/User');
    const Donation = require('./models/Donation');
    const Request = require('./models/Request');
    const Inventory = require('./models/Inventory');
    
    console.log('✅ All models loaded successfully');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
