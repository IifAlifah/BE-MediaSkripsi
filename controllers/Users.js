import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Users from "../models/UserModel.js";
import Mahasiswa from "../models/MahasiswaModel.js";
import Dosen from "../models/DosenModel.js";
import generateToken from "../utils/generateToken.js";

// GET semua user
export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: ['id', 'nama', 'email', 'role']
    });
    res.json(users);
  } catch (error) {
    console.log(error);
  }
};


// GET hanya dosen
export const getDosen = async (req, res) => {
  try {
    const dosen = await Dosen.findAll({
      include: {
        model: Users,
        attributes: ['nama', 'email' ,'nip']
      }
    });
    res.json(dosen);
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Gagal mengambil data dosen" });
  }
};

// REGISTER
export const Register = async (req, res) => {
  const { nama, nim, nip, email, password, konfPassword, role, token_kelas} = req.body;

  const existingUser = await Users.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ msg: "Email sudah terdaftar" });
  }
  
  // Validasi password
  if (password !== konfPassword) {
    return res.status(400).json({ msg: "Password dan Konfirmasi Password tidak cocok" });
  }

  // Validasi nim/nip sesuai role
  if (role === "mahasiswa" && !nim) {
    return res.status(400).json({ msg: "NIM wajib diisi untuk mahasiswa" });
  }

  if (role === "mahasiswa" && !token_kelas) {
    return res.status(400).json({ msg: "Token kelas wajib diisi untuk mahasiswa" });
  }

  if (role === "dosen" && !nip) {
    return res.status(400).json({ msg: "NIP wajib diisi untuk dosen" });
  }

  try {
    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    // Buat user baru (tanpa nim/nip)
    const newUser = await Users.create({
      nama,
      email,
      password: hashPassword,
      role
    });

    // Masukkan data tambahan ke tabel Mahasiswa atau Dosen
    if (role === "mahasiswa") {
      await Mahasiswa.create({
        userId: newUser.id,
        nim: nim,
        token_kelas: token_kelas,
        progress: 0
      });
    } else if (role === "dosen") {
      if (newUser.role === "dosen") {
        const token = generateToken(); // buat token baru secara otomatis
        await Dosen.create({
          userId: newUser.id,
          nip: nip,
          token: token // gunakan field yang sesuai dengan model
        });
      }
    }

    res.status(201).json({ msg: "Registrasi berhasil" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Terjadi kesalahan saat registrasi" });
  }
};


// LOGIN
export const Login = async (req, res) => {
  try {
    const user = await Users.findOne({ where: { email: req.body.email } });
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(401).json({ msg: "Password salah" });

    const { id: userId, nama, email, role } = user;

    // Ambil data mahasiswa/dosen
    let tokenKelas = null;
    let tokenDosen = null;
    let mahasiswaId = null;

    if (role === "mahasiswa") {
      const mahasiswa = await Mahasiswa.findOne({ where: { userId } });
      if (!mahasiswa) return res.status(404).json({ msg: "Data mahasiswa tidak ditemukan" });
      tokenKelas = mahasiswa.token_kelas;
      mahasiswaId = mahasiswa.id; // Dapatkan ID mahasiswa
    } else if (role === "dosen") {
      const dosen = await Dosen.findOne({ where: { userId } });
      if (!dosen) return res.status(404).json({ msg: "Data dosen tidak ditemukan" });
      tokenDosen = dosen.token;
    }

    // Buat payload token
    const payload = {
      userId,
      nama,
      email,
      role,
      ...(role === "mahasiswa" && {
        token_kelas: tokenKelas,
        mahasiswaId: mahasiswaId
      }),
      ...(role === "dosen" && {
        token: tokenDosen
      })
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: "1d" });

    await Users.update({ refresh_token: refreshToken }, { where: { id: userId } });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ accessToken });

  } catch (error) {
    console.log("Terjadi error:", error);
    res.status(500).json({ msg: "Terjadi kesalahan saat login" });
  }
};



// LOGOUT
export const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);

  const user = await Users.findOne({ where: { refresh_token: refreshToken } });
  if (!user) return res.sendStatus(204);

  await Users.update({ refresh_token: null }, { where: { id: user.id } });

  res.clearCookie("refreshToken");
  return res.sendStatus(200);
};
