import mongoose from "mongoose";

const messageSchema = mongoose.Schema({
  sender : { type : mongoose.Schema.Types.ObjectId, ref : "User", required : true },
  receiver : { type : mongoose.Schema.Types.ObjectId, ref : "User", required : true },
  message : { type : String },
  files : [{ type : String }],
  read : { type : Boolean, default : false },
  conversation : { type : mongoose.Schema.Types.ObjectId, ref : "Conversation", required : true }
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);

export default Message