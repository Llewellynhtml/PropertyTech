import { Response } from "express";
import { scheduleService } from "../services/scheduleService.js";
import { AuthRequest } from "../middleware/auth.js";

export const getScheduledPosts = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const result = scheduleService.getAll(agencyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createScheduledPost = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const id = await scheduleService.create(req.body, agencyId);
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteScheduledPost = async (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    await scheduleService.delete(req.params.id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const postScheduledNow = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    await scheduleService.postNow(id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const rescheduleScheduledPost = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    await scheduleService.reschedule(id, date, time, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkDeleteScheduledPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    await scheduleService.bulkDelete(ids, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkRescheduleScheduledPosts = async (req: AuthRequest, res: Response) => {
  try {
    const { ids, date, time } = req.body;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    await scheduleService.bulkReschedule(ids, date, time, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
