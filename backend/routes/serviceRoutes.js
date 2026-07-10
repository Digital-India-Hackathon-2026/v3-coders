const express = require("express");
const router = express.Router();
const {
  getAllServices,
  getProviderServices,
  createService,
  updateService,
  deleteService
} = require("../controllers/serviceController");
const { verifyToken, checkRole } = require("../middleware/auth");

router.get("/", getAllServices);
router.get("/provider", verifyToken, checkRole(["provider"]), getProviderServices);
router.post("/", verifyToken, checkRole(["provider"]), createService);
router.put("/:id", verifyToken, checkRole(["provider"]), updateService);
router.delete("/:id", verifyToken, checkRole(["provider"]), deleteService);

module.exports = router;
