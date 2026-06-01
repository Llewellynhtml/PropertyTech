import { Response } from "express";
import db from "../config/db.js";
import { AuthRequest } from "../middleware/auth.js";

export const getBranding = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const branding = db.prepare("SELECT * FROM branding WHERE agency_id = ?").all(agencyId);
    res.json(branding);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createBranding = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const { 
      company_name, logo_url, watermark_logo_optional_url, primary_color_hex, 
      secondary_color_hex, accent_color_hex, background_color_hex, 
      heading_font_family, body_font_family, default_cta_text, 
      website_url, default_hashtags_optional 
    } = req.body;
    
    const result = db.prepare(`
      INSERT INTO branding (
        agency_id, company_name, logo_url, watermark_logo_optional_url, primary_color_hex, 
        secondary_color_hex, accent_color_hex, background_color_hex, 
        heading_font_family, body_font_family, default_cta_text, 
        website_url, default_hashtags_optional
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      agencyId, company_name, logo_url, watermark_logo_optional_url, primary_color_hex, 
      secondary_color_hex, accent_color_hex, background_color_hex, 
      heading_font_family, body_font_family, default_cta_text, 
      website_url, default_hashtags_optional
    );
    
    res.json({ id: result.lastInsertRowid });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBranding = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const { 
      company_name, logo_url, watermark_logo_optional_url, primary_color_hex, 
      secondary_color_hex, accent_color_hex, background_color_hex, 
      heading_font_family, body_font_family, default_cta_text, 
      website_url, default_hashtags_optional 
    } = req.body;
    
    db.prepare(`
      UPDATE branding SET 
        company_name = ?, logo_url = ?, watermark_logo_optional_url = ?, 
        primary_color_hex = ?, secondary_color_hex = ?, accent_color_hex = ?, 
        background_color_hex = ?, heading_font_family = ?, body_font_family = ?, 
        default_cta_text = ?, website_url = ?, default_hashtags_optional = ?
      WHERE id = ? AND agency_id = ?
    `).run(
      company_name, logo_url, watermark_logo_optional_url, primary_color_hex, 
      secondary_color_hex, accent_color_hex, background_color_hex, 
      heading_font_family, body_font_family, default_cta_text, 
      website_url, default_hashtags_optional, id, agencyId
    );
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteBranding = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    db.prepare("DELETE FROM branding WHERE id = ? AND agency_id = ?").run(req.params.id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
