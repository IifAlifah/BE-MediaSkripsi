// models/Dosen.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";
import User from "./UserModel.js";

const Dosen = db.define("Dosen", {
  nip: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  kkm: {
    type: DataTypes.INTEGER,
    defaultValue: 75,
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

User.hasOne(Dosen, { foreignKey: "userId" });
Dosen.belongsTo(User, { foreignKey: "userId" });

export default Dosen;
