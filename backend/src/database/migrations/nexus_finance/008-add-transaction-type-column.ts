import { type QueryInterface, DataTypes } from "sequelize";

const TABLES = [
     { tableName: "individual_transactions", schema: "nexus_finance" },
     { tableName: "business_transactions", schema: "nexus_finance" },
];

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     for (const table of TABLES) {
          await queryInterface.addColumn(table, "transaction_type", {
               type: DataTypes.ENUM("INFLOW", "OUTFLOW"),
               allowNull: true,
          });
     }
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
     for (const table of TABLES) {
          await queryInterface.removeColumn(table, "transaction_type");
     }
};
