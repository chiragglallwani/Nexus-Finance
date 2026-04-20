import { Sequelize } from "sequelize";
import logger from "../config/logger";
import migrationService from "./migration.service";
import Tenants from "../database/models/Tenants";
import Users from "../database/models/Users";
import IndividualTransactions from "../database/models/IndividualTransactions";
import BusinessTransactions from "../database/models/BusinessTransactions";
import Vaults from "../database/models/Vaults";
import TenantBalance from "../database/models/TenantBalance";
import TenantInvoices from "../database/models/TenantInvoices";
import Jobs from "../database/models/Jobs";
import BaseModel from "../database/models/BaseModel";

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

     async registerModels(connection: Sequelize) {
          Tenants.initModel(connection);
          Users.initModel(connection);
          IndividualTransactions.initModel(connection);
          BusinessTransactions.initModel(connection);
          Vaults.initModel(connection);
          TenantBalance.initModel(connection);
          TenantInvoices.initModel(connection);
          Jobs.initModel(connection);
          BaseModel.initWithTenant({}, { sequelize: connection });

          const models = {
               Tenants,
               Users,
               IndividualTransactions,
               BusinessTransactions,
               Vaults,
               TenantBalance,
               TenantInvoices,
               Jobs,
               BaseModel,
          };
          Tenants.associate(models);
          Users.associate(models);
          IndividualTransactions.associate(models);
          BusinessTransactions.associate(models);
          Vaults.associate(models);
          TenantBalance.associate(models);
          TenantInvoices.associate(models);
          Jobs.associate(models);
     }

     async cleanup() {
          if (this.nexusFinanceSchemaConnection) {
               await this.nexusFinanceSchemaConnection.close();
          }
     }
}

export default new DatabaseService();
