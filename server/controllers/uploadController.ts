import { Request, Response } from "express";

export const uploadFile = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const uploadPostMedia = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const mediaUrl = `/uploads/posts/${req.file.filename}`;
    const mediaType = req.file.mimetype.startsWith("video/") ? "video" : "image";
    res.json({ url: mediaUrl, type: mediaType });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
