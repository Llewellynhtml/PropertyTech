import { Request, Response } from "express";
import db from "../config/db.js";

export const getAmenities = (req: Request, res: Response) => {
  try {
    const amenities = db.prepare("SELECT * FROM amenities").all();
    res.json(amenities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createAmenity = (req: Request, res: Response) => {
  const { name } = req.body;
  try {
    const result = db.prepare("INSERT INTO amenities (name) VALUES (?)").run(name);
    res.json({ id: result.lastInsertRowid });
  } catch (e: any) {
    res.status(400).json({ error: "Amenity already exists" });
  }
};

export const deleteAmenity = (req: Request, res: Response) => {
  try {
    db.prepare("DELETE FROM amenities WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
