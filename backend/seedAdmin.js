const bcrypt = require("bcrypt");
const db = require("./config/db");

async function seedAdmin() {
  try {
    const adminEmail = "admin@kisanseeva.com";
    const adminPassword = "Admin@123";

    const userExist = await db.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (userExist.rows.length > 0) {
      console.log("✅ Admin user already exists. No action needed.");
      return;
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    const insertQuery = `
      INSERT INTO users (name, email, password, phone, role, status) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING id, email, role, status
    `;
    const result = await db.query(insertQuery, [
      "System Admin",
      adminEmail,
      hashedPassword,
      "+910000000000",
      "admin",
      "active" // Admins are active by default
    ]);

    console.log("✅ Admin user created successfully:", result.rows[0]);
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
