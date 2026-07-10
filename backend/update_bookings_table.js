const db = require("./config/db");

async function addLocationColumns() {
  try {
    console.log("Adding location columns to bookings table...");
    await db.query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS farm_lat NUMERIC(10, 7),
      ADD COLUMN IF NOT EXISTS farm_lng NUMERIC(10, 7),
      ADD COLUMN IF NOT EXISTS provider_lat NUMERIC(10, 7),
      ADD COLUMN IF NOT EXISTS provider_lng NUMERIC(10, 7)
    `);
    console.log("Columns added successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error adding columns:", error);
    process.exit(1);
  }
}

addLocationColumns();
