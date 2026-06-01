import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.ts";
import { AuthRequest } from "../middleware/auth.ts";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role, agency_id } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const stmt = db.prepare(
      "INSERT INTO users (name, email, password_hash, role, agency_id) VALUES (?, ?, ?, ?, ?)"
    );
    const result = stmt.run(name, email, passwordHash, role, agency_id || null);

    res.status(201).json({
      message: "User registered successfully",
      userId: result.lastInsertRowid,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(400).json({ error: "Email already exists." });
    }
    res.status(500).json({ error: "Internal server error.", message: error.message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    // Development bypass for admin
    if (process.env.NODE_ENV !== "production" && email === "admin@proppost.co.za" && password === "admin123") {
      const agency = db.prepare("SELECT id FROM agencies LIMIT 1").get() as { id: string };
      const agencyId = agency?.id || "dev-agency-id";
      
      const token = jwt.sign(
        { id: 1, email: "admin@proppost.co.za", role: "admin", agency_id: agencyId },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      return res.json({
        message: "Login successful (Dev Bypass)",
        token,
        user: { id: 1, name: "System Admin", email: "admin@proppost.co.za", role: "admin", agency_id: agencyId },
      });
    }

    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, agency_id: user.agency_id },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        agency_id: user.agency_id,
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error.", message: error.message });
  }
};

export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = db.prepare("SELECT id, name, email, role, agency_id, created_at FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error: any) {
    console.error("getMe error:", error);
    res.status(500).json({ error: "Internal server error.", message: error.message });
  }
};

