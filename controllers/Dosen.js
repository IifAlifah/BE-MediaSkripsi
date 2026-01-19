import Dosen from "../models/DosenModel.js";
import Mahasiswa from "../models/MahasiswaModel.js";
import Nilai from "../models/NilaiModel.js";

export const getTokenKelas = async (req, res) => {
    try {
      if (!req.user) {
        return res.status(400).send('User tidak ditemukan');
      }
  
      const userId = req.user.userId; // Atau dari token jika menggunakan JWT
      
      // Mencari dosen berdasarkan userId
      const dosen = await Dosen.findOne({
        where: { userId },
      });
  
      if (!dosen) {
        return res.status(404).send('Dosen tidak ditemukan');
      }
  
      // Mengembalikan response dengan token kelas dan nilai KKM
      res.status(200).json({
        tokenKelas: dosen.token,
        kkm: dosen.kkm,
      });
    } catch (error) {
      console.error("Error in getTokenKelas:", error);
      res.status(500).send('Terjadi kesalahan saat mengambil token kelas');
    }
  };
  

// Fungsi untuk memperbarui nilai KKM
export const updateKkm = async (req, res) => {
    try {
      const dosenId = req.user.userId; // ID dosen diambil dari token
      const { kkm } = req.body; // Nilai KKM baru yang dikirimkan oleh frontend
  
      // Mencari data dosen berdasarkan userId
      const dosen = await Dosen.findOne({
        where: { userId: dosenId }
      });
  
      if (!dosen) {
        return res.status(404).json({ message: "Dosen tidak ditemukan" });
      }
  
      // Memperbarui nilai KKM pada dosen
      dosen.kkm = kkm;
      await dosen.save();
  
      // Mengembalikan response dengan nilai KKM yang telah diperbarui
      res.status(200).json({ message: "Nilai KKM berhasil diperbarui", kkm: dosen.kkm });
    } catch (error) {
      console.error("Error in updateKkm:", error);
      res.status(500).json({ message: "Terjadi kesalahan server", error });
    }
  };
  
export const getJumlahMahasiswa = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Temukan dosen berdasarkan userId
    const dosen = await Dosen.findOne({
      where: { userId }
    });

    if (!dosen) {
      return res.status(404).json({ message: "Dosen tidak ditemukan" });
    }

    // Asumsikan token pada dosen sama dengan kolom 'tokenKelas' di Mahasiswa
    const jumlah = await Mahasiswa.count({
      where: { token_kelas: dosen.token }
    });

    res.status(200).json({ jumlahMahasiswa: jumlah });
  } catch (error) {
    console.error("Error in getJumlahMahasiswa:", error);
    res.status(500).json({ message: "Terjadi kesalahan saat mengambil jumlah mahasiswa" });
  }
};

// export const getStatistikNilai = async (req, res) => {
//   try {
//     const { tokenKelas } = req.user; // Ambil token kelas dari token login

//     const hasil = await Nilai.findAll({
//       attributes: [
//         [Sequelize.fn('AVG', Sequelize.col('nilai')), 'rataRata'],
//         [Sequelize.fn('MAX', Sequelize.col('nilai')), 'nilaiTertinggi'],
//         [Sequelize.fn('MIN', Sequelize.col('nilai')), 'nilaiTerendah']
//       ],
//       include: [{
//         model: Mahasiswa,
//         where: { tokenKelas },
//         attributes: [] // tidak perlu ambil data mahasiswa
//       }],
//       raw: true
//     });

//     res.json({
//       rataRata: parseFloat(hasil[0].rataRata).toFixed(2),
//       nilaiTertinggi: hasil[0].nilaiTertinggi,
//       nilaiTerendah: hasil[0].nilaiTerendah
//     });

//   } catch (error) {
//     console.error("Gagal mengambil statistik nilai:", error);
//     res.status(500).json({ msg: "Terjadi kesalahan pada server" });
//   }
// };