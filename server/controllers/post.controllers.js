import User from "../models/User.schema";
import Post from "../models/Post.schema";
import uploadImage from '../utils/uploadImage.js';

export const addPost = async (req, res) => {
  try {
    const { userId } = req.auth;

    // 1. Auth check
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 2. Get user from DB
    const user = await User.findOne({ clerk_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const { content } = req.body;

    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadImage(file)),
      );

      imageUrls = uploads.map((img) => img.url);
    }

    // validation (extra safety)
    if (!content && imageUrls.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Post must have content or image",
      });
    }

    const post = await Post.create({
      user: user._id,
      content,
      image_urls: imageUrls,
    });

    return res.status(201).json({
      success: true,
      message: "Post created successfully",
      data: post,
    });
  } catch (error) {
    console.error("addPost error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const toggleLikePost = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { postId } = req.params;

    // 1. Auth check
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 2. Get user from DB
    const user = await User.findOne({ clerk_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const isLiked = post.likes.some(
      (id) => id.toString() === user._id.toString(),
    );

    if (isLiked) {
      // UNLIKE
      post.likes = post.likes.filter(
        (id) => id.toString() !== user._id.toString(),
      );
      post.likes_count -= 1;
    } else {
      // LIKE
      post.likes.push(user._id);
      post.likes_count += 1;
    }

    await post.save();

    return res.status(200).json({
      success: true,
      message: isLiked ? "Post unliked" : "Post liked",
      data: post,
    });
  } catch (error) {
    console.error("toggleLikePost error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getFeed = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "username full_name profile_picture");

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("getFeed error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error("getUserPosts error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { postId } = req.params;

    // 1. Auth check
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 2. Find current user
    const user = await User.findOne({ clerk_id: userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // 3. Find post
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // 4. Authorization check (only owner can delete)
    if (post.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this post",
      });
    }

    // 5. Delete post
    await post.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("deletePost error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
