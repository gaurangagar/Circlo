import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import connectDB from "./config/connectDB";

dotenv.config();
app.use(clerkMiddleware())

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});