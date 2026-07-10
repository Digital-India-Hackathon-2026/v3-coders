const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");
const notificationController = require("../controllers/notificationController");

// Get user notifications
router.get("/", verifyToken, notificationController.getNotifications);

// Mark notification as read
router.put("/:id/read", verifyToken, notificationController.markAsRead);

// Mark all as read
router.put("/read-all", verifyToken, notificationController.markAllAsRead);

module.exports = router;
