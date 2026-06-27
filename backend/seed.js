// Standalone script to seed initial blood inventory data
require('dotenv').config();
const mongoose = require('mongoose');
const Donation = require('./models/Donation');
const User = require('./models/User');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing donations (to remove old data without city field)
    await Donation.deleteMany({});
    console.log('🗑️ Cleared existing donations');

    // Get or create a dummy donor user for seeding
    let dummyDonor = await User.findOne({ email: 'seed@demo.com' });
    if (!dummyDonor) {
      dummyDonor = await User.create({
        name: 'System Seed',
        email: 'seed@demo.com',
        password: 'hashed', // Not used for seeding
        role: 'donor',
        city: 'Vijayawada'
      });
      console.log('✅ Created dummy donor for seeding');
    }

    const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Vijayawada'];
    const hospital = 'Central Blood Bank';
    const donations = [];

    // For each city, for each blood type, create 8-15 units with random expiry
    for (let city of cities) {
      for (let blood of bloodTypes) {
        const units = Math.floor(Math.random() * 8) + 8; // 8-15 units per blood type per city
        for (let i = 0; i < units; i++) {
          const daysUntilExpiry = Math.floor(Math.random() * 35) + 7; // 7-42 days (good distribution)
          const expiryDate = new Date(Date.now() + daysUntilExpiry * 24 * 60 * 60 * 1000);
          
          donations.push({
            donor: dummyDonor._id,
            bloodType: blood,
            location: hospital,
            city: city,
            status: 'Completed',
            adminApproved: true,
            date: new Date(),
            expiryDate: expiryDate,
            isExpired: false,
            donorSnapshot: {
              name: dummyDonor.name,
              email: dummyDonor.email,
              city: dummyDonor.city,
              bloodType: blood
            }
          });
        }
      }
    }

    await Donation.insertMany(donations);
    
    console.log('\n✅ Database seeding complete!');
    console.log(`📦 Total units seeded: ${donations.length}`);
    console.log(`🏙️ Cities: ${cities.length}`);
    console.log(`🩸 Blood types: ${bloodTypes.length}`);
    console.log(`📊 Average units per city: ${Math.floor(donations.length / cities.length)} units`);
    console.log(`💾 Sample data by city:`);
    
    // Show summary
    for (let city of cities) {
      const cityCount = donations.filter(d => d.city === city).length;
      console.log(`   ${city}: ${cityCount} units`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding error:', err.message);
    process.exit(1);
  }
};

seedDatabase();
