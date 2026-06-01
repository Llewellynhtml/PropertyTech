import db from "../config/db.js";
import { schedulerService } from "./scheduler.js";

export const scheduleService = {
  getAll: (agencyId: string) => {
    const posts = db.prepare(`
      SELECT p.*, 
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as commentCount
      FROM scheduled_posts p 
      WHERE p.agency_id = ? 
      ORDER BY p.date ASC, p.time ASC
    `).all(agencyId) as any[];
    return posts.map(p => ({
      ...p,
      platforms: JSON.parse(p.platforms),
      propertyTitle: p.property_title,
      agentName: p.agent_name,
      imageURL: p.image_url
    }));
  },

  create: async (data: any, agencyId: string) => {
    const { propertyId, agentId, propertyTitle, agentName, platforms, caption, imageURL, date, time } = data;
    const result = db.prepare(`
      INSERT INTO scheduled_posts (agency_id, property_id, agent_id, property_title, agent_name, platforms, caption, image_url, date, time, status, attempts, publish_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(agencyId, propertyId, agentId, propertyTitle, agentName, JSON.stringify(platforms), caption, imageURL, date, time, 'scheduled', 0, 'pending');
    
    const postId = Number(result.lastInsertRowid);

    // Schedule the job in BullMQ
    try {
      const scheduledAt = new Date(`${date}T${time}`);
      await schedulerService.schedulePost(postId, scheduledAt);
    } catch (error) {
      console.error(`Failed to add post ${postId} to queue:`, error);
      // We still return the ID as it's in the DB, but maybe we should throw?
      // For now, we'll just log it.
    }

    return postId;
  },

  delete: async (id: string | number, agencyId: string) => {
    // Verify ownership
    const post = db.prepare("SELECT id FROM scheduled_posts WHERE id = ? AND agency_id = ?").get(id, agencyId);
    if (!post) return { changes: 0 };

    // Cancel the job in BullMQ
    try {
      await schedulerService.cancelPost(Number(id));
    } catch (error) {
      console.error(`Failed to cancel job for post ${id}:`, error);
    }
    
    return db.prepare("DELETE FROM scheduled_posts WHERE id = ?").run(id);
  },

  postNow: async (id: string | number, agencyId: string) => {
    // Verify ownership
    const post = db.prepare("SELECT id FROM scheduled_posts WHERE id = ? AND agency_id = ?").get(id, agencyId);
    if (!post) throw new Error("Post not found");

    // For "Post Now", we can just trigger the job immediately in BullMQ
    try {
      await schedulerService.schedulePost(Number(id), new Date());
      return true;
    } catch (error) {
      console.error(`Failed to trigger post ${id} now:`, error);
      throw error;
    }
  },

  reschedule: async (id: string | number, date: string, time: string, agencyId: string) => {
    try {
      // Verify ownership
      const post = db.prepare("SELECT id FROM scheduled_posts WHERE id = ? AND agency_id = ?").get(id, agencyId);
      if (!post) throw new Error("Post not found");

      // Update database
      db.prepare(`
        UPDATE scheduled_posts 
        SET date = ?, time = ?, status = 'scheduled', publish_status = 'pending'
        WHERE id = ?
      `).run(date, time, id);

      // Reschedule in BullMQ
      const scheduledAt = new Date(`${date}T${time}`);
      await schedulerService.schedulePost(Number(id), scheduledAt);
      return true;
    } catch (error) {
      console.error(`Failed to reschedule post ${id}:`, error);
      throw error;
    }
  },

  bulkDelete: async (ids: number[], agencyId: string) => {
    for (const id of ids) {
      await scheduleService.delete(id, agencyId);
    }
    return true;
  },

  bulkReschedule: async (ids: number[], date: string, time: string, agencyId: string) => {
    for (const id of ids) {
      await scheduleService.reschedule(id, date, time, agencyId);
    }
    return true;
  }
};
