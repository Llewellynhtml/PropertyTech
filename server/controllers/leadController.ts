import { Response } from "express";
import { leadService } from "../services/leadService.js";
import { AuthRequest } from "../middleware/auth.js";

export const leadController = {
  getLeads: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const leads = leadService.getAll(agencyId);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch leads" });
    }
  },

  getLeadById: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const lead = leadService.getById(req.params.id, agencyId);
      if (!lead) {
        return res.status(404).json({ error: "Lead not found" });
      }
      res.json(lead);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lead" });
    }
  },

  createLead: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const { propertyId, postId, agentId, source, contactName, contactPhone, message, metadata } = req.body;
      
      if (!source || !contactName || !contactPhone) {
        return res.status(400).json({ error: "Missing required fields: source, contactName, contactPhone" });
      }

      const id = leadService.create({
        propertyId,
        postId,
        agentId,
        source,
        contactName,
        contactPhone,
        message,
        metadata
      }, agencyId);

      const newLead = leadService.getById(id as number, agencyId);
      res.status(201).json(newLead);
    } catch (error) {
      res.status(500).json({ error: "Failed to create lead" });
    }
  },

  updateLead: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      leadService.update(req.params.id, req.body, agencyId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to update lead" });
    }
  },

  addNote: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const { content, agentId } = req.body;
      leadService.addNote(req.params.id, agentId, content);
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add note" });
    }
  },

  addTask: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const { title, description, dueDate, agentId } = req.body;
      leadService.addTask({ leadId: req.params.id, agentId, title, description, dueDate });
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to add task" });
    }
  },

  toggleTask: async (req: AuthRequest, res: Response) => {
    try {
      const agencyId = req.user?.agency_id;
      if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
      const { completed } = req.body;
      leadService.toggleTask(req.params.taskId, completed);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle task" });
    }
  }
};
