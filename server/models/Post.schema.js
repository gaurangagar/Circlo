import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const postSchema = new mongoose.Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      index:true
    },
    content: {
      type: String,
      trim:true,
      maxlength: 1000,
      default:""
    },
    image_urls: {
      type: [String],
      default: [],
    },
    likes: [
      {
        type: Types.ObjectId,
        ref: "User",
        select: false
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

// For feed sorting
postSchema.index({ createdAt: -1 });

// For user posts
postSchema.index({ user: 1, createdAt: -1 });

postSchema.pre("validate", function (next) {
  if (!this.content && (!this.image_urls || this.image_urls.length === 0)) {
    return next(new Error("Post must have content or image"));
  }

  if (this.image_urls && this.image_urls.length > 5) {
    return next(new Error("Maximum 5 images allowed"));
  }

  next();
});

const Post = mongoose.model("Post", postSchema);

export default Post;
