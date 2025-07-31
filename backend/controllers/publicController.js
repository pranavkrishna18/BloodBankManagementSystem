const Donation = require('../models/Donation');

// ✅ Publicly accessible inventory endpoint
exports.getPublicInventory = async (req, res) => {
  try {
    const inventory = await Donation.aggregate([
      {
        $match: { status: 'Completed', adminApproved: true } // Only approved + completed
      },
      {
        $group: {
          _id: '$bloodType',
          units: { $sum: 1 }
        }
      },
      {
        $project: {
          bloodType: '$_id',
          units: 1,
          _id: 0
        }
      }
    ]);

    res.status(200).json(inventory);
  } catch (err) {
    console.error('❌ Error fetching inventory:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
