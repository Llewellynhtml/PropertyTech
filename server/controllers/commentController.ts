import { Response } from "express";
import { commentService } from "../services/commentService.js";
import { AuthRequest } from "../middleware/auth.js";

export const commentController = {
  getComments: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      
      const { post_id, property_id, lead_id } = req.query;
      const comments = commentService.getAll(agencyId, {
        post_id: post_id ? Number(post_id) : undefined,
        property_id: property_id ? Number(property_id) : undefined,
        lead_id: lead_id ? Number(lead_id) : undefined
      });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  },

  createComment: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      const userId = req.user?.id;
      if (!agencyId || !userId) return res.status(401).json({ error: "Unauthorized" });
      
      const { post_id, property_id, lead_id, content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }

      const id = commentService.create({ post_id, property_id, lead_id, content }, agencyId, userId);
      res.status(201).json({ id, content, created_at: new Date().toISOString() });
    } catch (error) {
      res.status(500).json({ error: "Failed to create comment" });
    }
  },

  deleteComment: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      
      commentService.delete(req.params.id, agencyId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete comment" });
    }
  }
};
