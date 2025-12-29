// Diagnostic script to check admin login setup
require('dotenv').config();
const db = require('./src/config/db');
const User = require('./src/models/userModel');
const bcrypt = require('bcryptjs');

async function checkAdminLogin() {
  console.log('=== ADMIN LOGIN DIAGNOSTIC ===\n');
  
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
    process.exit(1);
  }
  
  // Check for admin users
  try {
    const [adminUsers] = await db.execute(
      'SELECT id, email, role, company_id FROM users WHERE role = ?',
      ['admin']
    );
    
    console.log(`\n✅ Found ${adminUsers.length} admin user(s) in database`);
    if (adminUsers.length > 0) {
      console.log('   Admin users:');
      adminUsers.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, Company ID: ${user.company_id || 'NULL'})`);
      });
    } else {
      console.log('   ⚠️  No admin users found!');
      console.log('   You need to create an admin user.');
      console.log('   You can:');
      console.log('   1. Use the User Management page (if you have another admin)');
      console.log('   2. Create one directly in the database');
      console.log('   3. Run: node backend/src/createAdmin.js');
    }
    
    // Test password for first admin
    if (adminUsers.length > 0) {
      const firstAdmin = adminUsers[0];
      const [userWithPassword] = await db.execute(
        'SELECT id, email, password, role FROM users WHERE id = ?',
        [firstAdmin.id]
      );
      
      if (userWithPassword[0] && userWithPassword[0].password) {
        console.log(`\n✅ Admin user ${firstAdmin.email} has a password set`);
        console.log(`   Password hash length: ${userWithPassword[0].password.length} characters`);
      } else {
        console.log(`\n❌ Admin user ${firstAdmin.email} has NO password set!`);
        console.log('   This user cannot login. Set a password using the User Management page.');
      }
    }
  } catch (error) {
    console.log('❌ Error checking admin users:', error.message);
  }
  
  console.log('\n=== END DIAGNOSTIC ===');
  process.exit(0);
}

checkAdminLogin();

