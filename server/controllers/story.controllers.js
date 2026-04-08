import Story from "../models/Story.schema.js";
import User from "../models/User.schema.js";
import { uploadImage } from "../utils/uploadImage.js";

export const createStory = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { content, media_type, background_color } = req.body;

    const user = await User.findOne({ clerk_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let mediaUrl = "";

    if (req.file) {
      const uploaded = await uploadImage(req.file);
      mediaUrl = uploaded.url;
    }

    const story = await Story.create({
      user: user._id,
      content,
      media_type,
      media_url: mediaUrl,
      background_color,
    });

    return res.status(201).json({
      success: true,
      message: "Story created",
      data: story,
    });
  } catch (error) {
    console.error("createStory error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
  }
};

export const getStories = async (req, res) => {
  try {
    const stories = await Story.find()
      .sort({ createdAt: -1 })
      .populate("user", "username profile_picture");

    // group by user
    const grouped = {};

    stories.forEach((story) => {
      const userId = story.user._id.toString();

      if (!grouped[userId]) {
        grouped[userId] = {
          user: story.user,
          stories: [],
        };
      }

      grouped[userId].stories.push(story);
    });

    return res.status(200).json({
      success: true,
      data: Object.values(grouped),
    });
  } catch (error) {
    console.error("getStories error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserStories = async (req, res) => {
  try {
    const { userId } = req.params;

    const stories = await Story.find({ user: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: stories,
    });
  } catch (error) {
    console.error("getUserStories error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const viewStory = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { storyId } = req.params;

    const user = await User.findOne({ clerk_id: userId });

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    const alreadyViewed = story.views.some(
      (id) => id.toString() === user._id.toString()
    );

    if (!alreadyViewed) {
      story.views.push(user._id);
      story.views_count += 1;
      await story.save();
    }

    return res.status(200).json({
      success: true,
      message: "Story viewed",
    });
  } catch (error) {
    console.error("viewStory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteStory = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { storyId } = req.params;

    const user = await User.findOne({ clerk_id: userId });

    const story = await Story.findById(storyId);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await story.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Story deleted",
    });
  } catch (error) {
    console.error("deleteStory error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};