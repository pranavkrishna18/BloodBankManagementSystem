const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema(
  {
    // 🔗 Donor reference
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    // 🩸 Blood group (validated enum)
    bloodType: {
      type: String,
      required: true,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
    },

    // 📍 Donation location
    location: {
      type: String,
      required: true,
      trim: true
    },

    // 📅 Scheduled donation date (default to now if not provided)
    date: {
      type: Date,
      default: Date.now
    },

    // 🚦 Donation status
    status: {
      type: String,
      enum: ['Scheduled', 'Cancelled', 'Completed'],
      default: 'Scheduled'
    },

    // 🛡 Admin approval flag
    adminApproved: {
      type: Boolean,
      default: false
    },

    // 🧾 Optional health snapshot at time of donation scheduling
    donorSnapshot: {
      age: {
        type: Number,
        min: 18,
        max: 65
      },
      weight: {
        type: Number,
        min: 45
      },
      lastDonationDate: {
        type: Date
      },
      isHealthy: {
        type: Boolean
      }
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

// ✅ Export model (reuse if already defined)
module.exports = mongoose.models.Donation || mongoose.model('Donation', donationSchema);
