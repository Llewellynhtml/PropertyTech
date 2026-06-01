import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import db from "../config/db.js";
import { AuthRequest } from "../middleware/auth.js";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key";
const TOKEN_TTL = "24h";

const signToken = (user: { id: number; email: string; role: string; agency_id: string }) =>
  jwt.sign(user, JWT_SECRET, { expiresIn: TOKEN_TTL });

/**
 * Register.
 * Model: "first user makes the agency, the rest join it."
 *  - No agency_code  -> create a new agency, this user becomes its admin.
 *  - With agency_code -> join that existing agency as an agent.
 * One account = one login: we always create a `users` row (the credential)
 * AND a matching `agents` profile row, linked, in a single transaction.
 */
export const register = async (req: Request, res: Response) => {
  const { name, email, password, agency_name, agency_code } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email and password are required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters." });
  }

  try {
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    let agencyId: string;
    let role: string;

    if (agency_code) {
      // Joining an existing agency. The agency_code IS the agency id.
      const agency = db.prepare("SELECT id FROM agencies WHERE id = ?").get(agency_code) as
        | { id: string }
        | undefined;
      if (!agency) {
        return res.status(404).json({ error: "Invalid agency code." });
      }
      agencyId = agency.id;
      role = "agent";
    } else {
      // First user: create a brand new agency, become its admin.
      agencyId = randomUUID();
      db.prepare(
        "INSERT INTO agencies (id, name, primary_color, secondary_color) VALUES (?, ?, ?, ?)"
      ).run(agencyId, agency_name || `${name}'s Agency`, "#1E97AB", "#359288");
      role = "admin";
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createAccount = db.transaction(() => {
      const userResult = db
        .prepare(
          "INSERT INTO users (agency_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)"
        )
        .run(agencyId, name, email, passwordHash, role);

      // Linked agent profile so the new login shows up as an agent immediately.
      db.prepare(
        "INSERT INTO agents (agency_id, full_name, email, role_optional) VALUES (?, ?, ?, ?)"
      ).run(agencyId, name, email, role === "admin" ? "Agency Admin" : "Estate Agent");

      return Number(userResult.lastInsertRowid);
    });

    const userId = createAccount();
    const user = { id: userId, name, email, role, agency_id: agencyId };
    const token = signToken(user);

    return res.status(201).json({ message: "Account created", token, user });
  } catch (error: any) {
    console.error("Registration error:", error);
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return res.status(409).json({ error: "An account with this email already exists." });
    }
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      agency_id: user.agency_id,
    };
    const token = signToken(safeUser);

    return res.json({
      message: "Login successful",
      token,
      user: { ...safeUser, name: user.name },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

export const getMe = (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const user = db
      .prepare("SELECT id, name, email, role, agency_id, created_at FROM users WHERE id = ?")
      .get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(user);
  } catch (error: any) {
    console.error("getMe error:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};
