import { Router } from "express";
import { 
  getTemplates, 
  toggleFavoriteTemplate, 
  updateTemplate 
} from "../controllers/templateController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getTemplates);
router.post("/:id/toggle-favorite", authenticateToken, authorizeRoles('admin', 'manager'), toggleFavoriteTemplate);
router.put("/:id", authenticateToken, authorizeRoles('admin'), updateTemplate);

export default router;
