const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // log every route access

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
};
connectDB();

// Test route
app.get('/', (req, res) => {
  res.send('🩸 Blood Bank API is running');
});

// ✅ Load Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/donor', require('./routes/donorRoutes'));
app.use('/api/recipient', require('./routes/recipientRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
