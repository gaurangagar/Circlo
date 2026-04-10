import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import connectDB from "./config/connectDB.js";

import userRoutes from './routes/user.routes.js'
import postRoutes from './routes/post.routes.js'
import storyRoutes from './routes/story.routes.js'
import messageRoutes from './routes/message.routes.js'

const app = express();

dotenv.config();
app.use(clerkMiddleware())
connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("My API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// USERS → /users/*
app.use("/users", userRoutes)

// POSTS → /posts/*
app.use("/posts", postRoutes)

// STORIES → /stories/*
app.use("/stories", storyRoutes)

// MESSAGES → /messages/*
app.use("/messages", messageRoutes)