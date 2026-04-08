import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const storySchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: {
      type: String,
      trim: true,
      default: ""
    },

    media_url: {
      type: String,
      trim:true
    },

    media_type: {
      type: String,
      enum: ["text", "image", "video"],
      required: true,
    },

    views: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],

    views_count: {
      type: Number,
      default: 0,
    },

    background_color: {
      type: String,
      default: "#000000",
    },

    // ✅ FIXED: inside schema
    expires_at: {
      type: Date,
      default: () => Date.now() + 24 * 60 * 60 * 1000,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

storySchema.index({ user: 1, createdAt: -1 });

// ✅ Auto-delete after expiry
storySchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

// ✅ Ensure story has content
storySchema.pre("validate", function (next) {
  if (this.media_type === "text" && !this.content) {
    return next(new Error("Text story must have content"));
  }

  if (
    (this.media_type === "image" || this.media_type === "video") &&
    !this.media_url
  ) {
    return next(new Error("Media story must have media_url"));
  }

  next();
});

const Story = mongoose.model("Story", storySchema);

export default Story;