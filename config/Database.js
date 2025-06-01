import { Sequelize } from "sequelize";

const db = new Sequelize('skripsi_media', 'root', '', {
    host: "localhost",
    dialect: "mysql"
}); 

export default db;
