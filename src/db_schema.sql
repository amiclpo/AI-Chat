-- Database setup and Table structures for AI Chat & RAG Assistant
-- Create the Database (if not already existing)
CREATE DATABASE IF NOT EXISTS ai_chat_assistant;
USE ai_chat_assistant;

-- 1. Table: sessions
-- Stores all active and historic chat dialogue sessions
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(255),
  modelId VARCHAR(255),
  systemInstructionId VARCHAR(255),
  customSystemInstruction TEXT,
  temperature DOUBLE,
  topP DOUBLE,
  topK INT,
  maxOutputTokens INT,
  ragEnabled BOOLEAN DEFAULT FALSE,
  ragScope VARCHAR(50) DEFAULT 'conversation',
  createdAt VARCHAR(100),
  updatedAt VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: messages
-- Stores conversation messages associated with sessions. Deleting a session deletes all related messages.
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(255) PRIMARY KEY,
  sessionId VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  timestamp VARCHAR(100) NOT NULL,
  promptTokens INT DEFAULT 0,
  candidateTokens INT DEFAULT 0,
  totalTokens INT DEFAULT 0,
  cost DOUBLE DEFAULT 0.0,
  isRagContext BOOLEAN DEFAULT FALSE,
  ragSources TEXT, -- Raw stringified JSON array
  FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: system_prompts
-- Stores customizable characters and system setting prompts
CREATE TABLE IF NOT EXISTS system_prompts (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  isBuiltIn BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: consumption_records
-- Stores transactions consumption rates and token logs
CREATE TABLE IF NOT EXISTS consumption_records (
  id VARCHAR(255) PRIMARY KEY,
  timestamp VARCHAR(100) NOT NULL,
  chatId VARCHAR(255),
  modelId VARCHAR(255) NOT NULL,
  promptTokens INT DEFAULT 0,
  candidateTokens INT DEFAULT 0,
  totalTokens INT DEFAULT 0,
  estimatedCost DOUBLE DEFAULT 0.0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
