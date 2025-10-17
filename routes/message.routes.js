import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  searchMessages
} from "../controllers/message.controllers.js";
import { messageSchemas } from "../middlewares/validation.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const messageRouter = express.Router();

// All message routes require authentication
messageRouter.use(authorize);

// Send a new message
messageRouter.post("/", validate(messageSchemas.send), sendMessage);

// Get messages for a conversation
messageRouter.get("/conversation/:conversationId", getMessages);

// Mark a message as read
messageRouter.put("/:messageId/read", markAsRead);

// Delete a message
messageRouter.delete("/:messageId", deleteMessage);

// Get unread message count for current user
messageRouter.get("/unread/count", getUnreadCount);

// Search messages
messageRouter.get("/search", validate(messageSchemas.search, "query"), searchMessages);

export default messageRouter;
