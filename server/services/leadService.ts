import db from "../config/db.js";
import { metricsService } from "./metricsService.js";

export const leadService = {
  getAll: (agencyId: string) => {
    return db.prepare(`
      SELECT l.*, p.title as propertyTitle, a.full_name as agentName
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN agents a ON l.agent_id = a.id
      WHERE l.agency_id = ?
      ORDER BY l.created_at DESC
    `).all(agencyId).map((l: any) => ({
      id: l.id,
      propertyId: l.property_id,
      postId: l.post_id,
      agentId: l.agent_id,
      source: l.source,
      contactName: l.contact_name,
      contactPhone: l.contact_phone,
      contactEmail: l.contact_email,
      status: l.status,
      message: l.message,
      metadata: l.metadata ? JSON.parse(l.metadata) : undefined,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      propertyTitle: l.propertyTitle,
      agentName: l.agentName
    }));
  },

  getById: (id: number | string, agencyId: string) => {
    const l: any = db.prepare(`
      SELECT l.*, p.title as propertyTitle, a.full_name as agentName
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN agents a ON l.agent_id = a.id
      WHERE l.id = ? AND l.agency_id = ?
    `).get(id, agencyId);
    
    if (!l) return null;

    const notes = db.prepare(`
      SELECT n.*, a.full_name as agentName
      FROM lead_notes n
      JOIN agents a ON n.agent_id = a.id
      WHERE n.lead_id = ?
      ORDER BY n.created_at DESC
    `).all(id);

    const tasks = db.prepare(`
      SELECT * FROM lead_tasks WHERE lead_id = ? ORDER BY due_date ASC
    `).all(id);

    return {
      id: l.id,
      propertyId: l.property_id,
      postId: l.post_id,
      agentId: l.agent_id,
      source: l.source,
      contactName: l.contact_name,
      contactPhone: l.contact_phone,
      contactEmail: l.contact_email,
      status: l.status,
      message: l.message,
      metadata: l.metadata ? JSON.parse(l.metadata) : undefined,
      createdAt: l.created_at,
      updatedAt: l.updated_at,
      propertyTitle: l.propertyTitle,
      agentName: l.agentName,
      notes,
      tasks
    };
  },

  create: (data: {
    propertyId?: number;
    postId?: number;
    agentId?: number;
    source: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    message?: string;
    metadata?: any;
  }, agencyId: string) => {
    const { propertyId, postId, agentId, source, contactName, contactPhone, contactEmail, message, metadata } = data;
    const result = db.prepare(`
      INSERT INTO leads (agency_id, property_id, post_id, agent_id, source, contact_name, contact_phone, contact_email, message, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agencyId, propertyId, postId, agentId, source, contactName, contactPhone, contactEmail, message, metadata ? JSON.stringify(metadata) : null);
    
    const leadId = result.lastInsertRowid;

    // Update property marketing score if propertyId is present
    if (propertyId) {
      metricsService.updateMetrics(propertyId);
    }

    return leadId;
  },

  update: (id: number | string, data: any, agencyId: string) => {
    const mapping: Record<string, string> = {
      status: 'status',
      agentId: 'agent_id',
      contactName: 'contact_name',
      contactPhone: 'contact_phone',
      contactEmail: 'contact_email',
      message: 'message'
    };

    const fields = Object.keys(data).filter(k => mapping[k]);
    if (fields.length === 0) return;

    const setClause = fields.map(f => `${mapping[f]} = ?`).join(', ');
    const values = fields.map(f => data[f]);
    
    db.prepare(`
      UPDATE leads 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND agency_id = ?
    `).run(...values, id, agencyId);
  },

  addNote: (leadId: number | string, agentId: number | string, content: string) => {
    return db.prepare(`
      INSERT INTO lead_notes (lead_id, agent_id, content)
      VALUES (?, ?, ?)
    `).run(leadId, agentId, content);
  },

  addTask: (data: { leadId: number | string, agentId: number | string, title: string, description?: string, dueDate?: string }) => {
    return db.prepare(`
      INSERT INTO lead_tasks (lead_id, agent_id, title, description, due_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(data.leadId, data.agentId, data.title, data.description, data.dueDate);
  },

  toggleTask: (taskId: number | string, completed: boolean) => {
    return db.prepare(`
      UPDATE lead_tasks SET completed = ? WHERE id = ?
    `).run(completed ? 1 : 0, taskId);
  }
};
