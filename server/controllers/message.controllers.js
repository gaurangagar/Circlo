import User from "../models/User.schema";
import Message from "../models/Message.schema";
import UploadImage from '../utils/uploadImage'
const connections = {};

export const sseController = (req, res) => {
  try {
    const { userId } = req.params;
    console.log("New client connected", userId);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");

    res.flushHeaders();

    connections[userId] = res;

    // Initial event
    res.write(`event: connected\n`);
    res.write(`data: Connected to SSE stream\n\n`);

    // Heartbeat
    const interval = setInterval(() => {
      res.write(`: keep-alive\n\n`);
    }, 20000);

    req.on("close", () => {
      clearInterval(interval);
      delete connections[userId];
      console.log("Client disconnected", userId);
    });
  } catch (error) {
    console.error("SSE error:", error);
    res.status(500).end();
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { toUserId, text } = req.body;

    const sender = await User.findOne({ clerk_id: userId });
    const receiver = await User.findById(toUserId);

    if (!sender || !receiver) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let media_url = "";
    let message_type = "text";

    if (req.file) {
      const uploaded = await uploadImage(req.file);
      media_url = uploaded.url;
      message_type = "image";
    }

    if (!text && !media_url) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    const message = await Message.create({
      from_user_id: sender._id,
      to_user_id: receiver._id,
      text,
      media_url,
      message_type,
    });

    const receiverConnection = connections[receiver._id.toString()];

    if (receiverConnection) {
      receiverConnection.write(`event: message\n`);
      receiverConnection.write(`data: ${JSON.stringify(message)}\n\n`);
    }

    return res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getChatMessages = async (req, res) => {
  try {
    const { userId } = req.auth;
    const { otherUserId } = req.params;

    const currentUser = await User.findOne({ clerk_id: userId });

    if (!currentUser) {
    return res.status(404).json({
        success: false,
        message: "User not found",
    });
    }
    const messages = await Message.find({
      $or: [
        { from_user_id: currentUser._id, to_user_id: otherUserId },
        { from_user_id: otherUserId, to_user_id: currentUser._id },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("getChatMessages error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getUserRecentMessages = async (req, res) => {
  try {
    const { userId } = req.auth;

    const currentUser = await User.findOne({ clerk_id: userId });

    const messages = await Message.find({
      $or: [{ sender: currentUser._id }, { receiver: currentUser._id }],
    }).sort({ createdAt: -1 });

    const conversations = {};

    messages.forEach((msg) => {
      const otherUserId =
        msg.from_user_id.toString() === currentUser._id.toString()
          ? msg.to_user_id.toString()
          : msg.from_user_id.toString();

      if (!conversations[otherUserId]) {
        conversations[otherUserId] = msg;
      }
    });

    return res.status(200).json({
      success: true,
      data: Object.values(conversations),
    });
  } catch (error) {
    console.error("getUserRecentMessages error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
