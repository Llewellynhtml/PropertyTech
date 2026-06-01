import { Router } from "express";
import { 
  getAmenities, 
  createAmenity, 
  deleteAmenity 
} from "../controllers/amenityController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getAmenities);
router.post("/", authenticateToken, authorizeRoles('admin', 'manager'), createAmenity);
router.delete("/:id", authenticateToken, authorizeRoles('admin'), deleteAmenity);

export default router;
