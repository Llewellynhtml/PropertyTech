import db from "../config/db.js";

export const analyticsService = {
  getOverviewStats: (agencyId: string) => {
    const totalLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE agency_id = ?").get(agencyId) as { count: number };
    const closedLeads = db.prepare("SELECT COUNT(*) as count FROM leads WHERE agency_id = ? AND status = 'Closed'").get(agencyId) as { count: number };
    
    const conversionRate = totalLeads.count > 0 ? (closedLeads.count / totalLeads.count) * 100 : 0;

    // Average Response Time in minutes
    // Difference between lead creation and first note or task
    const responseTimes = db.prepare(`
      SELECT 
        l.id,
        l.created_at as lead_created,
        MIN(COALESCE(n.created_at, t.created_at)) as first_response
      FROM leads l
      LEFT JOIN lead_notes n ON l.id = n.lead_id
      LEFT JOIN lead_tasks t ON l.id = t.lead_id
      WHERE l.agency_id = ?
      GROUP BY l.id
      HAVING first_response IS NOT NULL
    `).all(agencyId) as any[];

    let avgResponseTime = 0;
    if (responseTimes.length > 0) {
      const totalDiff = responseTimes.reduce((acc, curr) => {
        const diff = new Date(curr.first_response).getTime() - new Date(curr.lead_created).getTime();
        return acc + diff;
      }, 0);
      avgResponseTime = (totalDiff / responseTimes.length) / (1000 * 60); // in minutes
    }

    // Marketing ROI (Mock calculation: (Leads * 500 - Spend) / Spend * 100)
    // Assuming spend is $10 per post
    const totalPosts = db.prepare("SELECT COUNT(*) as count FROM scheduled_posts WHERE agency_id = ? AND status = 'posted'").get(agencyId) as { count: number };
    const spend = totalPosts.count * 10 || 100; // fallback to 100
    const revenue = totalLeads.count * 50; // Mock revenue per lead
    const roi = ((revenue - spend) / spend) * 100;

    return {
      totalLeads: totalLeads.count,
      conversionRate: conversionRate.toFixed(1),
      avgResponseTime: avgResponseTime.toFixed(0),
      marketingRoi: roi.toFixed(1)
    };
  },

  getPlatformPerformance: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        pa.platform,
        COUNT(DISTINCT sp.id) as postsPublished,
        SUM(pa.impressions) as reach,
        SUM(pa.likes + pa.comments + pa.shares) as engagement,
        SUM(pa.clicks) as clicks,
        (SELECT COUNT(*) FROM leads WHERE post_id IN (SELECT id FROM scheduled_posts WHERE agency_id = ? AND platforms LIKE '%' || pa.platform || '%')) as leadsGenerated
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.agency_id = ?
      GROUP BY pa.platform
    `).all(agencyId, agencyId);
  },

  getAgentPerformance: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        a.full_name as agentName,
        a.profile_photo_url as profilePhoto,
        (SELECT COUNT(*) FROM properties WHERE agent_id = a.id) as propertiesManaged,
        (SELECT COUNT(*) FROM leads WHERE agent_id = a.id) as leadsGenerated,
        (SELECT 
          CASE 
            WHEN COUNT(*) = 0 THEN 0 
            ELSE (CAST(SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*)) * 100 
          END 
         FROM leads WHERE agent_id = a.id) as conversionRate,
        (
          SELECT AVG((strftime('%s', COALESCE(n.created_at, t.created_at)) - strftime('%s', l.created_at)) / 60)
          FROM leads l
          LEFT JOIN lead_notes n ON l.id = n.lead_id
          LEFT JOIN lead_tasks t ON l.id = t.lead_id
          WHERE l.agent_id = a.id
          AND (n.created_at IS NOT NULL OR t.created_at IS NOT NULL)
        ) as avgResponseTime
      FROM agents a
      WHERE a.agency_id = ?
      ORDER BY leadsGenerated DESC
    `).all(agencyId);
  },

  getCustomReportData: (agencyId: string, dimensions: string[], metrics: string[]) => {
    // This is a simplified version. In a real app, you'd build a dynamic query.
    // For now, let's return a combined dataset of platforms and agents.
    const platforms = analyticsService.getPlatformPerformance(agencyId);
    const agents = analyticsService.getAgentPerformance(agencyId);
    return { platforms, agents };
  },

  getTopProperties: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        p.title,
        (SELECT COUNT(*) FROM leads WHERE property_id = p.id) as leadCount,
        (SELECT SUM(clicks) FROM post_analytics WHERE post_id IN (SELECT id FROM scheduled_posts WHERE property_id = p.id)) as clickCount,
        (SELECT SUM(impressions) FROM post_analytics WHERE post_id IN (SELECT id FROM scheduled_posts WHERE property_id = p.id)) as impressionCount,
        COALESCE(pm.marketing_score, 0) as marketingScore,
        (SELECT GROUP_CONCAT(DISTINCT platform) FROM post_analytics WHERE post_id IN (SELECT id FROM scheduled_posts WHERE property_id = p.id)) as platforms
      FROM properties p
      LEFT JOIN property_metrics pm ON p.id = pm.property_id
      WHERE p.agency_id = ?
      ORDER BY marketingScore DESC, leadCount DESC
      LIMIT 5
    `).all(agencyId);
  },

  getLeadsPerAgent: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        a.full_name as agentName,
        a.profile_photo_url as profilePhoto,
        COUNT(l.id) as leadCount
      FROM agents a
      LEFT JOIN leads l ON a.id = l.agent_id
      WHERE a.agency_id = ?
      GROUP BY a.id
      ORDER BY leadCount DESC
    `).all(agencyId);
  },
  getLeadsByPlatform: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        source as platform,
        COUNT(*) as count
      FROM leads
      WHERE agency_id = ?
      GROUP BY source
      ORDER BY count DESC
    `).all(agencyId);
  },

  getLeadConversionFunnel: (agencyId: string) => {
    const statuses = ['New', 'Contacted', 'Qualified', 'Closed'];
    return statuses.map(status => {
      const result = db.prepare(`
        SELECT COUNT(*) as count FROM leads 
        WHERE agency_id = ? AND status = ?
      `).get(agencyId, status) as { count: number };
      return { status, count: result.count };
    });
  },

  getLeadsByProperty: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        p.title as propertyTitle,
        COUNT(l.id) as leadCount
      FROM properties p
      JOIN leads l ON p.id = l.property_id
      WHERE p.agency_id = ?
      GROUP BY p.id
      ORDER BY leadCount DESC
      LIMIT 5
    `).all(agencyId);
  },

  getRecentLeads: (agencyId: string) => {
    return db.prepare(`
      SELECT 
        l.*,
        p.title as propertyTitle,
        a.full_name as agentName
      FROM leads l
      LEFT JOIN properties p ON l.property_id = p.id
      LEFT JOIN agents a ON l.agent_id = a.id
      WHERE l.agency_id = ?
      ORDER BY l.created_at DESC
      LIMIT 10
    `).all(agencyId);
  },

  getRecentActivity: (agencyId: string) => {
    const properties = db.prepare(`
      SELECT 'property_added' as type, title as label, created_at as timestamp 
      FROM properties WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    const agents = db.prepare(`
      SELECT 'agent_created' as type, full_name as label, created_at as timestamp 
      FROM agents WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    const scheduled = db.prepare(`
      SELECT 'post_scheduled' as type, property_title as label, created_at as timestamp 
      FROM scheduled_posts WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    const leads = db.prepare(`
      SELECT 'lead_received' as type, contact_name as label, created_at as timestamp 
      FROM leads WHERE agency_id = ? ORDER BY created_at DESC LIMIT 5
    `).all(agencyId);

    return [...properties, ...agents, ...scheduled, ...leads]
      .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);
  },

  getPropertyPerformance: (propertyId: number, agencyId: string) => {
    // Verify ownership
    const property = db.prepare("SELECT id FROM properties WHERE id = ? AND agency_id = ?").get(propertyId, agencyId);
    if (!property) throw new Error("Property not found");

    const stats = db.prepare(`
      SELECT 
        SUM(pa.likes) as likes,
        SUM(pa.comments) as comments,
        SUM(pa.shares) as shares,
        SUM(pa.clicks) as clicks,
        SUM(pa.impressions) as impressions
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.property_id = ? AND sp.agency_id = ?
    `).get(propertyId, agencyId) as any;

    const leads = db.prepare(`
      SELECT COUNT(*) as count FROM leads WHERE property_id = ? AND agency_id = ?
    `).get(propertyId, agencyId) as { count: number };

    const platformBreakdown = db.prepare(`
      SELECT 
        pa.platform,
        SUM(pa.clicks) as clicks,
        SUM(pa.impressions) as impressions
      FROM post_analytics pa
      JOIN scheduled_posts sp ON pa.post_id = sp.id
      WHERE sp.property_id = ? AND sp.agency_id = ?
      GROUP BY pa.platform
    `).all(propertyId, agencyId);

    return {
      stats: {
        likes: stats.likes || 0,
        comments: stats.comments || 0,
        shares: stats.shares || 0,
        clicks: stats.clicks || 0,
        impressions: stats.impressions || 0,
        leads: leads.count || 0
      },
      platformBreakdown
    };
  },

  getAgentDashboardData: (agencyId: string, userId: number) => {
    const agent = db.prepare("SELECT id FROM agents WHERE email = (SELECT email FROM users WHERE id = ?)").get(userId) as { id: number };
    if (!agent) return { leads: [], tasks: [], properties: [] };

    const leads = db.prepare("SELECT * FROM leads WHERE agent_id = ? ORDER BY created_at DESC LIMIT 5").all(agent.id);
    const tasks = db.prepare("SELECT * FROM lead_tasks WHERE agent_id = ? AND completed = 0 ORDER BY due_date ASC LIMIT 5").all(agent.id);
    const properties = db.prepare("SELECT * FROM properties WHERE agent_id = ? LIMIT 5").all(agent.id);

    return { leads, tasks, properties };
  },

  getMarketerDashboardData: (agencyId: string) => {
    const campaigns = db.prepare("SELECT * FROM campaigns WHERE agency_id = ? LIMIT 5").all(agencyId);
    const templates = db.prepare("SELECT * FROM templates WHERE agency_id = ? LIMIT 5").all(agencyId);
    const platformPerformance = analyticsService.getPlatformPerformance(agencyId);

    return { campaigns, templates, platformPerformance };
  },

  getDeveloperDashboardData: (agencyId: string) => {
    const projects = db.prepare("SELECT * FROM projects WHERE agency_id = ? LIMIT 5").all(agencyId);
    const milestones = db.prepare(`
      SELECT m.*, p.name as project_name 
      FROM milestones m 
      JOIN projects p ON m.project_id = p.id 
      WHERE p.agency_id = ? AND m.completed = 0 
      ORDER BY m.due_date ASC LIMIT 10
    `).all(agencyId);

    return { projects, milestones };
  },

  getMapData: (agencyId: string) => {
    const properties = db.prepare("SELECT id, title, price, latitude, longitude, status FROM properties WHERE agency_id = ? AND latitude IS NOT NULL").all(agencyId);
    const leads = db.prepare("SELECT id, contact_name, latitude, longitude, status FROM leads WHERE agency_id = ? AND latitude IS NOT NULL").all(agencyId);
    return { properties, leads };
  }
};
