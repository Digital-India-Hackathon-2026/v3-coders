const db = require("../config/db");

// Get notifications for logged-in user
const getNotifications = async (req, res) => {
  try {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ notifications: result.rows });
  } catch (error) {
    console.error("Get Notifications Error:", error);
    res.status(500).json({ message: "Server error fetching notifications." });
  }
};

// Mark a specific notification as read
const markAsRead = async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      UPDATE notifications 
      SET is_read = true 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    const result = await db.query(query, [id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.json({ notification: result.rows[0] });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    res.status(500).json({ message: "Server error updating notification." });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const query = `
      UPDATE notifications 
      SET is_read = true 
      WHERE user_id = $1 AND is_read = false
      RETURNING *
    `;
    const result = await db.query(query, [req.user.id]);
    res.json({ updatedCount: result.rows.length });
  } catch (error) {
    console.error("Mark All Notifications Read Error:", error);
    res.status(500).json({ message: "Server error updating notifications." });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
