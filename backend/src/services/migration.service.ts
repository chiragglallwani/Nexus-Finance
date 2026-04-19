import { Umzug, SequelizeStorage } from "umzug";
import logger from "../config/logger";
import { Sequelize } from "sequelize";

class MigrationService {
     private connection: Sequelize | null = null;

     setConnection(connection: Sequelize) {
          this.connection = connection;
     }

     async initailizePublicSchemaConnection() {
          try {
               this.setConnection(
                    new Sequelize(
                         process.env.DATABASE_NAME!,
                         process.env.DATABASE_USER!,
                         process.env.DATABASE_PASSWORD!,
                         {
                              dialect: "postgres",
                              host: process.env.DATABASE_HOST!,
                              port: parseInt(process.env.DATABASE_PORT || "5432"),
                              logging: (message: string) => logger.info(message),
                              ssl: process.env.NODE_ENV === "production" ? true : false,
                         },
                    ),
               );
               await this.connection?.authenticate();
          } catch (error) {
               logger.error(`${process.env.DATABASE_NAME} connection error`, { error });
               logger.error("Failed to initialize public schema connection", { error });
               throw error;
          }
     }

     createUmzug(sequelize: Sequelize, migrationType: "schema" | "nexus_finance") {
          const migrations = {
               glob:
                    migrationType === "schema"
                         ? "src/database/migrations/schema/*.ts"
                         : "src/database/migrations/nexus_finance/*.ts",
               cwd: process.cwd(),
          };

          return new Umzug({
               migrations,
               context: sequelize.getQueryInterface(),
               storage: new SequelizeStorage({ sequelize }),
               logger: logger,
          });
     }

     async runSchemaMigrations() {
          await this.initailizePublicSchemaConnection();
          const umzug = this.createUmzug(this.connection!, "schema");
          await umzug.up();
          await this.connection?.close();
     }

     async runSystemMigrations() {
          const umzug = this.createUmzug(this.connection!, "nexus_finance");
          await umzug.up();
     }
}

export default new MigrationService();
