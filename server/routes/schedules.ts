import { Router } from "express";
import { 
  getScheduledPosts, 
  createScheduledPost, 
  deleteScheduledPost, 
  postScheduledNow,
  rescheduleScheduledPost,
  bulkDeleteScheduledPosts,
  bulkRescheduleScheduledPosts
} from "../controllers/scheduleController.js";
import { authenticateToken, authorizeRoles } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticateToken, getScheduledPosts);
router.post("/", authenticateToken, createScheduledPost);
router.delete("/:id", authenticateToken, authorizeRoles('admin', 'manager'), deleteScheduledPost);
router.post("/:id/post", authenticateToken, postScheduledNow);
router.put("/:id/reschedule", authenticateToken, rescheduleScheduledPost);
router.post("/bulk-delete", authenticateToken, authorizeRoles('admin', 'manager'), bulkDeleteScheduledPosts);
router.post("/bulk-reschedule", authenticateToken, authorizeRoles('admin', 'manager'), bulkRescheduleScheduledPosts);

export default router;
