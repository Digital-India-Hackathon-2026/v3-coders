const db = require("../config/db");

async function migrate() {
  try {
    console.log("Adding columns to users table...");
    
    // Add columns if they don't exist
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '{}',
      ADD COLUMN IF NOT EXISTS reset_password_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS reset_password_expires TIMESTAMP;
    `);

    // Alter default status to 'pending' (this affects new records, not existing ones)
    await db.query(`
      ALTER TABLE users 
      ALTER COLUMN status SET DEFAULT 'pending';
    `);

    console.log("✅ Successfully updated users table schema.");
  } catch (err) {
    console.error("❌ Error updating schema:", err);
  } finally {
    process.exit(0);
  }
}

migrate();
