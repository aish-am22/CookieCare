import { rateLimit } from "express-rate-limit";

/**
 * Standard rate limiter for API endpoints
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

/**
 * Strict rate limiter for high-cost AI operations
 */
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 AI generations per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "AI generation quota exceeded for this hour. Please try again later." }
});
