import express from "express";
import { getUsers, Login, Logout, Register } from "../controllers/Users.js";
import { 
  getTokenKelas, 
  updateKkm,
  getJumlahMahasiswa,
  getStatistikNilai
 } from "../controllers/Dosen.js";
import { 
  getMahasiswaByDosenToken, 
  updateMahasiswaById, 
  getMahasiswaById,
  deleteMahasiswaById,
  getKkmByTokenKelas,
  getProgressMahasiswa,
  updateProgress,
  getMahasiswaSelesai
 } from "../controllers/Mahasiswa.js";
import { verifyToken } from "../middleware/VerifyToken.js"; // Pastikan middleware ini digunakan
import { refreshToken } from "../controllers/RefreshToken.js";
import {
  getNilaiTerakhirPerKuis,
  getDetailNilaiMahasiswa,
  deleteNilai,
  saveNilai,
  getNilaiTerbaruByMahasiswaAndKuis,
  getNilaiByMahasiswaAndKuis,
  getAllNilai
} from "../controllers/Nilai.js";

const router = express.Router();

// Auth & Users
router.get('/users', verifyToken, getUsers); // Verifikasi token untuk mengambil data users
router.post('/users', Register);
router.post('/login', Login);
router.get('/token', refreshToken);
router.delete('/logout', Logout);


// Nilai
router.get('/nilai/jenis/:jenisKuis', verifyToken, getNilaiTerakhirPerKuis); // ← gunakan string
router.get('/nilai/jenis/:jenisKuis/mahasiswa/:mahasiswaId',verifyToken, getDetailNilaiMahasiswa);
router.delete('/nilai/:id', verifyToken, deleteNilai);
router.post("/nilai", saveNilai);
router.get("/nilai/terbaru", getNilaiTerbaruByMahasiswaAndKuis);
router.get('/nilai/:jenisKuis', verifyToken, getNilaiByMahasiswaAndKuis);
router.get("/nilai", verifyToken, getAllNilai);

// Progress
router.get("/progress", verifyToken, getProgressMahasiswa);
router.patch("/progress/update", verifyToken, updateProgress);
router.get("/progress/selesai", verifyToken, getMahasiswaSelesai);
// router.get('/progress/persen', verifyToken, getProgressPersenMahasiswa);

// Token dan KKM Dosen
router.get("/token-kelas", verifyToken, getTokenKelas);  // Menambahkan middleware verifyToken
router.post("/update-kkm", verifyToken, updateKkm);      // Menambahkan middleware verifyToken
router.get("/jumlah-mahasiswa", verifyToken, getJumlahMahasiswa);
router.get('/statistik-nilai', verifyToken, getStatistikNilai);

// Dosen
router.get("/mahasiswa", verifyToken, getMahasiswaByDosenToken);
router.put("/mahasiswa/:id", verifyToken, updateMahasiswaById);  
router.get('/mahasiswa/:id', getMahasiswaById);
router.delete("/mahasiswa/:id", verifyToken, deleteMahasiswaById); 
router.get("/kkm/:mahasiswaId", verifyToken, getKkmByTokenKelas);

export default router;
