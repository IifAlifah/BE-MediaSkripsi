import Nilai from "../models/NilaiModel.js";
import Mahasiswa from "../models/MahasiswaModel.js";
import User from "../models/UserModel.js";
import Dosen from "../models/DosenModel.js";
import { Op } from "sequelize";

// Nilai terakhir per mahasiswa
export const getNilaiTerakhirPerKuis = async (req, res) => {
  const { jenisKuis } = req.params;
  const userId = req.user.userId;

  try {
    const dosen = await Dosen.findOne({ where: { userId } });
    if (!dosen) return res.status(403).json({ message: "Dosen tidak ditemukan" });

    const semuaNilai = await Nilai.findAll({
      where: { jenis_kuis: jenisKuis },
      include: [
        {
          model: Mahasiswa,
          as: "Mahasiswa",
          where: { token_kelas: dosen.token },
          include: {
            model: User,
            as: "user",
            attributes: ['nama']
          }
        }
      ],
      order: [['nilai', 'DESC']]
    });

    const mapTerakhir = new Map();
    semuaNilai.forEach(n => {
      if (!mapTerakhir.has(n.mahasiswaId)) mapTerakhir.set(n.mahasiswaId, n);
    });

    res.json([...mapTerakhir.values()]);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil nilai terakhir", error: err.message });
  }
};

// Detail riwayat mahasiswa
export const getDetailNilaiMahasiswa = async (req, res) => {
  const { jenisKuis, mahasiswaId } = req.params;
  const userId = req.user.userId;

  try {
    const dosen = await Dosen.findOne({ where: { userId } });
    if (!dosen) return res.status(403).json({ message: "Dosen tidak ditemukan" });

    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);
    if (!mahasiswa || mahasiswa.token_kelas !== dosen.token) {
      return res.status(403).json({ message: "Akses ditolak. Mahasiswa tidak sesuai token kelas dosen." });
    }

    const riwayat = await Nilai.findAll({
      where: {
        jenis_kuis: jenisKuis,
        mahasiswaId
      },
      include: [
        {
          model: Mahasiswa,
          as: "Mahasiswa",
          include: {
            model: User,
            as: "user",
            attributes: ['nama']
          }
        }
      ],
      order: [['waktu_pengerjaan', 'DESC']]
    });

    res.json(riwayat);
  } catch (err) {
    res.status(500).json({ message: "Gagal ambil detail nilai", error: err.message });
  }
};


// Hapus nilai
export const deleteNilai = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const dosen = await Dosen.findOne({ where: { userId } });
    if (!dosen) return res.status(403).json({ message: "Dosen tidak ditemukan" });

    const nilai = await Nilai.findByPk(id, {
      include: {
        model: Mahasiswa,
        as: "Mahasiswa",
      },
    });

    if (!nilai) {
      return res.status(404).json({ message: "Data nilai tidak ditemukan" });
    }

    if (nilai.Mahasiswa.token_kelas !== dosen.token) {
      return res.status(403).json({ message: "Akses ditolak. Mahasiswa tidak termasuk kelas dosen." });
    }

    await nilai.destroy();

    res.status(200).json({ message: "Nilai berhasil dihapus" });
  } catch (err) {
    console.log("Error deleteNilai:", err);  // Menambahkan log error
    res.status(500).json({ message: "Terjadi kesalahan server", error: err.message });
  }
};


// Simpan nilai
export const saveNilai = async (req, res) => {
  try {
    const { mahasiswaId, jenisKuis, nilai, benar, salah } = req.body;

    if (!mahasiswaId || !jenisKuis || nilai === undefined) {
      return res.status(400).json({ message: "Data tidak lengkap" });
    }

    const mahasiswa = await Mahasiswa.findByPk(mahasiswaId);
    if (!mahasiswa) {
      return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
    }

    await Nilai.create({
      mahasiswaId,
      jenis_kuis: jenisKuis,
      nilai,
      benar,
      salah
    });

    res.status(201).json({ message: "Nilai berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan nilai", error: error.message });
  }
};

// export const getNilaiMencapaiKKM = async (req, res) => {
//   const { jenisKuis } = req.params;
//   const userId = req.user.userId; // mahasiswa login
//   const KKM = 70;

//   try {
//     // Ambil data mahasiswa berdasarkan userId login
//     const mahasiswa = await Mahasiswa.findOne({
//       where: { userId }
//     });

//     if (!mahasiswa) {
//       return res.status(404).json({ message: "Mahasiswa tidak ditemukan" });
//     }

//     // Cari nilai-nilai mahasiswa yang mencapai KKM
//     const nilaiLulus = await Nilai.findAll({
//       where: {
//         jenis_kuis: jenisKuis,
//         mahasiswaId: mahasiswa.id,
//         nilai: {
//           [Op.gte]: KKM
//         }
//       },
//       order: [['waktu_pengerjaan', 'ASC']],
//       include: {
//         model: Mahasiswa,
//         as: "Mahasiswa",
//         include: {
//           model: User,
//           as: "user",
//           attributes: ['nama']
//         }
//       }
//     });

//     res.status(200).json(nilaiLulus);
//   } catch (error) {
//     res.status(500).json({ message: "Gagal mengambil data nilai", error: error.message });
//   }
// };

export const getNilaiByMahasiswaAndKuis = async (req, res) => {
  const { mahasiswaId, jenisKuis } = req.query;

  if (!mahasiswaId || !jenisKuis) {
    return res.status(400).json({ message: "mahasiswaId dan jenisKuis diperlukan" });
  }

  try {
    const nilaiTerbaru = await Nilai.findOne({
      where: {
        mahasiswaId,
        jenis_kuis: jenisKuis,
      },
      order: [['createdAt', 'DESC']], // Mengambil nilai paling baru
    });

    if (!nilaiTerbaru) {
      return res.status(404).json({ message: "Nilai tidak ditemukan" });
    }

    res.json({
      nilai: nilaiTerbaru.nilai,
      benar: nilaiTerbaru.benar,
      salah: nilaiTerbaru.salah,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil nilai", error: error.message });
  }
};


// Di controllers/nilaiController.js
export const getNilaiTerbaruByMahasiswaAndKuis = async (req, res) => {
  const { mahasiswaId, jenisKuis } = req.query;

  if (!mahasiswaId || !jenisKuis) {
    return res.status(400).json({ message: "mahasiswaId dan jenisKuis diperlukan" });
  }

  try {
    const nilaiTerbaru = await Nilai.findOne({
      where: {
        mahasiswaId,
        jenis_kuis: jenisKuis,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!nilaiTerbaru) {
      return res.status(404).json({ message: "Nilai belum tersedia" });
    }

    res.json({
      nilai: nilaiTerbaru.nilai,
      benar: nilaiTerbaru.benar,
      salah: nilaiTerbaru.salah,
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil nilai", error: error.message });
  }
};


export const getAllNilai = async (req, res) => {
  try {
    const nilai = await Nilai.findAll({
      include: [
        {
          model: Mahasiswa,
          attributes: ["nim", "userId"],
          include: [
            {
              model: User,
              attributes: ["nama"],
            },
          ],
        },
      ],
      order: [
        [{ model: Mahasiswa }, "nim", "ASC"],
        ["jenis_kuis", "ASC"], // sesuaikan dengan nama kolom yang benar
      ],
    });

    if (!nilai || nilai.length === 0) {
      return res.status(404).json({ message: "Data nilai belum tersedia" });
    }

    res.status(200).json(nilai);
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil data nilai", error: error.message });
  }
};

