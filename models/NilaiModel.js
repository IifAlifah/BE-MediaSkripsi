// models/QuizScore.js
import { DataTypes } from "sequelize";
import db from "../config/Database.js";
import Mahasiswa from "./MahasiswaModel.js";

const Nilai = db.define('nilai', {
    mahasiswaId: {  // Mengganti userId menjadi mahasiswaId
        type: DataTypes.INTEGER,
        allowNull: false
    },
    jenis_kuis: {
        type: DataTypes.STRING,
        allowNull: false
    },
    nilai: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    waktu_pengerjaan: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    benar: {
        type: DataTypes.INTEGER
    },
    salah: {
        type: DataTypes.INTEGER
    }
}, {
    freezeTableName: true
});

// Relasi antara Mahasiswa dan Nilai
Mahasiswa.hasMany(Nilai, { foreignKey: 'mahasiswaId' });  // Mahasiswa memiliki banyak Nilai
Nilai.belongsTo(Mahasiswa, { foreignKey: 'mahasiswaId' });  // Nilai berhubungan dengan Mahasiswa

export default Nilai;
