import express from "express";
import { getAgencySettings, updateAgencySettings } from "../controllers/agencyController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = express.Router();

router.get("/", authenticateToken, authorizeRoles("admin"), getAgencySettings);
router.put("/", authenticateToken, authorizeRoles("admin"), updateAgencySettings);

export default router;
