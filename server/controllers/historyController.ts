import { Response } from "express";
import db from "../config/db.js";
import { AuthRequest } from "../middleware/auth.js";

export const getHistory = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const history = db.prepare(`
      SELECT h.*, p.title as property_title, a.full_name as agent_name, b.company_name as brand_name, t.name as template_name
      FROM history h
      JOIN properties p ON h.property_id = p.id
      JOIN agents a ON h.agent_id = a.id
      JOIN branding b ON h.brand_id = b.id
      LEFT JOIN templates t ON h.template_id = t.id
      WHERE h.agency_id = ?
      ORDER BY h.created_at DESC
    `).all(agencyId);
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createHistory = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const { property_id, agent_id, brand_id, template_id, platform, aspect_ratio, style, thumbnail_url } = req.body;
    const result = db.prepare(`
      INSERT INTO history (agency_id, property_id, agent_id, brand_id, template_id, platform, aspect_ratio, style, thumbnail_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agencyId, property_id, agent_id, brand_id, template_id, platform, aspect_ratio, style, thumbnail_url);
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHistoryItem = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM history WHERE id = ? AND agency_id = ?").run(id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const clearHistory = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM history WHERE agency_id = ?").run(agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
