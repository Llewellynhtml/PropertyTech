import { Router } from "express";
import { leadController } from "../controllers/leadController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Public endpoint for creating leads (e.g. from website or social media)
router.post("/", authenticateToken, leadController.createLead);

// Protected endpoints for managing leads
router.get("/", authenticateToken, leadController.getLeads);
router.get("/:id", authenticateToken, leadController.getLeadById);
router.patch("/:id", authenticateToken, leadController.updateLead);
router.post("/:id/notes", authenticateToken, leadController.addNote);
router.post("/:id/tasks", authenticateToken, leadController.addTask);
router.patch("/:id/tasks/:taskId", authenticateToken, leadController.toggleTask);

export default router;
