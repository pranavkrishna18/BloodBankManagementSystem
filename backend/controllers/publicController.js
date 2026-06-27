const Donation = require('../models/Donation');

// ✅ Publicly accessible inventory endpoint - City-aware
exports.getPublicInventory = async (req, res) => {
  try {
    const { city } = req.query;
    const matchStage = {
      status: 'Completed',
      adminApproved: true,
      isExpired: false,
      expiryDate: { $gt: new Date() }
    };
    if (city) matchStage.city = city;

    const inventory = await Donation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { city: '$city', bloodType: '$bloodType' },
          units: { $sum: 1 },
          earliestExpiry: { $min: '$expiryDate' }
        }
      },
      {
        $project: {
          city: '$_id.city',
          bloodType: '$_id.bloodType',
          units: 1,
          earliestExpiry: 1,
          _id: 0
        }
      },
      { $sort: { city: 1, bloodType: 1 } }
    ]);

    res.status(200).json(inventory);
  } catch (err) {
    console.error('❌ Error fetching inventory:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
