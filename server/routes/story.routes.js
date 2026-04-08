import express from "express";
import { requireAuth } from "@clerk/express";
import upload from "../configs/multer.js";
import {
  createStory,
  getStories,
  getUserStories,
  viewStory,
  deleteStory,
} from "../controllers/story.controller.js";

const router = express.Router();

// create story
router.post(
  "/",
  requireAuth(),
  upload.single("media"),
  createStory
);

// get all stories (feed)
router.get("/", requireAuth(), getStories);

// get stories of a user
router.get("/:userId", requireAuth(), getUserStories);

// view story
router.post("/view/:storyId", requireAuth(), viewStory);

// delete story
router.delete("/:storyId", requireAuth(), deleteStory);

export default router;