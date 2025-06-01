import Mahasiswa from "../models/MahasiswaModel.js";
import User from "../models/UserModel.js";
import Dosen from "../models/DosenModel.js"; // Tambahkan import ini
import bcrypt from "bcrypt";
import { Op } from "sequelize";

export const getMahasiswaByDosenToken = async (req, res) => {
  try {
    // Ambil userId dari JWT payload (hasil dari middleware verifikasi token)
    const userId = req.user.userId;

    // Cari token milik dosen berdasarkan userId
    const dosen = await Dosen.findOne({ where: { userId } });

    if (!dosen) {
      return res.status(403).json({ message: "Dosen tidak ditemukan" });
    }

    // Ambil semua mahasiswa yang token_kelas-nya sama dengan token dosen
    const mahasiswa = await Mahasiswa.findAll({
      where: {
        token_kelas: dosen.token
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['nama'],
        },
      ],
      attributes: ['id', 'nim', 'progress', 'token_kelas'],
    });

    res.status(200).json(mahasiswa);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMahasiswaById = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, email, password, nim } = req.body;

    // Cek apakah mahasiswa ada
    const mahasiswa = await Mahasiswa.findByPk(id, {
      include: [
        {
          model: User,
          as: "user",
        },
      ],
    });

    if (!mahasiswa) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
    }

    // Update data user
    if (nama) mahasiswa.user.nama = nama;
    if (email) mahasiswa.user.email = email;
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      mahasiswa.user.password = hashedPassword;
    }

    // Update nim di tabel Mahasiswa
    if (nim) mahasiswa.nim = nim;

    // Simpan perubahan
    await mahasiswa.user.save();
    await mahasiswa.save();

    res.status(200).json({ message: "Data mahasiswa berhasil diperbarui" });
  } catch (error) {
    console.error("Error updating mahasiswa:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteMahasiswaById = async (req, res) => {
  try {
    const { id } = req.params;

    const mahasiswa = await Mahasiswa.findByPk(id);

    if (!mahasiswa) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
    }

    await mahasiswa.destroy();

    res.status(200).json({ message: "Data mahasiswa berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getKkmByTokenKelas = async (req, res) => {
  try {
    const { mahasiswaId } = req.params; // Ambil mahasiswaId dari parameter

    // Cari mahasiswa berdasarkan mahasiswaId
    const mahasiswa = await Mahasiswa.findOne({
      where: { id: mahasiswaId }
    });

    if (!mahasiswa) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
    }

    // Cari dosen berdasarkan token_kelas yang dimiliki mahasiswa
    const dosen = await Dosen.findOne({
      where: { token: mahasiswa.token_kelas }
    });

    if (!dosen) {
      return res.status(404).json({ message: "Dosen untuk token_kelas ini tidak ditemukan" });
    }

    // Ambil kkm dari dosen yang terkait dengan mahasiswa
    const kkm = dosen.kkm;

    return res.status(200).json({ kkm });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

export const getMahasiswaById = async (req, res) => {
  try {
    const mahasiswa = await Mahasiswa.findByPk(req.params.id, {
      include: [{
        model: User,
        as: "user"
      }]
    });

    if (!mahasiswa) return res.status(404).json({ message: "Tidak ditemukan" });

    res.status(200).json(mahasiswa);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getProgressMahasiswa = async (req, res) => {
  try {
    const mahasiswaId = req.user.mahasiswaId;
    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);

    if (!mahasiswa) 
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });

    // Pastikan progress tidak null
    const progress = mahasiswa.progress ?? 0;

    res.status(200).json({ progress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProgress = async (req, res) => {
  try {
    const mahasiswaId = req.user.mahasiswaId;

    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);
    if (!mahasiswa) 
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });

    // Jika progress null/undefined, set 0 dulu
    mahasiswa.progress = (mahasiswa.progress ?? 1) + 1;
    await mahasiswa.save();

    res.status(200).json({ message: "Progress berhasil diperbarui", progress: mahasiswa.progress });
  } catch (error) {
    console.error("Error update progress:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getMahasiswaSelesai = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Cari dosen berdasarkan token JWT
    const dosen = await Dosen.findOne({ where: { userId } });
    if (!dosen) {
      return res.status(403).json({ message: "Dosen tidak ditemukan" });
    }

    // Ambil mahasiswa yang token_kelas-nya sama dan progress >= 23
    const mahasiswaSelesai = await Mahasiswa.findAll({
      where: {
        token_kelas: dosen.token,
        progress: {
          [Op.gte]: 23
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['nama'],
        },
      ],
      attributes: ['id', 'nim', 'progress'],
    });

    res.status(200).json(mahasiswaSelesai);
  } catch (error) {
    console.error("Error getMahasiswaSelesai:", error);
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};

// export const getProgressPersenMahasiswa = async (req, res) => {
//   try {
//     const mahasiswaId = req.user.mahasiswaId; // Ambil dari token (middleware)
//     const TOTAL_LEVEL = 23; // Jumlah level maksimal atau total halaman

//     const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);

//     if (!mahasiswa) {
//       return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
//     }

//     const progress = mahasiswa.progress ?? 0;
//     const percentage = Math.round((progress / TOTAL_LEVEL) * 100);

//     return res.status(200).json({
//       progress,
//       total: TOTAL_LEVEL,
//       percentage
//     });
//   } catch (error) {
//     console.error("Error getProgressPersenMahasiswa:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

