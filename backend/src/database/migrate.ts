import migrationService from "../services/migration.service";
async function migrate() {
     await migrationService.runSystemMigrations();
     process.exit(0);
}

migrate();
