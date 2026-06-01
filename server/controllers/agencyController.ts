import { Response } from "express";
import { agencyService } from "../services/agencyService.js";
import { AuthRequest } from "../middleware/auth.js";

export const getAgencySettings = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });

    const agency = agencyService.getById(agencyId);
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    res.json(agency);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAgencySettings = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });

    const { name, logo_url, primary_color, secondary_color } = req.body;
    agencyService.update(agencyId, { name, logo_url, primary_color, secondary_color });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
