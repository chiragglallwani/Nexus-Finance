import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import logger from "./config/logger";
import migrationService from "./services/migration.service";
import databaseService from "./services/database.service";
import eventService from "./events/event.service";
import { asyncStorageMiddleware } from "./utils/asyncStorage";
import { requestLogger } from "./middleware/logging/requestLogger";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "local"}` });

const PORT = process.env.PORT;

async function initializeDatabase() {
     try {
          await migrationService.runSchemaMigrations();
          await databaseService.initializeNexusFinanceSchemaConnection();
          await migrationService.runSystemMigrations();
          logger.info("Database initialized completed");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
     } catch (error: any) {
          logger.error("Failed to initialize database", {
               error: error.message,
               stack: error.stack,
          });
          throw error;
     }
}

initializeDatabase();
eventService.registerHandlers();

const limiter = rateLimit({
     windowMs: 5 * 60 * 1000, // 5 minutes
     max: 100, // limit each IP to 100 requests per windowMs
     message: "Too many requests from this IP, please try again after 15 minutes",
});

const app = express();

app.use(helmet());
app.use(cors());
app.use(limiter);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());
app.use(asyncStorageMiddleware);
app.use(requestLogger);

app.get("/health", (_req, res) => {
     res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// --- Protected routes go below this line ---
// Apply tenant isolation to all /api/* routes

// Placeholder routers — wire actual routers here:
// app.use("/api/transactions", transactionRouter);
// app.use("/api/individual", requireTenantType("INDIVIDUAL"), individualRouter);
// app.use("/api/business", requireTenantType("BUSINESS"), businessRouter);
// app.use("/api/jobs", jobsRouter);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
     if (err.status === 429) {
          logger.warn(`Too many requests from ${req.ip}`, {
               url: req.originalUrl,
               method: req.method,
               status: 429,
               message: "Too many requests",
          });
          res.status(429).json({ message: "Too many requests" });
          return;
     }
     logger.error("Unhandled error", {
          error: err.message || err,
          stack: err.stack,
          url: req.originalUrl,
          method: req.method,
     });
     res.status(err.status || 500).json({
          status: "failure",
          message: process.env.NODE_ENV === "production" ? "Internal server error" : err.message,
     });
});

app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

export default app;
