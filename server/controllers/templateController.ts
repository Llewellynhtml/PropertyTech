import { Response } from "express";
import { templateService } from "../services/templateService.js";
import { AuthRequest } from "../middleware/auth.js";

export const getTemplates = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const result = templateService.getAll(agencyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleFavoriteTemplate = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const is_favorite = templateService.toggleFavorite(id, agencyId);
    res.json({ is_favorite });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    templateService.update(id, req.body, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
