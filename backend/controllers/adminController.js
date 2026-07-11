const db = require("../config/db");

// Get platform stats
const getStats = async (req, res) => {
  try {
    // 1. Total Farmers Count
    const farmersCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'farmer'");
    
    // 2. Total Providers Count
    const providersCountRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'provider'");
    
    // 3. Total Bookings Count
    const bookingsCountRes = await db.query("SELECT COUNT(*) FROM bookings");
    
    // 4. Total Revenue (sum of completed bookings total_price)
    const revenueRes = await db.query("SELECT SUM(total_price) FROM bookings WHERE status = 'completed'");
    const revenue = revenueRes.rows[0].sum ? parseFloat(revenueRes.rows[0].sum) : 0;

    // 5. Recent bookings listing (limit 5)
    const recentBookingsRes = await db.query(`
      SELECT b.*, f.name as farmer_name, s.name as service_name 
      FROM bookings b
      JOIN users f ON b.farmer_id = f.id
      JOIN services s ON b.service_id = s.id
      ORDER BY b.created_at DESC 
      LIMIT 5
    `);

    res.json({
      stats: {
        totalFarmers: parseInt(farmersCountRes.rows[0].count, 10),
        totalProviders: parseInt(providersCountRes.rows[0].count, 10),
        totalBookings: parseInt(bookingsCountRes.rows[0].count, 10),
        totalRevenue: revenue
      },
      recentBookings: recentBookingsRes.rows
    });

  } catch (error) {
    console.error("Get Admin Stats Error:", error);
    res.status(500).json({ message: "Server error fetching admin statistics." });
  }
};

// Get all users (farmers or providers)
const getUsers = async (req, res) => {
  const { role } = req.query; // 'farmer' or 'provider' or undefined

  try {
    let query = "SELECT id, name, email, phone, role, extra_info, status, created_at FROM users";
    const params = [];

    if (role === "farmer" || role === "provider") {
      query += " WHERE role = $1 AND status != 'pending'";
      params.push(role);
    } else {
      // Exclude admins and pending users from standard user tables
      query += " WHERE role != 'admin' AND status != 'pending'";
    }

    query += " ORDER BY created_at DESC";

    const result = await db.query(query, params);
    res.json({ users: result.rows });

  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error fetching users list." });
  }
};

// Suspend/Reactivate user (Farmer or Provider)
const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'active' or 'suspended'

  if (status !== "active" && status !== "suspended") {
    return res.status(400).json({ message: "Status must be 'active' or 'suspended'." });
  }

  try {
    // Prevent suspending self
    if (parseInt(id, 10) === req.user.id) {
      return res.status(400).json({ message: "You cannot suspend your own admin account." });
    }

    const checkUser = await db.query("SELECT * FROM users WHERE id = $1", [id]);
    if (checkUser.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    if (checkUser.rows[0].role === "admin") {
      return res.status(403).json({ message: "Admins cannot modify status of other admin accounts." });
    }

    const updateQuery = "UPDATE users SET status = $1 WHERE id = $2 RETURNING id, name, email, role, status";
    const result = await db.query(updateQuery, [status, id]);

    res.json({
      message: `User account has been successfully ${status === "suspended" ? "suspended" : "activated"}.`,
      user: result.rows[0]
    });

  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({ message: "Server error modifying user account status." });
  }
};

// List all platform bookings
const getAllBookings = async (req, res) => {
  try {
    const query = `
      SELECT b.*, 
             f.name as farmer_name, f.email as farmer_email, f.phone as farmer_phone,
             s.name as service_name, s.type as service_type,
             p.name as provider_name, p.email as provider_email, p.phone as provider_phone
      FROM bookings b
      JOIN users f ON b.farmer_id = f.id
      JOIN services s ON b.service_id = s.id
      JOIN users p ON s.provider_id = p.id
      ORDER BY b.booking_date DESC, b.created_at DESC
    `;
    const result = await db.query(query);
    res.json({ bookings: result.rows });
  } catch (error) {
    console.error("Get All Bookings Error:", error);
    res.status(500).json({ message: "Server error fetching all platform bookings." });
  }
};

// Get pending users for approval
const getPendingUsers = async (req, res) => {
  try {
    const query = "SELECT id, name, email, phone, role, extra_info, status, documents, created_at FROM users WHERE status = 'pending' ORDER BY created_at ASC";
    const result = await db.query(query);
    res.json({ users: result.rows });
  } catch (error) {
    console.error("Get Pending Users Error:", error);
    res.status(500).json({ message: "Server error fetching pending users." });
  }
};

// Approve user
const approveUser = async (req, res) => {
  const { id } = req.params;
  try {
    const updateQuery = "UPDATE users SET status = 'active' WHERE id = $1 RETURNING id, name, email, role, status";
    const result = await db.query(updateQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    // Optional: add a notification for the user
    await db.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [id, "Your account has been approved by the admin. You can now login!"]);

    res.json({ message: "User approved successfully.", user: result.rows[0] });
  } catch (error) {
    console.error("Approve User Error:", error);
    res.status(500).json({ message: "Server error approving user." });
  }
};

// Reject user
const rejectUser = async (req, res) => {
  const { id } = req.params;
  try {
    // We can either delete the user or set status to rejected
    const updateQuery = "UPDATE users SET status = 'rejected' WHERE id = $1 RETURNING id, name, email, role, status";
    const result = await db.query(updateQuery, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: "User rejected successfully.", user: result.rows[0] });
  } catch (error) {
    console.error("Reject User Error:", error);
    res.status(500).json({ message: "Server error rejecting user." });
  }
};

// Get public stats for the landing page (no auth required)
const getPublicStats = async (req, res) => {
  try {
    const farmersRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'farmer' AND status = 'active'");
    const providersRes = await db.query("SELECT COUNT(*) FROM users WHERE role = 'provider' AND status = 'active'");
    const bookingsRes = await db.query("SELECT COUNT(*) FROM bookings");
    const completedRes = await db.query("SELECT COUNT(*) FROM bookings WHERE status = 'completed'");

    res.json({
      farmers: parseInt(farmersRes.rows[0].count, 10),
      providers: parseInt(providersRes.rows[0].count, 10),
      bookings: parseInt(bookingsRes.rows[0].count, 10),
      completed: parseInt(completedRes.rows[0].count, 10),
    });
  } catch (error) {
    console.error("Get Public Stats Error:", error);
    res.status(500).json({ message: "Server error fetching public stats." });
  }
};

module.exports = {
  getStats,
  getUsers,
  updateUserStatus,
  getAllBookings,
  getPendingUsers,
  approveUser,
  rejectUser,
  getPublicStats
};
