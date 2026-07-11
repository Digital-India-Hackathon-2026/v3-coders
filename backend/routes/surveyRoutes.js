const express = require("express");
const router = express.Router();
const {
  createSurvey,
  getSurveys,
  getSurveyById,
  submitResponse,
  finalizeSurvey,
  getActiveSurveys,
  getClosedSurveys
} = require("../controllers/surveyController");
const { verifyToken, checkRole } = require("../middleware/auth");

// --- Admin-only routes ---
router.post("/", verifyToken, checkRole(["admin"]), createSurvey);
router.get("/", verifyToken, checkRole(["admin"]), getSurveys);
router.get("/:id", verifyToken, checkRole(["admin"]), getSurveyById);
router.put("/:id/finalize", verifyToken, checkRole(["admin"]), finalizeSurvey);

// --- User (farmer/provider) routes ---
router.get("/user/active", verifyToken, checkRole(["farmer", "provider"]), getActiveSurveys);
router.get("/user/closed", verifyToken, checkRole(["farmer", "provider"]), getClosedSurveys);
router.post("/:id/respond", verifyToken, checkRole(["farmer", "provider"]), submitResponse);

module.exports = router;
