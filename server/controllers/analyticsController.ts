import { Response } from "express";
import { analyticsService } from "../services/analyticsService.js";
import { AuthRequest } from "../middleware/auth.js";

export const analyticsController = {
  getOverviewStats: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const stats = analyticsService.getOverviewStats(agencyId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching overview stats:", error);
      res.status(500).json({ error: "Failed to fetch overview stats" });
    }
  },

  getPlatformPerformance: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const data = analyticsService.getPlatformPerformance(agencyId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching platform performance:", error);
      res.status(500).json({ error: "Failed to fetch platform performance" });
    }
  },

  getAgentPerformance: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const data = analyticsService.getAgentPerformance(agencyId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      res.status(500).json({ error: "Failed to fetch agent performance" });
    }
  },

  getCustomReportData: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const { dimensions, metrics } = req.body;
      const data = analyticsService.getCustomReportData(agencyId, dimensions, metrics);
      res.json(data);
    } catch (error) {
      console.error("Error fetching custom report data:", error);
      res.status(500).json({ error: "Failed to fetch custom report data" });
    }
  },

  getDashboardData: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });

      const stats = analyticsService.getOverviewStats(agencyId);
      const topProperties = analyticsService.getTopProperties(agencyId);
      const platformPerformance = analyticsService.getPlatformPerformance(agencyId);
      const leadsPerAgent = analyticsService.getLeadsPerAgent(agencyId);
      const leadsByPlatform = analyticsService.getLeadsByPlatform(agencyId);
      const leadConversionFunnel = analyticsService.getLeadConversionFunnel(agencyId);
      const leadsByProperty = analyticsService.getLeadsByProperty(agencyId);
      const recentLeads = analyticsService.getRecentLeads(agencyId);
      const recentActivity = analyticsService.getRecentActivity(agencyId);

      res.json({
        stats,
        topProperties,
        platformPerformance,
        leadsPerAgent,
        leadsByPlatform,
        leadConversionFunnel,
        leadsByProperty,
        recentLeads,
        recentActivity
      });
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  },

  getRoleDashboardData: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      const userId = req.user?.id;
      const role = req.user?.role;
      if (!agencyId || !userId) return res.status(401).json({ error: "Unauthorized" });

      let data: any = {};
      if (role === 'agent') {
        data = analyticsService.getAgentDashboardData(agencyId, userId);
      } else if (role === 'marketer') {
        data = analyticsService.getMarketerDashboardData(agencyId);
      } else if (role === 'developer') {
        data = analyticsService.getDeveloperDashboardData(agencyId);
      } else {
        // Admin/Manager see general dashboard data
        data = analyticsService.getOverviewStats(agencyId);
      }

      res.json(data);
    } catch (error) {
      console.error("Error fetching role dashboard data:", error);
      res.status(500).json({ error: "Failed to fetch role dashboard data" });
    }
  },

  getMapData: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const data = analyticsService.getMapData(agencyId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching map data:", error);
      res.status(500).json({ error: "Failed to fetch map data" });
    }
  },

  getPropertyPerformance: async (req: AuthRequest, res: Response) => {
    try {
      const { propertyId } = req.params;
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });

      if (!propertyId) {
        return res.status(400).json({ error: "Property ID is required" });
      }
      const data = analyticsService.getPropertyPerformance(Number(propertyId), agencyId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching property performance:", error);
      res.status(500).json({ error: "Failed to fetch property performance" });
    }
  }
};
