const express = require("express");
const router = express.Router();
const {
  getStats,
  getUsers,
  updateUserStatus,
  getAllBookings,
  getPendingUsers,
  approveUser,
  rejectUser,
  getPublicStats
} = require("../controllers/adminController");
const { verifyToken, checkRole } = require("../middleware/auth");

// Public route - no auth needed
router.get("/public-stats", getPublicStats);

// All admin routes require admin verification
router.get("/stats", verifyToken, checkRole(["admin"]), getStats);
router.get("/users", verifyToken, checkRole(["admin"]), getUsers);
router.put("/users/:id/status", verifyToken, checkRole(["admin"]), updateUserStatus);
router.get("/bookings", verifyToken, checkRole(["admin"]), getAllBookings);

// Pending users and approval flow
router.get("/pending-users", verifyToken, checkRole(["admin"]), getPendingUsers);
router.put("/users/:id/approve", verifyToken, checkRole(["admin"]), approveUser);
router.put("/users/:id/reject", verifyToken, checkRole(["admin"]), rejectUser);

module.exports = router;
