import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const db = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    dialectOptions: {
      // Jika perlu SSL bisa diaktifkan
      // ssl: { rejectUnauthorized: false }
    },
    logging: false, // matikan log SQL kalau mau
  }
);

export default db;
