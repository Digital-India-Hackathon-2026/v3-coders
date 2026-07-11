const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, forgotPassword, resetPassword } = require("../controllers/authController");
const { verifyToken } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { uploadDocuments } = require("../controllers/uploadController");

router.post("/register", register);
router.post("/login", login);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// Password Reset Routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Document Upload Route (used during registration step 3)
router.post(
  "/upload-documents",
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
    { name: "driving_license", maxCount: 1 }
  ]),
  uploadDocuments
);

module.exports = router;
