import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const createConversation = async (req, res) => {
  try {
    const { participantIds } = req.body;
    const userId = req.user.id;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one participant is required",
      });
    }

    const allParticipants = [...new Set([userId, ...participantIds])];

    const existingConversation = await Conversation.findOne({
      users: { $all: allParticipants }
    });

    if (existingConversation) {
      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: existingConversation
      });
    }

    const participants = await User.find({ _id: { $in: allParticipants } });
    if (participants.length !== allParticipants.length) {
      return res.status(400).json({
        success: false,
        message: "One or more participants not found",
      });
    }

    const conversation = new Conversation({
      users: allParticipants,
      messages: [],
      lastMessage: null
    });

    await conversation.save();

    await conversation.populate('users', 'fullname username email');

    return res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation
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

export const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    const conversation = await Conversation.findById(conversationId)
      .populate('users', 'fullname username email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'fullname username'
        }
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.users.some(user => user._id.toString() === userId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const unreadCount = await Message.countDocuments({
      conversation: conversationId,
      receiver: userId,
      read: false
    });

    return res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: {
        ...conversation.toObject(),
        unreadCount
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

export const getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({ users: userId })
      .populate('users', 'fullname username email')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'fullname username'
        }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const formattedConversations = await Promise.all(
      conversations.map(async (conversation) => {
        const otherUsers = conversation.users.filter(user => user._id.toString() !== userId);
        const unreadCount = await Message.countDocuments({
          conversation: conversation._id,
          receiver: userId,
          read: false
        });

        return {
          _id: conversation._id,
          participants: otherUsers,
          lastMessage: conversation.lastMessage,
          unreadCount,
          updatedAt: conversation.updatedAt,
          createdAt: conversation.createdAt
        };
      })
    );

    const totalConversations = await Conversation.countDocuments({ users: userId });

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully",
      data: formattedConversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalConversations,
        totalPages: Math.ceil(totalConversations / limit)
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

export const updateConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { action, userId: targetUserId } = req.body;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.users.includes(currentUserId)) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (action === 'add') {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (!conversation.users.includes(targetUserId)) {
        conversation.users.push(targetUserId);
        await conversation.save();
      }
    } else if (action === 'remove') {
      conversation.users = conversation.users.filter(id => id.toString() !== targetUserId);

      if (conversation.users.length === 0) {
        await Conversation.findByIdAndDelete(conversationId);
        await Message.deleteMany({ conversation: conversationId });

        return res.status(200).json({
          success: true,
          message: "Conversation deleted successfully"
        });
      }

      await conversation.save();
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'add' or 'remove'",
      });
    }

    await conversation.populate('users', 'fullname username email');

    return res.status(200).json({
      success: true,
      message: "Conversation updated successfully",
      data: conversation
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

export const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

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

    await Conversation.findByIdAndDelete(conversationId);
    await Message.deleteMany({ conversation: conversationId });

    return res.status(200).json({
      success: true,
      message: "Conversation deleted successfully"
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

export const getConversationBetweenUsers = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.user.id;

    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let conversation = await Conversation.findOne({
      users: { $all: [currentUserId, otherUserId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        users: [currentUserId, otherUserId],
        messages: [],
        lastMessage: null
      });
      await conversation.save();
    }
    
    await conversation.populate('users', 'fullname username email');

    return res.status(200).json({
      success: true,
      message: "Conversation retrieved successfully",
      data: conversation
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
