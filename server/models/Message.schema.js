import mongoose, { Types } from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    from_user_id: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    to_user_id: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      trim: true,
      default: "",
    },
    message_type: {
      type: String,
      enum: ["text", "image"],
      required: true,
    },
    media_url: {
      type: String,
      default: "",
      trim:true
    },
    seen: {
      type: Boolean,
      default: false,
    },
    seen_at: {
      type: Date,
    },
  },
  {
    timestamps: true,
    minimize: false,
  },
);

messageSchema.index({
  from_user_id: 1,
  to_user_id: 1,
  createdAt: -1,
});

messageSchema.index({
  to_user_id: 1,
  from_user_id: 1,
  createdAt: -1,
});

messageSchema.pre("validate", function (next) {
  if (this.message_type === "text" && !this.text) {
    return next(new Error("Text message must have text"));
  }

  if (this.message_type === "image" && !this.media_url) {
    return next(new Error("Image message must have media_url"));
  }

  next();
});

const Message = mongoose.model("Message", messageSchema);

export default Message;
