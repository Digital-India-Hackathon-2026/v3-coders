const db = require("../config/db");
const path = require("path");
const fs = require("fs");

const runMigration = async () => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "add_payments_columns.sql"),
      "utf8"
    );
    await db.query(sql);
    console.log("✅ Payments migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Payments migration failed:", error);
    process.exit(1);
  }
};

runMigration();
