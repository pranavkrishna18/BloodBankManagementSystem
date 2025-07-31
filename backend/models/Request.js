const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bloodType: {
    type: String,
    required: true,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
  },
  location: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true // ✅ Now it's mandatory to choose a date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true // ✅ Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('Request', requestSchema);
