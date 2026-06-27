require('dotenv').config();
const mongoose = require('mongoose');
const Donation = require('./models/Donation');

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check total donations
    const total = await Donation.countDocuments();
    console.log('📦 Total donations:', total);
    
    // Check donations by city
    const byCity = await Donation.aggregate([
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    console.log('\n🏙️ Donations by city:');
    byCity.forEach(row => console.log(`  ${row._id}: ${row.count}`));
    
    // Check for Delhi specifically with all filters
    const delhiFiltered = await Donation.countDocuments({ 
      city: 'Delhi',
      status: 'Completed',
      adminApproved: true,
      isExpired: false,
      expiryDate: { $gt: new Date() }
    });
    console.log(`\n🔍 Delhi donations (with filters): ${delhiFiltered}`);
    
    // Check a sample Delhi donation
    const sample = await Donation.findOne({ city: 'Delhi' });
    if (sample) {
      console.log('\n📄 Sample Delhi donation:');
      console.log(`  City: ${sample.city}`);
      console.log(`  Blood Type: ${sample.bloodType}`);
      console.log(`  Status: ${sample.status}`);
      console.log(`  Admin Approved: ${sample.adminApproved}`);
      console.log(`  Is Expired: ${sample.isExpired}`);
      console.log(`  Expiry Date: ${sample.expiryDate}`);
      console.log(`  Current Time: ${new Date()}`);
    } else {
      console.log('\n📄 No Delhi donations found!');
    }
    
    // Test the aggregation query that the backend uses
    const aggregated = await Donation.aggregate([
      { 
        $match: {
          status: 'Completed',
          adminApproved: true,
          isExpired: false,
          expiryDate: { $gt: new Date() },
          city: 'Delhi'
        }
      },
      {
        $group: {
          _id: { city: '$city', bloodType: '$bloodType' },
          units: { $sum: 1 },
          earliestExpiry: { $min: '$expiryDate' }
        }
      },
      { $sort: { '_id.bloodType': 1 } }
    ]);
    
    console.log(`\n📊 Aggregation result for Delhi:`);
    if (aggregated.length === 0) {
      console.log('  ❌ EMPTY RESULT!');
    } else {
      aggregated.forEach(item => {
        console.log(`  ${item._id.bloodType}: ${item.units} units`);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
