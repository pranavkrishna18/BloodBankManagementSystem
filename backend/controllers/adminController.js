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
      const city = request.city || { $exists: true };
      const unitsRequested = request.units || 1;

      const availableUnits = await Donation.countDocuments({
        bloodType,
        city,
        status: 'Completed',
        isExpired: false
      });

      if (availableUnits < unitsRequested) {
        return res.status(400).json({ message: `Not enough units of ${bloodType} available. Requested: ${unitsRequested}, Available: ${availableUnits}` });
      }

      // ✅ Mark the requested number of units as 'Used'
      for (let i = 0; i < unitsRequested; i++) {
        const used = await Donation.findOneAndUpdate(
          {
            bloodType,
            city,
            status: 'Completed',
            isExpired: false,
            expiryDate: { $gt: new Date() }
          },
          { status: 'Used' }
        );

        if (!used) {
          return res.status(500).json({ message: `Error using ${bloodType} unit. Only ${i} of ${unitsRequested} units were marked as used.` });
        }
      }
    }

    request.status = status;
    await request.save();

    res.json({ message: `Request ${status} successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating request', error: err.message });
  }
};

// ✅ Get Inventory (Admin Only) - City-aware
const getInventory = async (req, res) => {
  try {
    const { city } = req.query; // optional filter
    const matchStage = {
      status: 'Completed',
      adminApproved: true,  // 🆕 Only count approved donations
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

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Public Inventory - City-aware
const getPublicInventory = async (req, res) => {
  try {
    const { city } = req.query;
    const matchStage = {
      status: 'Completed',
      adminApproved: true,  // 🆕 Only show approved donations publicly
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

    res.json(inventory);
  } catch (err) {
    res.status(500).json({ message: 'Public inventory error', error: err.message });
  }
};

// ✅ Seed Inventory
const seedInventoryUnits = async (req, res) => {
  try {
    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Vijayawada'];
    const dummyDonorId = req.user._id;
    const hospital = 'Central Hospital';
    const donations = [];

    // For each city, for each blood type, insert random 3-20 units
    // with expiry dates randomly between 5 and 42 days from now
    for (let city of cities) {
      for (let blood of bloodTypes) {
        const units = Math.floor(Math.random() * 18) + 3; // 3-20 units
        for (let i = 0; i < units; i++) {
          const daysUntilExpiry = Math.floor(Math.random() * 38) + 5; // 5-42 days
          const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
          donations.push({
            donor: dummyDonorId,
            bloodType: blood,
            location: hospital,
            city: city,
            status: 'Completed',
            adminApproved: true,
            date: new Date(),
            expiryDate: expiryDate,
            isExpired: false
          });
        }
      }
    }

    await Donation.insertMany(donations);
    res.json({ message: `🧪 ${donations.length} dummy donations seeded across ${cities.length} cities.`, count: donations.length });
  } catch (err) {
    res.status(500).json({ message: 'Seeding error', error: err.message });
  }
};

// ✅ Get List of Cities
const getCities = async (req, res) => {
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai',
    'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad',
    'Jaipur', 'Vijayawada'
  ];
  res.json(cities);
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

// ✅ Get All Pending Donations (Admin View)
const getPendingDonations = async (req, res) => {
  try {
    const donations = await Donation.find({ status: 'Scheduled', adminApproved: false })
      .populate('donor', 'name email city')
      .sort({ date: -1 });
    
    res.json(donations);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ✅ Approve/Reject Pending Donation
const approveDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Action must be 'approve' or 'reject'" });
    }

    const donation = await Donation.findById(id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (donation.status !== 'Scheduled') {
      return res.status(400).json({ message: 'Only scheduled donations can be approved/rejected' });
    }

    if (action === 'approve') {
      donation.status = 'Completed';
      donation.adminApproved = true;
    } else {
      donation.status = 'Cancelled';
    }

    await donation.save();
    res.json({ message: `Donation ${action}ed successfully` });
  } catch (err) {
    res.status(500).json({ message: 'Error updating donation', error: err.message });
  }
};

// ✅ Export Controllers
module.exports = {
  getAllRequests,
  updateRequestStatus,
  getInventory,
  getPublicInventory,
  seedInventoryUnits,
  getAdminAnalytics,
  getCities,
  getPendingDonations,
  approveDonation
};
