// ✅ recipientController.js
const Request = require('../models/Request');

// 🩸 Submit a blood request
const requestBlood = async (req, res) => {
  try {
    const { bloodType, location, city, urgency, units, notes } = req.body;
    const recipientId = req.user._id;

    if (!bloodType || !location || !city) {
      return res.status(400).json({ message: 'Blood type, location, and city are required' });
    }

    const newRequest = new Request({
      recipient: recipientId,
      bloodType,
      location,
      city,
      urgency: urgency || 'medium',
      units: units || 1,
      notes: notes || '',
      date: new Date()
    });

    await newRequest.save();

    res.status(201).json({ message: '✅ Blood request submitted successfully' });
  } catch (error) {
    console.error('❌ Request creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// 📜 Get request history
const getRequestHistory = async (req, res) => {
  try {
    const recipientId = req.user._id;

    const requests = await Request.find({ recipient: recipientId }).sort({ date: -1 });

    res.status(200).json(requests);
  } catch (error) {
    console.error('❌ Error fetching request history:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Grouped approved requests by blood type
const getApprovedRequestsGrouped = async (req, res) => {
  try {
    const userId = req.user._id;

    const requests = await Request.aggregate([
      {
        $match: {
          recipient: userId,
          status: 'approved',
        },
      },
      {
        $group: {
          _id: '$bloodType',
          requests: {
            $push: {
              date: '$date',
              location: '$location',
              _id: '$_id',
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(requests);
  } catch (err) {
    console.error('❌ Error grouping approved requests:', err);
    res.status(500).json({
      message: 'Failed to fetch approved requests',
      error: err.message,
    });
  }
};

// ✅ Export all controllers
module.exports = {
  requestBlood,
  getRequestHistory,
  getApprovedRequestsGrouped,
};
