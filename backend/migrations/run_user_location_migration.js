const db = require('../config/db');
require('dotenv').config();
async function run() {
  await db.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS lat NUMERIC(10,7);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS lng NUMERIC(10,7);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address_city VARCHAR(100);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS address_state VARCHAR(100);
  `);
  console.log('✅ User location columns added.');
  process.exit(0);
}
run().catch(e => { console.error(e); process.exit(1); });
