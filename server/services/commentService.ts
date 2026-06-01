import db from "../config/db.js";

export const commentService = {
  getAll: (agencyId: string, filters: { post_id?: number; property_id?: number; lead_id?: number }) => {
    let query = `
      SELECT c.*, u.name as user_name
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.agency_id = ?
    `;
    const params: any[] = [agencyId];

    if (filters.post_id) {
      query += " AND c.post_id = ?";
      params.push(filters.post_id);
    }
    if (filters.property_id) {
      query += " AND c.property_id = ?";
      params.push(filters.property_id);
    }
    if (filters.lead_id) {
      query += " AND c.lead_id = ?";
      params.push(filters.lead_id);
    }

    query += " ORDER BY c.created_at ASC";
    return db.prepare(query).all(...params);
  },

  create: (data: any, agencyId: string, userId: number) => {
    const { post_id, property_id, lead_id, content } = data;
    const result = db.prepare(`
      INSERT INTO comments (agency_id, user_id, post_id, property_id, lead_id, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agencyId, userId, post_id, property_id, lead_id, content);
    return result.lastInsertRowid;
  },

  delete: (id: string, agencyId: string) => {
    return db.prepare("DELETE FROM comments WHERE id = ? AND agency_id = ?").run(id, agencyId);
  }
};
