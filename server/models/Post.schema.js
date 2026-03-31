import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const postSchema = new mongoose.Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
    },
    image_urls: [
      {
        type: String,
      },
    ],
    post_type: {
      type: String,
      enum: ["text", "image", "text-with-image"],
      required: true,
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: "User",
      },
    ],
    likes_count :{
        type:Number,
        default:0
    }
  },
  {
    timestamps: true,
    minimize: false,
  },
);

postSchema.pre("validate", function (next) {
  if (!this.content && (!this.image_urls || this.image_urls.length === 0)) {
    return next(new Error("Post must have content or image"));
  }
  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
