import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";

// Send a new message
export const sendMessage = async (req, res) => {
  try {
    const { receiverId, message, files } = req.body;
    const senderId = req.user.id;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: "Receiver not found",
      });
    }

    // Check if conversation exists between these users
    let conversation = await Conversation.findOne({
      users: { $all: [senderId, receiverId] }
    });

    // If no conversation exists, create one
    if (!conversation) {
      conversation = new Conversation({
        users: [senderId, receiverId],
        messages: [],
        lastMessage: null
      });
      await conversation.save();
    }

    // Create the message
    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      message,
      files: files || [],
      conversation: conversation._id,
      read: false
    });

    await newMessage.save();

    // Update conversation with new message
    conversation.messages.push(newMessage._id);
    conversation.lastMessage = newMessage._id;
    await conversation.save();

    // Populate the message with sender details
    await newMessage.populate('sender', 'fullname username email');

    return res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: newMessage
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get messages for a conversation
export const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Verify user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.users.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get messages with pagination
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'fullname username email')
      .populate('receiver', 'fullname username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        conversation: conversationId,
        receiver: userId,
        read: false
      },
      { read: true }
    );

    return res.status(200).json({
      success: true,
      message: "Messages retrieved successfully",
      data: messages.reverse(), // Return in chronological order
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Message.countDocuments({ conversation: conversationId })
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get all conversations for a user
export const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({ users: userId })
      .populate('users', 'fullname username email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'fullname username'
        }
      })
      .sort({ updatedAt: -1 });

    // Format conversations to include unread count
    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUser = conversation.users.find(user => user._id.toString() !== userId);
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          receiver: userId,
          read: false
        });

        return {
          _id: conversation._id,
          otherUser: {
            id: otherUser._id,
            name: otherUser.fullname,
            username: otherUser.username,
            email: otherUser.email
          },
          lastMessage: conversation.lastMessage,
          unreadCount,
          updatedAt: conversation.updatedAt
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: formattedConversations
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Mark message as read
export const markAsRead = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only the receiver can mark as read
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    message.read = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message marked as read",
      data: message
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only the sender can delete their message
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Message.findByIdAndDelete(messageId);

    // Update conversation's lastMessage if this was the last message
    const conversation = await Conversation.findById(message.conversation);
    if (conversation && conversation.lastMessage.toString() === messageId) {
      const remainingMessages = await Message.find({ conversation: conversation._id })
        .sort({ createdAt: -1 })
        .limit(1);

      conversation.lastMessage = remainingMessages.length > 0 ? remainingMessages[0]._id : null;
      await conversation.save();
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully"
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get unread message count for a user
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const unreadCount = await Message.countDocuments({
      receiver: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      message: "Unread count retrieved successfully",
      data: { unreadCount }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    let searchFilter = {
      message: { $regex: query, $options: 'i' },
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    };

    // If conversationId is provided, search within that conversation
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation || !conversation.users.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }
      searchFilter.conversation = conversationId;
    }

    const messages = await Message.find(searchFilter)
      .populate('sender', 'fullname username email')
      .populate('receiver', 'fullname username email')
      .populate('conversation')
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      message: "Search results retrieved successfully",
      data: messages
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
