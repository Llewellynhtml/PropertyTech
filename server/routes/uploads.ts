import { Router } from "express";
import { 
  uploadFile, 
  uploadPostMedia 
} from "../controllers/uploadController.js";
import { authenticateToken } from "../middleware/auth.js";
import { upload } from "../middleware/upload.js";

const router = Router();

router.post("/upload", authenticateToken, upload.single("image"), uploadFile);
router.post("/posts/media", authenticateToken, upload.single("media"), uploadPostMedia);

export default router;
