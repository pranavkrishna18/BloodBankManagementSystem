const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Middleware to protect private routes
const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Use correct key from JWT payload
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err.message);
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

// 🔐 Middleware to restrict to admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admins only' });
};
// ✅ Middleware to check if user is recipient
const isRecipient = (req, res, next) => {
  if (req.user && req.user.role === 'recipient') {
    next();
  } else {
    res.status(403).json({ message: 'Recipient access denied' });
  }
};

// ✅ Middleware to check if user is donor (optional if needed)
const isDonor = (req, res, next) => {
  if (req.user && req.user.role === 'donor') {
    next();
  } else {
    res.status(403).json({ message: 'Donor access denied' });
  }
};

module.exports = {
  protect,
  isAdmin,
  isRecipient,
  isDonor
};


