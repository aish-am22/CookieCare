import cors from "cors";
import { config, isProduction } from "../config/index.js";

const corsOrigins = new Set(
  [
    "http://localhost:5173",
    "http://localhost:3000",
    config.corsOrigin,
    config.vercelUrl,
  ]
    .flatMap((origin) => (origin ? origin.split(",") : []))
    .map((origin) => origin.trim())
    .filter(Boolean)
);

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Dynamic origin allowance for development / Cloud Workstations
    if (!isProduction) {
      return callback(null, true);
    }

    if (!origin || corsOrigins.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
        /^https?:\/\/[a-z0-9-]+\.app\.github\.dev(:\d+)?$/i.test(origin) ||
        /^https?:\/\/[a-z0-9-]+\.github\.dev(:\d+)?$/i.test(origin) ||
        /^https?:\/\/[a-z0-9-]+\.vercel\.app(:\d+)?$/i.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});
