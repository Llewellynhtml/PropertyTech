import { Response } from "express";
import { postService } from "../services/postService.js";
import { AuthRequest } from "../middleware/auth.js";

export const getPosts = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const result = postService.getAll(agencyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createPost = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const postId = postService.create(req.body, agencyId);
    res.json({ id: postId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
