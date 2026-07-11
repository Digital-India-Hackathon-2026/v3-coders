const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool(
  process.env.DB_URL
    ? {
        connectionString: process.env.DB_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
);

async function run() {
  const client = await pool.connect();
  try {
    // Check if table exists
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    const exists = checkResult.rows[0].exists;
    console.log("notifications table exists:", exists);

    if (!exists) {
      console.log("Creating notifications table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log("✅ notifications table created successfully!");
    } else {
      console.log("✅ Table already exists. No action needed.");
      const count = await client.query("SELECT COUNT(*) FROM notifications;");
      console.log("   Row count:", count.rows[0].count);
    }
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
