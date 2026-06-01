import { Router } from "express";
import { commentController } from "../controllers/commentController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, commentController.getComments);
router.post("/", authenticateToken, commentController.createComment);
router.delete("/:id", authenticateToken, commentController.deleteComment);

export default router;
