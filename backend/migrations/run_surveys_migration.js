const db = require("../config/db");
const path = require("path");
const fs = require("fs");

const runMigration = async () => {
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, "create_surveys_tables.sql"),
      "utf8"
    );
    await db.query(sql);
    console.log("✅ Surveys migration completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
};

runMigration();
