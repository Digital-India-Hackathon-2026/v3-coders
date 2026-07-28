// Run this script once to create the complaints table
const db = require("../config/db");
require("dotenv").config();

async function runMigration() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS complaints (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(100) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE SET NULL,
        status VARCHAR(30) DEFAULT 'open',
        priority VARCHAR(20) DEFAULT 'normal',
        admin_response TEXT,
        resolved_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log("✅ complaints table created (or already exists).");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    process.exit(0);
  }
}

runMigration();
