const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function resetAdminPassword() {
  try {
    console.log('🔑 Resetting admin passwords...\n');

    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);

    // Update admin user
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [hash, 'admin@frauddetect.com']
    );
    console.log('✅ Updated admin@frauddetect.com password to: admin123');

    // Update analyst user  
    await pool.query(
      `UPDATE users SET password_hash = $1 WHERE email = $2`,
      [hash, 'analyst@frauddetect.com']
    );
    console.log('✅ Updated analyst@frauddetect.com password to: admin123');

    // Verify
    const result = await pool.query('SELECT email, role FROM users');
    console.log('\n📋 Current users:');
    result.rows.forEach(user => {
      console.log(`  - ${user.email} (${user.role})`);
    });

    console.log('\n✅ Password reset complete!');
    console.log('You can now login with:');
    console.log('  Email: admin@frauddetect.com');
    console.log('  Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

resetAdminPassword();