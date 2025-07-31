// ✅ recipientController.js
const Request = require('../models/Request');

// 🩸 Submit a blood request
const requestBlood = async (req, res) => {
  try {
    const { bloodType, location, date } = req.body;
    const recipientId = req.user._id;

    if (!bloodType || !location || !date) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // normalize

    if (selectedDate < today) {
      return res.status(400).json({ message: 'Date cannot be in the past' });
    }

    const newRequest = new Request({
      recipient: recipientId,
      bloodType,
      location,
      date: selectedDate,
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
