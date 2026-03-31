import mongoose from "mongoose";

const { Schema, Types } = mongoose;

const connectionSchema=new mongoose.Schema(
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
    status:{
        type:String,
        enum:['pending','accepted','rejected'],
        default:'pending'
    },

},
{
    timestamps:true
}
);

connectionSchema.index(
  { from_user_id: 1, to_user_id: 1 },
  { unique: true }
);

const Connection=mongoose.model('Connection',connectionSchema)

export default Connection;