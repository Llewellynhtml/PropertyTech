import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    agency_id: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  // Bypass authentication for now as requested by user
  const bypassAuth = true; 

  if (!token) {
    if (bypassAuth || process.env.NODE_ENV !== "production") {
      try {
        const db = (await import("../config/db.ts")).default;
        const agency = db.prepare("SELECT id FROM agencies LIMIT 1").get() as { id: string };
        const agencyId = agency?.id || "dev-agency-id";
        req.user = { id: 1, email: "admin@proppost.co.za", role: "admin", agency_id: agencyId };
        return next();
      } catch (e) {
        req.user = { id: 1, email: "admin@proppost.co.za", role: "admin", agency_id: "dev-agency-id" };
        return next();
      }
    }
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    if (bypassAuth || process.env.NODE_ENV !== "production") {
      try {
        const db = (await import("../config/db.ts")).default;
        const agency = db.prepare("SELECT id FROM agencies LIMIT 1").get() as { id: string };
        const agencyId = agency?.id || "dev-agency-id";
        req.user = { id: 1, email: "admin@proppost.co.za", role: "admin", agency_id: agencyId };
        return next();
      } catch (e) {
        req.user = { id: 1, email: "admin@proppost.co.za", role: "admin", agency_id: "dev-agency-id" };
        return next();
      }
    }
    res.status(403).json({ error: "Invalid or expired token." });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied. Insufficient permissions." });
    }

    next();
  };
};

