import { type QueryInterface } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.sequelize.query("CREATE SCHEMA IF NOT EXISTS nexus_finance");
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.sequelize.query("DROP SCHEMA IF EXISTS nexus_finance");
};
