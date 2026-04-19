import { Sequelize } from "sequelize";
import logger from "../config/logger";
import migrationService from "./migration.service";

class DatabaseService {
     private nexusFinanceSchemaConnection: Sequelize | null = null;
     async initializeNexusFinanceSchemaConnection() {
          try {
               this.nexusFinanceSchemaConnection = new Sequelize(
                    process.env.DATABASE_NAME!,
                    process.env.DATABASE_USER!,
                    process.env.DATABASE_PASSWORD!,
                    {
                         dialect: "postgres",
                         dialectOptions: {
                              keepAlive: true,
                         },
                         pool: {
                              max: 20,
                              min: 4,
                              acquire: 30000,
                              idle: 10000,
                              evict: 15000,
                         },
                         retry: {
                              max: 3,
                         },
                         host: process.env.DATABASE_HOST!,
                         port: parseInt(process.env.DATABASE_PORT || "5432"),
                         logging: (message) => logger.info(message),
                         ssl: process.env.NODE_ENV === "production" ? true : false,
                         schema: "nexus_finance",
                    },
               );
               await this.nexusFinanceSchemaConnection.authenticate();
               await this.registerModels(this.nexusFinanceSchemaConnection);
               await migrationService.setConnection(this.nexusFinanceSchemaConnection);
               logger.info("Nexus Finance schema connection initialized", {
                    environment: process.env.NODE_ENV,
               });
          } catch (error: unknown) {
               if (error instanceof Error) {
                    logger.error("Failed to initialize Nexus Finance schema connection", {
                         error: error.message,
                         stack: error.stack,
                    });
                    throw error;
               }
               throw error;
          }
     }

     // eslint-disable-next-line @typescript-eslint/no-unused-vars
     async registerModels(connection: Sequelize) {
          // todo: link the models and associations here
     }
}

export default new DatabaseService();
