const Donation = require('../models/Donation');

/**
 * 🧛 Auto-expire blood units that have passed their expiry date
 * Marks expired units as isExpired: true and status: 'Cancelled'
 * Run on server startup and every 24 hours via setInterval
 */
const expireBloodUnits = async () => {
  try {
    const now = new Date();
    const result = await Donation.updateMany(
      {
        expiryDate: { $lt: now },
        isExpired: false,
        status: { $ne: 'Cancelled' }
      },
      { $set: { isExpired: true, status: 'Cancelled' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`⏰ Auto-expired ${result.modifiedCount} blood unit(s) past expiry date.`);
    }
  } catch (err) {
    console.error('❌ Expiry job error:', err.message);
  }
};

module.exports = expireBloodUnits;
