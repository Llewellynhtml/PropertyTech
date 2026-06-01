import { Router } from "express";
import { generateCampaign, getCampaigns } from "../controllers/campaignController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.post("/generate", authenticateToken, authorizeRoles('admin', 'manager', 'agent'), generateCampaign);
router.get("/", authenticateToken, getCampaigns);

export default router;
