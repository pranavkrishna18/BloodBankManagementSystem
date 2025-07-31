const Donation = require('../models/Donation');

// ✅ Record New Donation
exports.donateBlood = async (req, res) => {
  try {
    const { bloodType, location, date } = req.body;

    if (!bloodType || !location || !date) {
      return res.status(400).json({ message: 'Blood type, location, and date are required' });
    }

    const donationDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today's date

    if (donationDate < today) {
      return res.status(400).json({ message: 'Donation date cannot be in the past' });
    }

    const donorId = req.user._id;

    const donation = new Donation({
      donor: donorId,
      bloodType,
      location,
      date: donationDate,
      status: 'Completed' // 🆕 Optional: mark immediately as completed
    });

    await donation.save();

    res.status(201).json({ message: '🩸 Donation recorded successfully' });
  } catch (error) {
    console.error("Donation error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get Donation History
exports.getDonationHistory = async (req, res) => {
  try {
    const donorId = req.user._id;
    const donations = await Donation.find({ donor: donorId }).sort({ date: -1 });

    res.status(200).json(donations);
  } catch (error) {
    console.error("History fetch error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ✅ Get Eligibility Countdown
exports.getEligibilityCountdown = async (req, res) => {
  try {
    const donorId = req.user._id;

    // 🩸 Find last completed donation
    const lastDonation = await Donation.findOne({
      donor: donorId,
      status: 'Completed'
    }).sort({ date: -1 });

    if (!lastDonation) {
      return res.json({
        message: 'You have not donated yet.',
        eligible: true,
        nextEligibleDate: null,
        daysRemaining: 0
      });
    }

    const lastDate = new Date(lastDonation.date);
    const nextEligibleDate = new Date(lastDate);
    nextEligibleDate.setDate(nextEligibleDate.getDate() + 90);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const timeDiff = nextEligibleDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    res.json({
      eligible: daysRemaining <= 0,
      nextEligibleDate,
      daysRemaining: Math.max(daysRemaining, 0)
    });

  } catch (error) {
    console.error("Eligibility countdown error:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
