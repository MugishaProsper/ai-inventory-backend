# Messaging System API Documentation

## Overview
The messaging system provides real-time communication capabilities between users in the inventory management system. It includes both direct messaging and group conversations.

## Models

### Message Model
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  message: String,
  files: [String], // Array of file URLs
  read: Boolean (default: false),
  conversation: ObjectId (ref: Conversation),
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Model
```javascript
{
  users: [ObjectId] (ref: User),
  messages: [ObjectId] (ref: Message),
  lastMessage: ObjectId (ref: Message),
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Messages (`/api/messages`)

#### POST `/api/messages`
Send a new message
- **Body**: `{ receiverId: string, message: string, files?: string[] }`
- **Response**: Message object with populated sender details
- **Auth**: Required

#### GET `/api/messages/conversation/:conversationId`
Get messages for a conversation
- **Query**: `page`, `limit`
- **Response**: Array of messages with pagination
- **Auth**: Required (must be participant)

#### PUT `/api/messages/:messageId/read`
Mark a message as read
- **Response**: Updated message object
- **Auth**: Required (only receiver can mark as read)

#### DELETE `/api/messages/:messageId`
Delete a message
- **Response**: Success confirmation
- **Auth**: Required (only sender can delete)

#### GET `/api/messages/unread/count`
Get unread message count for current user
- **Response**: `{ unreadCount: number }`
- **Auth**: Required

#### GET `/api/messages/search`
Search messages
- **Query**: `query` (required), `conversationId` (optional)
- **Response**: Array of matching messages
- **Auth**: Required

### Conversations (`/api/conversations`)

#### POST `/api/conversations`
Create a new conversation
- **Body**: `{ participantIds: string[] }`
- **Response**: Conversation object with populated users
- **Auth**: Required

#### GET `/api/conversations`
Get all conversations for current user
- **Query**: `page`, `limit`
- **Response**: Array of conversations with unread counts and pagination
- **Auth**: Required

#### GET `/api/conversations/user/:userId`
Get or create conversation between current user and another user
- **Response**: Conversation object
- **Auth**: Required

#### GET `/api/conversations/:conversationId`
Get specific conversation by ID
- **Response**: Conversation object with unread count
- **Auth**: Required (must be participant)

#### PUT `/api/conversations/:conversationId`
Update conversation (add/remove participants)
- **Body**: `{ action: 'add' | 'remove', userId: string }`
- **Response**: Updated conversation object
- **Auth**: Required (must be participant)

#### DELETE `/api/conversations/:conversationId`
Delete conversation
- **Response**: Success confirmation
- **Auth**: Required (must be participant)

## Features

### Security
- All endpoints require authentication
- Users can only access conversations they participate in
- Users can only delete their own messages
- Users can only mark messages as read if they are the receiver

### Validation
- Message content: 1-2000 characters
- File URLs must be valid URIs
- Participant IDs must be valid ObjectIds
- Search queries: 1-100 characters

### Pagination
- Messages: Default 50 per page, max 100
- Conversations: Default 20 per page, max 100

### Real-time Features (Future)
- WebSocket integration for real-time messaging
- Push notifications for new messages
- Online/offline status indicators

## Usage Examples

### Send a Message
```javascript
POST /api/messages
{
  "receiverId": "64a1b2c3d4e5f6789012345",
  "message": "Hello, how are you?",
  "files": ["https://example.com/file1.pdf"]
}
```

### Get Conversation Messages
```javascript
GET /api/messages/conversation/64a1b2c3d4e5f6789012345?page=1&limit=20
```

### Create Group Conversation
```javascript
POST /api/conversations
{
  "participantIds": ["64a1b2c3d4e5f6789012345", "64a1b2c3d4e5f6789012346"]
}
```

### Search Messages
```javascript
GET /api/messages/search?query=inventory&conversationId=64a1b2c3d4e5f6789012345
```

## Error Handling
All endpoints return consistent error responses:
```javascript
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized
- 403: Forbidden (access denied)
- 404: Not Found
- 500: Internal Server Error
