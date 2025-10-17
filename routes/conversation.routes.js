import express from "express";
import { authorize } from "../middlewares/auth.middleware.js";
import {
  createConversation,
  getConversation,
  getUserConversations,
  updateConversation,
  deleteConversation,
  getConversationBetweenUsers
} from "../controllers/conversation.controllers.js";
import { conversationSchemas } from "../middlewares/validation.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";

const conversationRouter = express.Router();

// All conversation routes require authentication
conversationRouter.use(authorize);

// Create a new conversation
conversationRouter.post("/", validate(conversationSchemas.create), createConversation);

// Get all conversations for current user
conversationRouter.get("/", getUserConversations);

// Get conversation between current user and another user
conversationRouter.get("/user/:userId", getConversationBetweenUsers);

// Get specific conversation by ID
conversationRouter.get("/:conversationId", getConversation);

// Update conversation (add/remove participants)
conversationRouter.put("/:conversationId", validate(conversationSchemas.update), updateConversation);

// Delete conversation
conversationRouter.delete("/:conversationId", deleteConversation);

export default conversationRouter;
