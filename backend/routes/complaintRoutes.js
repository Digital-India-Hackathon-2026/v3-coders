const express = require("express");
const router = express.Router();
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  updateComplaint,
  getComplaintStats,
} = require("../controllers/complaintController");
const { verifyToken, checkRole } = require("../middleware/auth");

// User routes (farmer + provider)
router.post("/", verifyToken, checkRole(["farmer", "provider"]), createComplaint);
router.get("/my", verifyToken, checkRole(["farmer", "provider"]), getMyComplaints);

// Admin routes
router.get("/", verifyToken, checkRole(["admin"]), getAllComplaints);
router.get("/stats", verifyToken, checkRole(["admin"]), getComplaintStats);
router.put("/:id", verifyToken, checkRole(["admin"]), updateComplaint);

module.exports = router;
