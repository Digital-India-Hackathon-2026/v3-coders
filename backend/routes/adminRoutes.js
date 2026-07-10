const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUserStatus,
  getAllBookings
} = require("../controllers/adminController");
const { verifyToken, checkRole } = require("../middleware/auth");

// All admin routes require admin verification
router.get("/stats", verifyToken, checkRole(["admin"]), getStats);
router.get("/users", verifyToken, checkRole(["admin"]), getUsers);
router.put("/users/:id/status", verifyToken, checkRole(["admin"]), updateUserStatus);
router.get("/bookings", verifyToken, checkRole(["admin"]), getAllBookings);

module.exports = router;
