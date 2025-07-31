const Request = require('../models/Request');
const Donation = require('../models/Donation');
const User = require('../models/User');

// ✅ Get All Requests
const getAllRequests = async (req, res) => {
  try {
    const { status, bloodType } = req.query;

    let query = {};
    if (status) query.status = status;
    else query.status = 'pending';

    if (bloodType) query.bloodType = bloodType;

    const requests = await Request.find(query).sort({ date: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// ✅ Update Request Status
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be updated' });
    }

    if (status === 'approved') {
      const bloodType = request.bloodType;

      const availableUnits = await Donation.countDocuments({
        bloodType,
        status: 'Completed'
      });

      if (availableUnits < 1) {
        return res.status(400).json({ message: `Not enough units of ${bloodType} available.` });
      }

      const used = await Donation.findOneAndDelete({
        bloodType,
        status: 'Completed'
      });

      if (!used) {
        return res.status(500).json({ message: `Error using ${bloodType} unit.` });
      }
    }

    request.status = status;
    await request.save();

    res.json({ message: `Request ${status} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating request', error: err.message });
  }
};

// ✅ Get Inventory (Admin Only)
const getInventory = async (req, res) => {
  try {
    const inventory = await Donation.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } },
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

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Public Inventory
const getPublicInventory = async (req, res) => {
  try {
    const inventory = await Donation.aggregate([
      { $match: { status: 'Completed' } },
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

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: 'Public inventory error', error: err.message });
  }
};

// ✅ Seed Inventory
const seedInventoryUnits = async (req, res) => {
  try {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const dummyDonorId = req.user._id;
    const hospital = 'Central Hospital';
    const donations = [];

    for (let i = 0; i < 50; i++) {
      const randomBlood = bloodTypes[Math.floor(Math.random() * bloodTypes.length)];
      donations.push({
        donor: dummyDonorId,
        bloodType: randomBlood,
        location: hospital,
        status: 'Completed',
        date: new Date()
      });
    }

    await Donation.insertMany(donations);
    res.json({ message: '🧪 50 dummy donations inserted successfully.', count: donations.length });
  } catch (err) {
    res.status(500).json({ message: 'Seeding error', error: err.message });
  }
};

// 📊 Admin Analytics (FIXED FORMAT)
const getAdminAnalytics = async (req, res) => {
  try {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 6);

    const donations = await Donation.aggregate([
      {
        $match: {
          status: 'Completed',
          date: { $gte: last7Days }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const donationTrends = {
      labels: donations.map(d => d._id),
      data: donations.map(d => d.count)
    };

    const bloodGroups = await Request.aggregate([
      {
        $group: {
          _id: '$bloodType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const topBloodGroups = {
      labels: bloodGroups.map(b => b._id),
      data: bloodGroups.map(b => b.count)
    };

    const donors = await User.aggregate([
      { $match: { role: 'donor' } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      }
    ]);

    const recipients = await User.aggregate([
      { $match: { role: 'recipient' } },
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 }
        }
      }
    ]);

    const locationMap = {};

    donors.forEach(d => {
      const loc = d._id || 'Unknown';
      locationMap[loc] = (locationMap[loc] || 0) + d.count;
    });

    recipients.forEach(r => {
      const loc = r._id || 'Unknown';
      locationMap[loc] = (locationMap[loc] || 0) + r.count;
    });

    const locationStats = {
      labels: Object.keys(locationMap),
      data: Object.values(locationMap)
    };

    res.json({ weeklyDonations: donationTrends, topBloodGroups, locationStats });
  } catch (err) {
    console.error('📊 Analytics Error:', err);
    res.status(500).json({ message: 'Analytics server error', error: err.message });
  }
};

// ✅ Export Controllers
module.exports = {
  getAllRequests,
  updateRequestStatus,
  getInventory,
  getPublicInventory,
  seedInventoryUnits,
  getAdminAnalytics
};
