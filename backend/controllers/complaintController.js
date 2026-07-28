const db = require("../config/db");

// User: Submit a new complaint
const createComplaint = async (req, res) => {
  const { category, subject, description, booking_id } = req.body;

  if (!category || !subject || !description) {
    return res.status(400).json({ message: "Category, subject, and description are required." });
  }
  if (description.trim().length < 20) {
    return res.status(400).json({ message: "Description must be at least 20 characters." });
  }

  try {
    // Verify booking belongs to user if provided
    if (booking_id) {
      const bookingCheck = await db.query(
        "SELECT id FROM bookings WHERE id = $1 AND (farmer_id = $2 OR service_id IN (SELECT id FROM services WHERE provider_id = $2))",
        [booking_id, req.user.id]
      );
      if (bookingCheck.rows.length === 0) {
        return res.status(403).json({ message: "Booking not found or does not belong to you." });
      }
    }

    const insertQuery = `
      INSERT INTO complaints (user_id, category, subject, description, booking_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(insertQuery, [
      req.user.id,
      category,
      subject.trim(),
      description.trim(),
      booking_id || null,
    ]);

    // Notify admin (if admin user exists)
    try {
      const adminRes = await db.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
      if (adminRes.rows.length > 0) {
        const notifMsg = `⚠️ New complaint #${result.rows[0].id} submitted by ${req.user.name} — Category: ${category}. Subject: "${subject.trim()}"`;
        await db.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [
          adminRes.rows[0].id,
          notifMsg,
        ]);
      }
    } catch (_) {
      // Don't fail the complaint if notification fails
    }

    res.status(201).json({
      message: "Your complaint has been submitted successfully. Our team will review it shortly.",
      complaint: result.rows[0],
    });
  } catch (error) {
    console.error("Create Complaint Error:", error);
    res.status(500).json({ message: "Server error submitting your complaint." });
  }
};

// User: Get their own complaints
const getMyComplaints = async (req, res) => {
  try {
    const query = `
      SELECT c.*, 
             b.id as booking_ref,
             s.name as service_name
      FROM complaints c
      LEFT JOIN bookings b ON c.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error("Get My Complaints Error:", error);
    res.status(500).json({ message: "Server error fetching your complaints." });
  }
};

// Admin: Get all complaints with filters
const getAllComplaints = async (req, res) => {
  const { status, category, priority } = req.query;

  try {
    let conditions = [];
    let params = [];

    if (status) {
      params.push(status);
      conditions.push(`c.status = $${params.length}`);
    }
    if (category) {
      params.push(category);
      conditions.push(`c.category = $${params.length}`);
    }
    if (priority) {
      params.push(priority);
      conditions.push(`c.priority = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT c.*, 
             u.name as user_name, u.email as user_email, u.phone as user_phone, u.role as user_role,
             b.id as booking_ref,
             s.name as service_name
      FROM complaints c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN bookings b ON c.booking_id = b.id
      LEFT JOIN services s ON b.service_id = s.id
      ${whereClause}
      ORDER BY 
        CASE c.priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'normal' THEN 3 WHEN 'low' THEN 4 END,
        c.created_at DESC
    `;
    const result = await db.query(query, params);
    res.json({ complaints: result.rows });
  } catch (error) {
    console.error("Get All Complaints Error:", error);
    res.status(500).json({ message: "Server error fetching complaints." });
  }
};

// Admin: Update complaint status and/or respond
const updateComplaint = async (req, res) => {
  const { id } = req.params;
  const { status, priority, admin_response } = req.body;

  const allowedStatuses = ["open", "in_review", "resolved", "closed"];
  const allowedPriorities = ["low", "normal", "high", "urgent"];

  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status value." });
  }
  if (priority && !allowedPriorities.includes(priority)) {
    return res.status(400).json({ message: "Invalid priority value." });
  }

  try {
    const existing = await db.query("SELECT * FROM complaints WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Complaint not found." });
    }

    const sets = ["updated_at = NOW()"];
    const params = [];

    if (status) {
      params.push(status);
      sets.push(`status = $${params.length}`);
      if (status === "resolved") {
        sets.push("resolved_at = NOW()");
      }
    }
    if (priority) {
      params.push(priority);
      sets.push(`priority = $${params.length}`);
    }
    if (admin_response !== undefined) {
      params.push(admin_response);
      sets.push(`admin_response = $${params.length}`);
    }

    params.push(id);
    const updateQuery = `UPDATE complaints SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`;
    const result = await db.query(updateQuery, params);

    // Notify user if admin responded or resolved
    const complaint = existing.rows[0];
    if (admin_response || status === "resolved" || status === "closed") {
      let notifMsg = "";
      if (status === "resolved") {
        notifMsg = `✅ Your complaint #${id} has been resolved by the admin.${admin_response ? ` Response: "${admin_response}"` : ""}`;
      } else if (status === "closed") {
        notifMsg = `🔒 Your complaint #${id} has been closed.`;
      } else if (admin_response) {
        notifMsg = `💬 Admin responded to your complaint #${id}: "${admin_response}"`;
      }
      if (notifMsg) {
        await db.query("INSERT INTO notifications (user_id, message) VALUES ($1, $2)", [
          complaint.user_id,
          notifMsg,
        ]);
      }
    }

    res.json({ message: "Complaint updated successfully.", complaint: result.rows[0] });
  } catch (error) {
    console.error("Update Complaint Error:", error);
    res.status(500).json({ message: "Server error updating complaint." });
  }
};

// Admin: Get complaint stats summary
const getComplaintStats = async (req, res) => {
  try {
    const statsRes = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open')::int AS open_count,
        COUNT(*) FILTER (WHERE status = 'in_review')::int AS in_review_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed')::int AS closed_count,
        COUNT(*) FILTER (WHERE priority = 'urgent')::int AS urgent_count,
        COUNT(*)::int AS total_count
      FROM complaints
    `);
    res.json({ stats: statsRes.rows[0] });
  } catch (error) {
    console.error("Get Complaint Stats Error:", error);
    res.status(500).json({ message: "Server error fetching complaint stats." });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint,
  getComplaintStats,
};
