import db from "../config/db.js";

export const metricsService = {
  updateMetrics: (propertyId: number | string) => {
    try {
      // 1. Count posts created for this property
      const postsCount = db.prepare("SELECT COUNT(*) as count FROM history WHERE property_id = ?").get(propertyId) as { count: number };
      
      // 2. Count leads generated for this property
      const leadsCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE property_id = ?").get(propertyId) as { count: number };
      
      // 3. Calculate total reach (impressions) from post_analytics
      const reachResult = db.prepare(`
        SELECT SUM(pa.impressions) as totalReach
        FROM post_analytics pa
        JOIN scheduled_posts sp ON pa.post_id = sp.id
        WHERE sp.property_id = ?
      `).get(propertyId) as { totalReach: number | null };
      
      const totalReach = reachResult.totalReach || 0;
      
      // 4. Calculate Score
      // score = (posts_created * 0.4) + (leads_generated * 0.4) + (reach / 1000 * 0.2)
      const rawScore = (postsCount.count * 0.4) + (leadsCount.count * 0.4) + (totalReach / 1000 * 0.2);
      const normalizedScore = Math.min(100, Math.round(rawScore));
      
      // 5. Update property_metrics table
      db.prepare(`
        INSERT INTO property_metrics (property_id, posts_created, leads_generated, total_reach, marketing_score, last_updated)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(property_id) DO UPDATE SET
          posts_created = excluded.posts_created,
          leads_generated = excluded.leads_generated,
          total_reach = excluded.total_reach,
          marketing_score = excluded.marketing_score,
          last_updated = CURRENT_TIMESTAMP
      `).run(propertyId, postsCount.count, leadsCount.count, totalReach, normalizedScore);
      
      return normalizedScore;
    } catch (error) {
      console.error(`Error updating metrics for property ${propertyId}:`, error);
      return 0;
    }
  },

  getMetrics: (propertyId: number | string) => {
    return db.prepare("SELECT * FROM property_metrics WHERE property_id = ?").get(propertyId);
  }
};
