import db from "../config/db.js";

export const templateService = {
  getAll: (agencyId: string) => {
    const templates = db.prepare("SELECT * FROM templates WHERE agency_id = ?").all(agencyId) as any[];
    return templates.map(t => ({
      ...t,
      supported_formats: JSON.parse(t.supported_formats)
    }));
  },

  toggleFavorite: (id: string | number, agencyId: string) => {
    db.prepare("UPDATE templates SET is_favorite = NOT is_favorite WHERE id = ? AND agency_id = ?").run(id, agencyId);
    const updated = db.prepare("SELECT is_favorite FROM templates WHERE id = ? AND agency_id = ?").get(id, agencyId) as { is_favorite: number };
    return updated ? !!updated.is_favorite : false;
  },

  update: (id: string | number, data: any, agencyId: string) => {
    const { name, description, category, style_theme, tags, listing_status, version } = data;
    return db.prepare("UPDATE templates SET name = ?, description = ?, category = ?, style_theme = ?, tags = ?, listing_status = ?, version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND agency_id = ?")
      .run(name, description, category, style_theme, tags, listing_status, version, id, agencyId);
  }
};
