import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { config } from "./backend/src/config/index.js";
import { validateEnv } from "./backend/src/config/validate.js";
import { initSentry, initSentryErrorHandler } from "./backend/src/config/sentry.js";
import apiRoutes from "./backend/src/routes/index.js";
import { corsMiddleware } from "./backend/src/middleware/cors.js";
import { errorHandler } from "./backend/src/middleware/error.js";
import { initQueryLogger } from "./backend/src/middleware/queryLogger.js";
import { logger } from "./backend/src/utils/logger.js";

// Use process.cwd() to avoid ESM path issues
const app = express();
const httpServer = http.createServer(app);

// Initialize Sentry
initSentry(app);

// Middlewares
app.use(corsMiddleware);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
initQueryLogger();

// --- 1. API ROUTES (Always enabled) ---
app.use("/api", apiRoutes);

// --- 2. ENVIRONMENT-SPECIFIC STATIC/SPA HANDLING ---
if (config.nodeEnv === "production") {
  // Use process.cwd() to resolve path to client folder
  const distPath = path.resolve(process.cwd(), "dist", "client");
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Error Handling (Must be after routes)
initSentryErrorHandler(app);
app.use(errorHandler);

async function startServer() {
  validateEnv();
  
  if (config.nodeEnv !== "production") {
    // Development mode: Vite handles SPA routing and HMR
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server: httpServer },
      },
      appType: "spa", 
    });
    app.use(vite.middlewares);
  }

  const port = config.port;
  httpServer.listen(port, "0.0.0.0", () => {
    logger.info(`Server running on http://localhost:${port} [${config.nodeEnv}]`);
  });
}

// Prevent double-start in test or Vercel
if (!process.env.VERCEL && process.env.NODE_ENV !== "test") {
  startServer();
}

export default app;