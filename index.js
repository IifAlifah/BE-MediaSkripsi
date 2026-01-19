import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "../backend/config/Database.js";
import router from "../backend/routes/index.js";

dotenv.config();
const app = express();

// Koneksi database
try {
    await db.authenticate();
    console.log('Database Connected ...');
    await db.sync({ force: false });
} catch (error) {
    console.error(error);
}

app.use(cors({ credentials: true, origin: "http://localhost:5173" }));
app.use(cookieParser());
app.use(express.json());
app.use(router);

// Jalankan server di port dari ENV atau default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running at port ${PORT}`));
