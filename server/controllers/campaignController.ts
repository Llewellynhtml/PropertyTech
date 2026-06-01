import { Response } from "express";
import { campaignService } from "../services/campaignService.js";
import { AuthRequest } from "../middleware/auth.js";

export const generateCampaign = (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.body;
    const agencyId = req.user?.agency_id;
    const userId = req.user?.id;

    if (!agencyId || !userId) return res.status(401).json({ error: "Unauthorized" });
    if (!propertyId) return res.status(400).json({ error: "Property ID is required" });

    const result = campaignService.generateCampaign(propertyId, agencyId, userId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getCampaigns = (req: AuthRequest, res: Response) => {
  try {
    const { propertyId } = req.query;
    const agencyId = req.user?.agency_id;

    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    if (!propertyId) return res.status(400).json({ error: "Property ID is required" });

    const result = campaignService.getCampaignsByProperty(propertyId as string, agencyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
