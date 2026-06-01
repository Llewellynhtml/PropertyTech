import { Response } from "express";
import db from "../config/db.js";
import { AuthRequest } from "../middleware/auth.js";

export const getAgents = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const agents = db.prepare("SELECT * FROM agents WHERE agency_id = ?").all(agencyId);
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAgent = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const { full_name, role_optional, profile_photo_url, email, whatsapp_number, cellphone_number, office_number_optional, bio_optional, linkedin_url_optional, instagram_url_optional } = req.body;
    const result = db.prepare(`
      INSERT INTO agents (agency_id, full_name, role_optional, profile_photo_url, email, whatsapp_number, cellphone_number, office_number_optional, bio_optional, linkedin_url_optional, instagram_url_optional)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agencyId, full_name, role_optional, profile_photo_url, email, whatsapp_number, cellphone_number, office_number_optional, bio_optional, linkedin_url_optional, instagram_url_optional);
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAgent = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const { full_name, role_optional, profile_photo_url, email, whatsapp_number, cellphone_number, office_number_optional, bio_optional, linkedin_url_optional, instagram_url_optional } = req.body;
    db.prepare(`
      UPDATE agents 
      SET full_name = ?, role_optional = ?, profile_photo_url = ?, email = ?, whatsapp_number = ?, cellphone_number = ?, office_number_optional = ?, bio_optional = ?, linkedin_url_optional = ?, instagram_url_optional = ?
      WHERE id = ? AND agency_id = ?
    `).run(full_name, role_optional, profile_photo_url, email, whatsapp_number, cellphone_number, office_number_optional, bio_optional, linkedin_url_optional, instagram_url_optional, id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAgent = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM agents WHERE id = ? AND agency_id = ?").run(req.params.id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
