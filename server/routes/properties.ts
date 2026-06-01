import { Router } from "express";
import { 
  getProperties, 
  getPropertyFull, 
  createProperty, 
  updateProperty, 
  deleteProperty, 
  duplicateProperty, 
  archiveProperty 
} from "../controllers/propertyController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getProperties);
router.get("/:id/full", authenticateToken, getPropertyFull);
router.post("/", authenticateToken, authorizeRoles('admin', 'manager', 'agent'), createProperty);
router.put("/:id", authenticateToken, authorizeRoles('admin', 'manager', 'agent'), updateProperty);
router.delete("/:id", authenticateToken, authorizeRoles('admin'), deleteProperty);
router.post("/:id/duplicate", authenticateToken, authorizeRoles('admin', 'manager'), duplicateProperty);
router.post("/:id/archive", authenticateToken, authorizeRoles('admin', 'manager'), archiveProperty);

export default router;
