import User from "../models/User.schema";
import generateUsername from "../utils/username.utils";
import Connection from "../models/Connection.schema.js";

export const syncUser = async (req, res) => {
  try {
    const { userId } = req.auth;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "unauthorized",
      });
    }
    let existingUser = await User.findOne({ clerk_id: userId });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        data: existingUser,
      });
    }
    const clerkUser = await req.clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses?.[0]?.emailAddress || "";
    const fullName = `${clerkUser.firstName || ""} ${
      clerkUser.lastName || ""
    }`.trim();

    let baseUsername = "user";

    if (clerkUser.username) {
      baseUsername = clerkUser.username;
    } else {
      baseUsername = email ? email.split("@")[0] : "user";
    }

    const username = await generateUsername(baseUsername);
    const newUser = await User.create({
      clerk_id: userId,
      email,
      full_name: fullName || "New User",
      username,
      profile_picture: clerkUser.imageUrl || "",
    });
    return res.status(201).json({
      success: true,
      message: "User synced successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("syncUser error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateProfilePicture = async (req, res) =>{
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    // multer gives req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const uploaded = await uploadImage(req.file);

    dbUser.profile_picture = uploaded.url;
    await dbUser.save();

    return res.status(200).json({
      success: true,
      message: "Profile picture updated",
      data: dbUser,
    });
    } catch (error) {
        console.error("updateProfilePicture error:", error);
        
        return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        });
    }
}

export const getCurrentUser = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    // 3. Get Clerk user (optional but useful)
    const clerkUser = await req.clerkClient.users.getUser(userId);

    // 4. Merge data
    const userData = {
      ...dbUser.toObject(),

      // minimal Clerk fields
      email: clerkUser.emailAddresses?.[0]?.emailAddress || dbUser.email,
      profile_picture: clerkUser.imageUrl || dbUser.profile_picture,
      first_name: clerkUser.firstName,
      last_name: clerkUser.lastName,
    };

    // 5. Response
    return res.status(200).json({
      success: true,
      message: "Current user fetched",
      data: userData,
    });
  } catch (error) {
    console.error("getCurrentUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateUserData = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const allowedUpdates = [
      "full_name",
      "bio",
      "location",
      "profile_picture",
      "cover_photo",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        dbUser[field] = req.body[field];
      }
    });

    // 5. Save updated user
    await dbUser.save();

    // 6. Response
    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: dbUser,
    });
  } catch (error) {
    console.error("updateUserData error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const discoverUser = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const connections = await Connection.find({
      $or: [{ from_user_id: dbUser._id }, 
        { to_user_id: dbUser._id }],
    });

    const excludedUserIds = new Set();

    connections.forEach((conn) => {
      excludedUserIds.add(conn.from_user_id.toString());
      excludedUserIds.add(conn.to_user_id.toString());
    });

    // Also exclude current user
    excludedUserIds.add(dbUser._id.toString());

    // 5. Find users NOT in excluded list
    const users = await User.find({
      _id: { $nin: Array.from(excludedUserIds) },
    });

    // 6. Response
    return res.status(200).json({
      success: true,
      message: "Discover users fetched",
      data: users,
    });
  } catch (error) {
    console.error("discoverUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const followUser = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const { targetUserId } = req.body;

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    if (dbUser._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    if (dbUser.following.some(id => id.toString() === targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Already following this user",
      });
    }

    dbUser.following.push(targetUserId);
    await dbUser.save();

    targetUser.followers.push(dbUser._id);
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User followed successfully",
    });
  } catch (error) {
    console.error("followUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const unfollowUser = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const { targetUserId } = req.body;

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    if (dbUser._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself",
      });
    }

    dbUser.following = dbUser.following.filter(
      (id) => id.toString() !== targetUserId,
    );
    await dbUser.save();

    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== dbUser._id.toString(),
    );
    await targetUser.save();

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully",
    });
  } catch (error) {
    console.error("unfollowUser error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const sendConnectionRequest = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const { targetUserId } = req.body;

    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "Target user not found",
      });
    }

    if (dbUser._id.toString() === targetUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot connect with yourself",
      });
    }

    const existing = await Connection.findOne({
      $or: [
        { from_user_id: dbUser._id, to_user_id: targetUserId },
        { from_user_id: targetUserId, to_user_id: dbUser._id },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Connection already exists or pending",
      });
    }

    const connection = await Connection.create({
      from_user_id: dbUser._id,
      to_user_id: targetUserId,
    });

    return res.status(201).json({
      success: true,
      message: "Connection request sent",
      data: connection,
    });
  } catch (error) {
    console.error("sendConnectionRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUserConnections = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }
    const connections = await Connection.find({
      status: "accepted",
      $or: [{ from_user_id: dbUser._id }, { to_user_id: dbUser._id }],
    })
      .populate("from_user_id", "username full_name profile_picture")
      .populate("to_user_id", "username full_name profile_picture");

    return res.status(200).json({
      success: true,
      data: connections,
    });
  } catch (error) {
    console.error("getUserConnections error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const acceptConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { requestId } = req.body;

    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const connection = await Connection.findById(requestId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    // Only receiver can accept
    if (connection.to_user_id.toString() !== dbUser._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to accept this request",
      });
    }
    if (connection.status === "accepted") {
        return res.status(400).json({
            success: false,
            message: "Already accepted",
        });
    }

    connection.status = "accepted";
    await connection.save();

    return res.status(200).json({
      success: true,
      message: "Connection accepted",
      data: connection,
    });
  } catch (error) {
    console.error("acceptConnectionRequest error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getUserProfiles = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .populate("followers", "username profile_picture")
      .populate("following", "username profile_picture");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("getUserProfiles error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getPendingRequests = async (req, res) => {
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
    const dbUser = await User.findOne({ clerk_id: userId });

    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database",
      });
    }

    const requests = await Connection.find({
      to_user_id: dbUser._id,
      status: "pending",
    }).populate("from_user_id", "username full_name profile_picture");

    // 4. Response
    return res.status(200).json({
      success: true,
      message: "Pending requests fetched",
      data: requests,
    });
  } catch (error) {
    console.error("getPendingRequests error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


