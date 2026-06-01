import { Response } from "express";
import { propertyService } from "../services/propertyService.js";
import { AuthRequest } from "../middleware/auth.js";

export const getProperties = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const result = propertyService.getAll(agencyId);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getPropertyFull = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const property = propertyService.getById(id, agencyId);
    if (!property) return res.status(404).json({ error: "Property not found" });
    res.json(property);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProperty = (req: AuthRequest, res: Response) => {
  try {
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const id = propertyService.create(req.body, agencyId);
    res.json({ id });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProperty = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    propertyService.update(id, req.body, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProperty = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const changes = propertyService.delete(id, agencyId);
    if (changes === 0) {
      return res.status(404).json({ error: "Property not found" });
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const duplicateProperty = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    const newId = propertyService.duplicate(id, agencyId);
    res.json({ id: newId });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const archiveProperty = (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const agencyId = req.user?.agency_id;
    if (!agencyId) return res.status(401).json({ error: "Unauthorized" });
    propertyService.archive(id, agencyId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
