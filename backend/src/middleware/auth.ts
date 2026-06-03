import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { pool } from "../config/database.js";

interface JwtPayload {
  id: string;
  email: string;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Access denied. Token invalid." });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const { rows } = await pool.query(
      "SELECT id, email, name, status, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(403).json({ error: "Unauthorized or invalid user session." });
    }

    const user = rows[0];

    if (user.status !== 'APPROVED') {
      return res.status(403).json({ error: "Your account is awaiting admin approval." });
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Session expired. Please log in again." });
    }
    console.error("Authentication middleware error:", err);
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  next();
};
