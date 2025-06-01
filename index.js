import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import db from "../backend/config/Database.js";
import router from "../backend/routes/index.js";

dotenv.config();
const app = express();
try {
    await db.authenticate();
    console.log('Database Connected ...');
    await db.sync({force: false});
} catch (error) {
    console.error(error);
}


app.use(cors({ credentials:true, origin: "http://localhost:5173"}))
app.use(cookieParser());
app.use(express.json());
app.use(router);

app.listen(5000, ()=> console.log("Server running at port 5000"));
