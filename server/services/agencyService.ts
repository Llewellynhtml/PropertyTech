import db from "../config/db.js";

export const agencyService = {
  getById: (id: string) => {
    return db.prepare("SELECT * FROM agencies WHERE id = ?").get(id) as any;
  },

  update: (id: string, data: { name: string; logo_url: string; primary_color: string; secondary_color: string }) => {
    const { name, logo_url, primary_color, secondary_color } = data;
    return db.prepare(`
      UPDATE agencies 
      SET name = ?, logo_url = ?, primary_color = ?, secondary_color = ?
      WHERE id = ?
    `).run(name, logo_url, primary_color, secondary_color, id);
  }
};
