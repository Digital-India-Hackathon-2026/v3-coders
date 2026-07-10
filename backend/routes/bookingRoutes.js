const express = require("express");
const router = express.Router();
const {
  createBooking,
  getFarmerBookings,
  getProviderBookings,
  updateBookingStatus,
  rateBooking,
  updateProviderLocation,
  getBookingLocation
} = require("../controllers/bookingController");
const { verifyToken, checkRole } = require("../middleware/auth");

router.post("/", verifyToken, checkRole(["farmer"]), createBooking);
router.get("/farmer", verifyToken, checkRole(["farmer"]), getFarmerBookings);
router.get("/provider", verifyToken, checkRole(["provider"]), getProviderBookings);
router.put("/:id/status", verifyToken, updateBookingStatus);
router.put("/:id/rate", verifyToken, checkRole(["farmer"]), rateBooking);
router.put("/:id/location", verifyToken, checkRole(["provider"]), updateProviderLocation);
router.get("/:id/location", verifyToken, getBookingLocation);

module.exports = router;
