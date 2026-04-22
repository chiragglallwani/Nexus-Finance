import express, { type RequestHandler } from "express";
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
import { authMiddleware, csrfProtection } from "./middleware/auth/authMiddleware";
import { startTransactionWorker } from "./workers/transaction.worker";
import authRoutes from "./routes/auth/auth.route";
import vaultRoutes from "./routes/vaults/vault.route";
import tenantBalanceRoutes from "./routes/tenantBalance/tenantBalance.route";
import tenantInvoiceRoutes from "./routes/tenantInvoices/tenantInvoice.route";
import uploadRoutes from "./routes/imports/upload.routes";
import userRoutes from "./routes/user/user.route";
import featuresRoutes from "./routes/features/features.route";

dotenv.config({ path: `.env.${process.env.NODE_ENV || "local"}` });

const PORT = process.env.PORT;

async function initializeApp() {
     try {
          await migrationService.runSchemaMigrations();
          await databaseService.initializeNexusFinanceSchemaConnection();
          await migrationService.runSystemMigrations();
          logger.info("Database initialized completed");

          startTransactionWorker();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
     } catch (error: any) {
          logger.error("Failed to initialize application", {
               error: error.message,
               stack: error.stack,
          });
          throw error;
     }
}

initializeApp();
eventService.registerHandlers();

const limiter = rateLimit({
     windowMs: 3 * 60 * 1000,
     max: 100,
     message: "Too many requests from this IP, please try again after 15 minutes",
});

const app = express();

app.use(helmet());
app.use(
     cors({
          origin:
               process.env.NODE_ENV === "production"
                    ? process.env.NEXT_PUBLIC_API_URL
                    : "http://localhost:3000",
          credentials: true,
          exposedHeaders: ["Content-Disposition", "Content-Type"],
     }),
);
app.use(limiter);
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());
app.use(asyncStorageMiddleware);
app.use(requestLogger);

app.get("/health", (_req, res) => {
     res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/v1/auth", authRoutes);

function mountProtectedRoutes(
     app: express.Application,
     serviceName: string,
     router: RequestHandler,
) {
     app.use(`/api/v1/${serviceName}`, csrfProtection, authMiddleware, router);
}

mountProtectedRoutes(app, "vaults", vaultRoutes);
mountProtectedRoutes(app, "balance", tenantBalanceRoutes);
mountProtectedRoutes(app, "invoices", tenantInvoiceRoutes);
mountProtectedRoutes(app, "uploads", uploadRoutes);
mountProtectedRoutes(app, "user", userRoutes);
mountProtectedRoutes(app, "features", featuresRoutes);

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
