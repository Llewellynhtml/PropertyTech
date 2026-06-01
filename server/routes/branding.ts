import { Router } from "express";
import { 
  getBranding, 
  createBranding, 
  updateBranding, 
  deleteBranding 
} from "../controllers/brandingController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getBranding);
router.post("/", authenticateToken, authorizeRoles('admin'), createBranding);
router.put("/:id", authenticateToken, authorizeRoles('admin', 'manager'), updateBranding);
router.delete("/:id", authenticateToken, authorizeRoles('admin'), deleteBranding);

export default router;
