const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['donor', 'recipient', 'admin'],
    required: true
  },
  city: {
    type: String,
    enum: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Vijayawada'],
    default: 'Vijayawada'
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
