// Quick diagnostic script to check login setup
require('dotenv').config();
const db = require('./src/config/db');
const User = require('./src/models/userModel');

async function checkLoginSetup() {
  console.log('=== Login Setup Diagnostic ===\n');
  
  // Check JWT_SECRET
  if (process.env.JWT_SECRET) {
    console.log('✅ JWT_SECRET is configured');
  } else {
    console.log('❌ JWT_SECRET is NOT configured - this will cause login to fail!');
    console.log('   Set JWT_SECRET in your .env file');
  }
  
  // Check database connection
  try {
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection working');
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
  
  // Check if any users exist
  try {
    const users = await User.findAll();
    console.log(`✅ Found ${users.length} user(s) in database`);
    if (users.length > 0) {
      console.log('   Sample users:');
      users.slice(0, 3).forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    } else {
      console.log('   ⚠️  No users found - you need to create a user first');
    }
  } catch (error) {
    console.log('❌ Error checking users:', error.message);
  }
  
  console.log('\n=== End Diagnostic ===');
  process.exit(0);
}

checkLoginSetup();

