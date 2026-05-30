-- ====================================================================
-- Database Table Schemas for Gemini Companion Personal Assistant
-- Supported Database: MySQL 5.7+ / 8.0+
-- File: data/schema.sql
-- ====================================================================

-- Create database schema if not exists
CREATE DATABASE IF NOT EXISTS ai_chat_assistant;
USE ai_chat_assistant;

-- ----------------------------------------------------
-- 1. Table: sessions
-- Stores active chat sessions, model options, and tuning parameters
-- ----------------------------------------------------
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

-- ----------------------------------------------------
-- 2. Table: messages
-- Stores dialogue histories/messages mapped to their parent session
-- ----------------------------------------------------
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
  ragSources TEXT,
  CONSTRAINT fk_messages_session FOREIGN KEY (sessionId) 
    REFERENCES sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 3. Table: system_prompts
-- Stores customizable character styles, prompt templates, and personas
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS system_prompts (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  isBuiltIn BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------
-- 4. Table: consumption_records
-- Stores smart model execution telemetry, token consumption and estimated cost records
-- ----------------------------------------------------
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
