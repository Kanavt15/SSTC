-- Migration: Add GENERAL channel support to chat_messages table
-- Run this migration to update an existing database

-- Method 1: If starting fresh, just use the new init.sql

-- Method 2: For existing database, use ALTER TABLE
-- MySQL requires recreating the column to modify ENUM values

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Step 1: Add new column with GENERAL support
ALTER TABLE chat_messages ADD COLUMN channel ENUM('GENERAL', 'AIDS', 'COMPS', 'IT', 'EXTC') NOT NULL DEFAULT 'GENERAL';

-- Step 2: Copy data from old department column to new channel column
UPDATE chat_messages SET channel = department WHERE id > 0;

-- Step 3: Drop the old department column
ALTER TABLE chat_messages DROP COLUMN department;

-- Step 4: Add index for faster message retrieval
ALTER TABLE chat_messages ADD INDEX idx_chat_channel (channel, created_at DESC);

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- Done! The chat_messages table now supports GENERAL channel
