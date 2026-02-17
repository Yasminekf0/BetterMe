# Conversation Model Migration

## Overview
Added a new `Conversation` model to store high-level abstractions and metadata for user-AI roleplay conversations. This complements the existing `Message` model which stores individual messages.

## Changes Made

### 1. New `Conversation` Model
**Location**: `prisma/schema.prisma`

**Purpose**: Provides a high-level abstraction for managing chat histories with aggregated metadata.

**Fields**:
- `id` (String): Primary key
- `sessionId` (String): Foreign key to Session (1:1 relationship)
- `userId` (String): Foreign key to User
- `scenarioId` (String): Reference to the scenario
- `title` (String?): Optional user-defined title
- `summary` (String?): AI-generated or user-provided summary
- `keyTopics` (Json?): Array of key topics discussed
- `tags` (Json?): Array of custom tags for categorization
- `messageCount` (Int): Total message count (auto-updated)
- `userMessageCount` (Int): User-only message count (auto-updated)
- `aiMessageCount` (Int): AI-only message count (auto-updated)
- `averageSentiment` (Float?): Sentiment analysis of user messages (-1 to 1)
- `isArchived` (Boolean): For archiving old conversations
- `isPinned` (Boolean): For pinning important conversations
- `isFavorited` (Boolean): User can mark as favorite
- `startedAt` (DateTime): When conversation started
- `completedAt` (DateTime?): When conversation ended
- `lastMessageAt` (DateTime): Last message timestamp (for sorting)
- `createdAt`, `updatedAt` (DateTime): Audit timestamps

**Relationships**:
- One-to-One with `Session`
- One-to-Many with `Message`
- Many-to-One with `User`

### 2. Updated `Message` Model
**Changes**:
- Added `conversationId` (String?): Optional foreign key to Conversation
- Added `embeddings` (Json?): For storing vector embeddings (optional, for semantic search)
- Added indexes on `sessionId`, `conversationId`, and `timestamp`

### 3. Updated `Session` Model
**Changes**:
- Added `conversation` (Conversation?): Relation to Conversation model

### 4. Updated `User` Model
**Changes**:
- Added `conversations` (Conversation[]): Relation to user's conversations

## Database Migration SQL

Execute this SQL to create the new table:

```sql
-- Create conversations table
CREATE TABLE `conversations` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `scenarioId` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191),
  `summary` LONGTEXT,
  `keyTopics` JSON,
  `tags` JSON,
  `messageCount` INT NOT NULL DEFAULT 0,
  `userMessageCount` INT NOT NULL DEFAULT 0,
  `aiMessageCount` INT NOT NULL DEFAULT 0,
  `averageSentiment` DOUBLE,
  `isArchived` BOOLEAN NOT NULL DEFAULT false,
  `isPinned` BOOLEAN NOT NULL DEFAULT false,
  `isFavorited` BOOLEAN NOT NULL DEFAULT false,
  `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedAt` DATETIME(3),
  `lastMessageAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  
  UNIQUE KEY `conversations_sessionId_key` (`sessionId`),
  INDEX `conversations_userId_idx` (`userId`),
  INDEX `conversations_sessionId_idx` (`sessionId`),
  INDEX `conversations_scenarioId_idx` (`scenarioId`),
  INDEX `conversations_isArchived_idx` (`isArchived`),
  INDEX `conversations_isFavorited_idx` (`isFavorited`),
  INDEX `conversations_lastMessageAt_idx` (`lastMessageAt`),
  INDEX `conversations_createdAt_idx` (`createdAt`),
  
  PRIMARY KEY (`id`),
  CONSTRAINT `conversations_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Update messages table
ALTER TABLE `messages` 
ADD COLUMN `conversationId` VARCHAR(191),
ADD COLUMN `embeddings` JSON,
ADD INDEX `messages_sessionId_idx` (`sessionId`),
ADD INDEX `messages_conversationId_idx` (`conversationId`),
ADD INDEX `messages_timestamp_idx` (`timestamp`),
ADD CONSTRAINT `messages_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `conversations` (`id`) ON DELETE CASCADE;
```

## Best Practices Implemented

1. **Proper Indexing**: Added indexes on frequently queried fields (userId, isArchived, isFavorited, lastMessageAt) for optimal query performance

2. **Cascade Deletion**: Used ON DELETE CASCADE to automatically clean up related messages when a conversation is deleted

3. **Audit Timestamps**: Included createdAt and updatedAt for tracking and debugging

4. **Separation of Concerns**: 
   - `Message`: Stores individual messages (raw data)
   - `Conversation`: Stores conversation metadata (aggregated data)
   - `Session`: Represents the practice session (session lifecycle)

5. **Flexible Metadata**: Used JSON fields for tags, topics, and embeddings to allow flexible, extensible data storage

6. **Optional Fields**: Made summary, title, and embeddings optional to support different use cases without requiring all fields

7. **State Management**: Added state flags (isArchived, isPinned, isFavorited) for managing conversation visibility without deletion

## Service Layer Integration

A new service should be created to manage Conversation operations:

```typescript
// backend/src/services/conversationService.ts
export async function createConversation(sessionId: string, userId: string, scenarioId: string) {
  return prisma.conversation.create({
    data: {
      sessionId,
      userId,
      scenarioId,
    },
  });
}

export async function updateConversationMetadata(
  conversationId: string,
  data: { title?: string; summary?: string; keyTopics?: string[]; tags?: string[] }
) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data,
  });
}

export async function getUserConversations(userId: string, options?: { archived?: boolean }) {
  return prisma.conversation.findMany({
    where: { userId, ...(options?.archived !== undefined && { isArchived: options.archived }) },
    include: { messages: true },
    orderBy: { lastMessageAt: 'desc' },
  });
}
```

## Integration with Roleplay Controller

Update [roleplayController.ts](../../src/controllers/roleplayController.ts) to create a conversation when a session starts:

```typescript
// In startSession function, after creating session:
const conversation = await conversationService.createConversation(
  session.id,
  userId,
  scenarioId
);
```

## Migration Execution Steps

1. Backup your database
2. Run the SQL migration on your MySQL instance
3. Run `npx prisma db push` to sync Prisma with your database
4. Generate updated Prisma client: `npx prisma generate`
5. Update your application services to use the new Conversation model
6. Test the changes with your roleplay functionality
