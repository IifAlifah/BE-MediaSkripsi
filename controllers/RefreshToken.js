// import Users from "../models/UserModel.js";
import jwt from "jsonwebtoken";
import Users from "../models/UserModel.js";

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    const user = await Users.findAll({
      where: { refresh_token: refreshToken } });
    if (!user) return res.sendStatus(403);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
      if (err) return res.sendStatus(403);

      const { id: userId, nama, email, role } = user;

      const accessToken = jwt.sign(
        { userId, nama, email, role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15s" } 
      );

      res.json({ accessToken });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Terjadi kesalahan saat me-refresh token" });
  }
};

