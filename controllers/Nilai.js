import Nilai from "../models/NilaiModel.js";
import Mahasiswa from "../models/MahasiswaModel.js";
import User from "../models/UserModel.js";
import Dosen from "../models/DosenModel.js";
import { Op } from "sequelize";

// Nilai terakhir per mahasiswa
// export const getNilaiTerakhirPerKuis = async (req, res) => {
//   const { jenisKuis } = req.params;
//   const userId = req.user.userId;

//   try {
//     const dosen = await Dosen.findOne({ where: { userId } });
//     if (!dosen) return res.status(403).json({ message: "Dosen tidak ditemukan" });

//     const semuaNilai = await Nilai.findAll({
//       where: { jenis_kuis: jenisKuis },
//       include: [
//         {
//           model: Mahasiswa,
//           as: "Mahasiswa",
//           where: { token_kelas: dosen.token },
//           include: {
//             model: User,
//             as: "user",
//             attributes: ['nama']
//           }
//         }
//       ],
//       order: [['nilai', 'DESC']]
//     });

//     const mapTerakhir = new Map();
//     semuaNilai.forEach(n => {
//       if (!mapTerakhir.has(n.mahasiswaId)) mapTerakhir.set(n.mahasiswaId, n);
//     });

//     res.json([...mapTerakhir.values()]);
//   } catch (err) {
//     res.status(500).json({ message: "Gagal ambil nilai terakhir", error: err.message });
//   }
// };

export const getNilaiPertamaLulusPerKuis = async (req, res) => {
  const { jenisKuis } = req.params;
  const userId = req.user.userId;

  try {
    // Cari dosen sesuai user login
    const dosen = await Dosen.findOne({ where: { userId } });
    if (!dosen) return res.status(403).json({ message: "Dosen tidak ditemukan" });

    const KKM = dosen.kkm; // Ambil KKM dari dosen

    if (KKM === undefined || KKM === null) {
      return res.status(400).json({ message: "KKM belum ditetapkan oleh dosen" });
    }

    // Ambil nilai yang memenuhi KKM dan jenis kuis sesuai
    const semuaNilaiLulus = await Nilai.findAll({
      where: {
        jenis_kuis: jenisKuis,
        nilai: { [Op.gte]: KKM },
      },
      include: [
        {
          model: Mahasiswa,
          as: "Mahasiswa",
          where: { token_kelas: dosen.token },
          include: {
            model: User,
            as: "user",
            attributes: ["nama"],
          },
        },
      ],
      order: [["createdAt", "ASC"]], // Urutkan dari yang paling awal
    });

    // Ambil nilai pertama yang lulus untuk tiap mahasiswa
    const nilaiPertamaLulus = new Map();
    semuaNilaiLulus.forEach((n) => {
      if (!nilaiPertamaLulus.has(n.mahasiswaId)) {
        nilaiPertamaLulus.set(n.mahasiswaId, n);
      }
    });

    res.status(200).json([...nilaiPertamaLulus.values()]);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data nilai pertama yang lulus",
      error: error.message,
    });
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
    const { mahasiswaId, jenisKuis, nilai, benar, salah, waktu_pengerjaan } = req.body;

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
      salah,
      waktu_pengerjaan
    });

    res.status(201).json({ message: "Nilai berhasil disimpan" });
  } catch (error) {
    res.status(500).json({ message: "Gagal menyimpan nilai", error: error.message });
  }
};

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
      waktu_pengerjaan: nilaiTerbaru.waktu_pengerjaan, 
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

export const getStatistikNilai = async (req, res) => {
  const userId = req.user.userId;

  const jenisKuisToLabel = {
    "Pendahuluan": "kuis1",
    "Mengakses Elemen": "kuis2",
    "Manipulasi Konten": "kuis3",
    "Event DOM": "kuis4",
    "Form DOM": "kuis5",
    "Evaluasi": "evaluasi"
  };

  try {
    const dosen = await Dosen.findOne({ where: { userId } });
    if (!dosen) return res.status(403).json({ message: "Dosen tidak ditemukan" });

    const semuaNilai = await Nilai.findAll({
      include: [
        {
          model: Mahasiswa,
          as: "Mahasiswa",
          where: { token_kelas: dosen.token }
        }
      ],
      attributes: ["jenis_kuis", "nilai"] // ganti dari judul_kuis ke jenis_kuis
    });

    const statistik = {};

    semuaNilai.forEach(({ jenis_kuis, nilai }) => {
      const label = jenisKuisToLabel[jenis_kuis];
      if (!label) return;
      if (!statistik[label]) statistik[label] = [];
      statistik[label].push(nilai);
    });

    const hasil = {};
    for (const label in statistik) {
      const nilaiList = statistik[label];
      const total = nilaiList.reduce((a, b) => a + b, 0);
      hasil[label] = {
        rata: Number((total / nilaiList.length).toFixed(2)),
        min: Math.min(...nilaiList),
        max: Math.max(...nilaiList)
      };
    }

    res.status(200).json(hasil);
  } catch (error) {
    res.status(500).json({ message: "Gagal menghitung statistik nilai", error: error.message });
  }
};


