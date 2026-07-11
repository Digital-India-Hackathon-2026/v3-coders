const express = require("express");
const router = express.Router();
const { handleChat } = require("../controllers/chatController");

// Public chat endpoint — no auth required so even landing page visitors can use it
router.post("/", handleChat);

module.exports = router;
