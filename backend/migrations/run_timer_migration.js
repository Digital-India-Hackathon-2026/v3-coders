const db = require("../config/db");
require("dotenv").config();

async function runMigration() {
  try {
    // Add pricing_model column to services
    await db.query(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_model VARCHAR(30) DEFAULT 'hourly';
    `);

    // Add timer tracking columns to bookings
    await db.query(`
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stop_time TIMESTAMP;
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_hours NUMERIC(10,2);
      ALTER TABLE bookings ADD COLUMN IF NOT EXISTS timer_status VARCHAR(20) DEFAULT 'idle';
    `);

    console.log("✅ Pricing model and Job Timer columns successfully added to database.");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit(0);
  }
}

runMigration();
