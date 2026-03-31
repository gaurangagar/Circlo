import mongoose, { Types } from "mongoose";

const messageSchema=new mongoose.Schema(
    {
    from_user_id:{
        type:Types.ObjectId,
        ref:'User',
        required:true
    },
    to_user_id:{
        type:Types.ObjectId,
        ref:'User',
        required:true
    },
    text:{
        type:String,
        trim:true
    },
    message_type:{
        type:String,
        enum:['text','image'],
        required:true
    },
    media_url:{
        type:String
    },
    seen:{
        type:Boolean,
        default:false
    },
    seen_at: {
      type: Date,
    },
},{
    timestamps:true,
    minimize:false
}
)

messageSchema.pre("validate", function (next) {
  if (this.message_type === "text" && !this.text) {
    return next(new Error("Text message must have text"));
  }

  if (this.message_type === "image" && !this.media_url) {
    return next(new Error("Image message must have media_url"));
  }

  next();
});

const Message=mongoose.model('Message',messageSchema);

export default Message;