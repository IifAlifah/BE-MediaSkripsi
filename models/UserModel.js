// models/User.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";

const User = db.define("User", {
  nama: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  refresh_token: {
    type: DataTypes.TEXT
},
  role: {
    type: DataTypes.ENUM("mahasiswa", "dosen"),
    allowNull: false,
  }
},{
    freezeTableName: true
});

export default User;
