import express from "express";
import { analyticsController } from "../controllers/analyticsController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/dashboard", authenticateToken, analyticsController.getDashboardData);
router.get("/dashboard/role", authenticateToken, analyticsController.getRoleDashboardData);
router.get("/map", authenticateToken, analyticsController.getMapData);
router.get("/overview", authenticateToken, analyticsController.getOverviewStats);
router.get("/platforms", authenticateToken, analyticsController.getPlatformPerformance);
router.get("/agents", authenticateToken, analyticsController.getAgentPerformance);
router.post("/reports/custom", authenticateToken, analyticsController.getCustomReportData);
router.get("/property/:propertyId", authenticateToken, analyticsController.getPropertyPerformance);

export default router;
