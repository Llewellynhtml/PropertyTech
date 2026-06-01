import { Router } from "express";
import { 
  getPosts, 
  createPost
} from "../controllers/postController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getPosts);
router.post("/", authenticateToken, createPost);

export default router;
