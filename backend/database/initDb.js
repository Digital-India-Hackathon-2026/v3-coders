const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { pool } = require("../config/db");

async function initDb() {
  console.log("Initializing database schema...");
  try {
    const schemaSqlPath = path.join(__dirname, "schema.sql");
    const schemaSql = fs.readFileSync(schemaSqlPath, "utf8");
    
    // Execute DDL schema
    await pool.query(schemaSql);
    console.log("Database schema successfully created or verified.");

    // Check if we need to seed
    const userCountResult = await pool.query("SELECT COUNT(*) FROM users");
    const count = parseInt(userCountResult.rows[0].count, 10);
    
    if (count === 0) {
      console.log("Seeding initial database values...");
      
      const adminPass = await bcrypt.hash("admin123", 10);
      const farmerPass = await bcrypt.hash("farmer123", 10);
      const providerPass = await bcrypt.hash("provider123", 10);

      // Seed Users
      const usersQuery = `
        INSERT INTO users (name, email, password, phone, role, extra_info) VALUES 
        ($1, $2, $3, $4, $5, $6),
        ($7, $8, $9, $10, $11, $12),
        ($13, $14, $15, $16, $17, $18),
        ($19, $20, $21, $22, $23, $24),
        ($25, $26, $27, $28, $29, $30)
        RETURNING id, name, role;
      `;
      const usersValues = [
        // Admin
        "System Admin", "admin@kisan.com", adminPass, "+91 99999 99999", "admin", "Primary KisanSeeva system manager",
        // Farmers
        "Ramesh Kumar", "farmer@kisan.com", farmerPass, "+91 98765 43210", "farmer", "5 acres, Paddy and Cotton, Guntur district",
        "Suresh Patel", "suresh@kisan.com", farmerPass, "+91 98765 43211", "farmer", "10 acres, Wheat, Indore division",
        // Providers
        "Balaji Agri Services", "provider@kisan.com", providerPass, "+91 87654 32109", "provider", "John Deere 5050D Tractors and Mahindra Harvesters available. 24/7 service.",
        "Srinivas Equipment", "srinivas@kisan.com", providerPass, "+91 87654 32108", "provider", "Specialized in seeders, rotavators, and micro-irrigation set-ups."
      ];
      
      const usersRes = await pool.query(usersQuery, usersValues);
      console.log("Users seeded successfully.");

      // Find the ID of the providers and farmers
      const ramesh = usersRes.rows.find(u => u.name === "Ramesh Kumar");
      const balaji = usersRes.rows.find(u => u.name === "Balaji Agri Services");
      const srinivas = usersRes.rows.find(u => u.name === "Srinivas Equipment");

      if (balaji && srinivas) {
        // Seed Services
        const servicesQuery = `
          INSERT INTO services (provider_id, name, type, price_per_hour, description, status) VALUES
          ($1, $2, $3, $4, $5, $6),
          ($7, $8, $9, $10, $11, $12),
          ($13, $14, $15, $16, $17, $18)
          RETURNING id, name;
        `;
        const servicesValues = [
          balaji.id, "Paddy Harvesting", "Harvester", 1500.00, "High capacity harvester for wet & dry paddy fields. Includes skilled driver and fuel.", "available",
          balaji.id, "Tractor Tilling", "Tractor", 800.00, "Heavy duty tilling with rotavator attachment. Suitable for hard clay soil.", "available",
          srinivas.id, "Automatic Seeding", "Seeder", 600.00, "Pneumatic seed planter for precise row spacing. Seeds maize, cotton, and pulses.", "available"
        ];
        
        const servicesRes = await pool.query(servicesQuery, servicesValues);
        console.log("Services seeded successfully.");

        // Seed some bookings
        const paddyHarvesting = servicesRes.rows.find(s => s.name === "Paddy Harvesting");
        const tractorTilling = servicesRes.rows.find(s => s.name === "Tractor Tilling");

        if (ramesh && paddyHarvesting && tractorTilling) {
          const bookingsQuery = `
            INSERT INTO bookings (farmer_id, service_id, booking_date, hours_required, total_price, status, location, rating, feedback) VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9),
            ($10, $11, $12, $13, $14, $15, $16, $17, $18)
          `;
          const bookingsValues = [
            ramesh.id, paddyHarvesting.id, "2026-07-12", 5.0, 7500.00, "pending", "Plot 42, Guntur Main Road, AP", null, null,
            ramesh.id, tractorTilling.id, "2026-07-08", 4.0, 3200.00, "completed", "Plot 42, Guntur Main Road, AP", 5, "Excellent tilling quality. The operator was very professional."
          ];

          await pool.query(bookingsQuery, bookingsValues);
          console.log("Bookings seeded successfully.");
        }
      }
    } else {
      console.log("Database already has records. Seeding skipped.");
    }
  } catch (error) {
    console.error("Error during database initialization:", error);
  } finally {
    await pool.end();
    console.log("Pool connection closed.");
  }
}

initDb();
