// models/Mahasiswa.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const Mahasiswa = db.define("Mahasiswa", {
  nim: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token_kelas: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
  },
}, {
    freezeTableName: true
});

User.hasOne(Mahasiswa, { foreignKey: "userId", as: "mahasiswa" });
Mahasiswa.belongsTo(User, { foreignKey: "userId", as: "user" });

export default Mahasiswa;
