/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// ==========================================
// MySQL Connection Pool & Helper Integration
// ==========================================

export interface MySqlConfig {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  useDb?: boolean;
}

const configPath = path.join(process.cwd(), "data", "mysql_config.json");

// Loads MySQL credentials either from a dynamic saved template file or falls back to system .env variables
export function loadMySqlConfig(): MySqlConfig {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error reading saved database config from mysql_config.json:", err);
  }
  return {
    host: process.env.MYSQL_HOST || "",
    port: process.env.MYSQL_PORT ? Number(process.env.MYSQL_PORT) : 3306,
    user: process.env.MYSQL_USER || "",
    password: process.env.MYSQL_PASSWORD || "",
    database: process.env.MYSQL_DATABASE || "ai_chat_assistant",
    useDb: false,
  };
}

// Saves custom MySQL database credentials to support live configuring from the React frontend UI
export function saveMySqlConfig(config: MySqlConfig) {
  try {
    const parentDir = path.dirname(configPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database config to mysql_config.json:", err);
  }
}

let dbPool: mysql.Pool | null = null;

// Lazily retrieves or builds the connection pool. Passing a connection configuration forces a pool rebuild.
export function getDbPool(config?: MySqlConfig): mysql.Pool | null {
  const activeConfig = config || loadMySqlConfig();
  if (!activeConfig.host || !activeConfig.user) {
    return null;
  }

  // Reuse existing pool if no custom configuration was requested
  if (dbPool && !config) {
    return dbPool;
  }

  try {
    if (dbPool) {
      dbPool.end().catch(() => {});
    }

    dbPool = mysql.createPool({
      host: activeConfig.host,
      port: activeConfig.port ? Number(activeConfig.port) : 3306,
      user: activeConfig.user,
      password: activeConfig.password,
      database: activeConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 8000,
    });
    return dbPool;
  } catch (err) {
    console.error("Could not instantiate MySQL Connection Pool:", err);
    return null;
  }
}

// REST API: Retrieve active MySQL database configurations and verify current connectivity
app.get("/api/db/config", async (req, res) => {
  const config = loadMySqlConfig();
  let connected = false;
  let connectionError = null;

  const pool = getDbPool(config);
  if (pool) {
    try {
      const conn = await pool.getConnection();
      await conn.query("SELECT 1");
      conn.release();
      connected = true;
    } catch (err: any) {
      connectionError = err?.message || "Connection refused or timed out.";
    }
  }

  // Return masked config to the UI for security and status verification
  res.json({
    success: true,
    config: {
      host: config.host,
      port: config.port,
      user: config.user,
      database: config.database,
      password: config.password ? "••••••••" : "",
      useDb: config.useDb || false,
      connected,
      connectionError,
    },
  });
});

// REST API: Change MySQL configuration parameters dynamically and rebuild connection pool
app.post("/api/db/config", async (req, res) => {
  const { host, port, user, password, database, useDb } = req.body;
  const current = loadMySqlConfig();

  // If password matches mask, don't overwrite the existing plain-text secret
  const finalPassword = password === "••••••••" ? current.password : password;

  const newConfig: MySqlConfig = {
    host: host || current.host,
    port: port ? Number(port) : current.port,
    user: user || current.user,
    password: finalPassword || "",
    database: database || current.database,
    useDb: typeof useDb === "boolean" ? useDb : current.useDb,
  };

  saveMySqlConfig(newConfig);

  // Trigger pool rebuild with new credentials and test right away
  let connected = false;
  let connectionError = null;
  const pool = getDbPool(newConfig);
  if (pool) {
    try {
      const conn = await pool.getConnection();
      await conn.query("SELECT 1");
      conn.release();
      connected = true;
    } catch (err: any) {
      connectionError = err?.message || "Failed to establish a connection with new credentials.";
    }
  }

  res.json({
    success: true,
    message: "MySQL configuration successfully recorded.",
    config: {
      ...newConfig,
      password: newConfig.password ? "••••••••" : "",
      connected,
      connectionError,
    },
  });
});

// REST API: Test connectivity with custom non-saved credentials directly from input fields
app.post("/api/db/test", async (req, res) => {
  const { host, port, user, password, database } = req.body;
  if (!host || !user) {
    return res.status(400).json({ success: false, error: "Host and Username are required to test MySQL connection parameters." });
  }

  let testPool: mysql.Pool | null = null;
  try {
    testPool = mysql.createPool({
      host,
      port: port ? Number(port) : 3306,
      user,
      password,
      database,
      connectTimeout: 5000,
      connectionLimit: 1,
    });

    const conn = await testPool.getConnection();
    await conn.query("SELECT 1");
    conn.release();
    await testPool.end();

    res.json({ success: true, message: "Connected to MySQL successfully! Database is online." });
  } catch (err: any) {
    console.error("Test connection to MySQL failed:", err);
    if (testPool) {
      testPool.end().catch(() => {});
    }
    res.json({ success: false, error: err?.message || "Connection handshake timed out or refused." });
  }
});

// REST API: Create tables in MySQL if they do not exist matching provided SQL statements
app.post("/api/db/init", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not configured. Provide coordinates first." });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    // Execute standard relational tables step-by-step
    const creationQueries = [
      `CREATE TABLE IF NOT EXISTS sessions (
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
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS messages (
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
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS system_prompts (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        prompt TEXT NOT NULL,
        isBuiltIn BOOLEAN DEFAULT FALSE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`,

      `CREATE TABLE IF NOT EXISTS consumption_records (
        id VARCHAR(255) PRIMARY KEY,
        timestamp VARCHAR(100) NOT NULL,
        chatId VARCHAR(255),
        modelId VARCHAR(255) NOT NULL,
        promptTokens INT DEFAULT 0,
        candidateTokens INT DEFAULT 0,
        totalTokens INT DEFAULT 0,
        estimatedCost DOUBLE DEFAULT 0.0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`
    ];

    for (const sql of creationQueries) {
      await connection.query(sql);
    }

    res.json({ success: true, message: "Tables successfully initialized in MySQL." });
  } catch (err: any) {
    console.error("Error creating MySQL schema tables:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to initialize relational MySQL schemas." });
  } finally {
    if (connection) connection.release();
  }
});

// REST API: Load all dialogues, settings, custom characters and consumption records dynamically
app.get("/api/db/data", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL database pool is not configured." });
  }

  try {
    // 1. Fetch system prompts
    const [prompts] = await pool.query(`SELECT * FROM system_prompts`);

    // 2. Fetch consumption logs
    const [records] = await pool.query(`SELECT * FROM consumption_records ORDER BY timestamp DESC`);

    // 3. Fetch dialogue sessions
    const [sessionRows] = await pool.query(`SELECT * FROM sessions ORDER BY createdAt DESC`);

    // 4. Fetch all messages in a fast query
    const [messageRows] = await pool.query(`SELECT * FROM messages ORDER BY timestamp ASC`);

    // Nest messages into their session parent
    const msgsMap: Record<string, any[]> = {};
    for (const msg of (messageRows as any[])) {
      if (!msgsMap[msg.sessionId]) {
        msgsMap[msg.sessionId] = [];
      }
      msgsMap[msg.sessionId].push({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        promptTokens: msg.promptTokens,
        candidateTokens: msg.candidateTokens,
        totalTokens: msg.totalTokens,
        cost: msg.cost,
        isRagContext: Boolean(msg.isRagContext),
        ragSources: msg.ragSources ? JSON.parse(msg.ragSources) : [],
      });
    }

    // Process output types
    const sessions = (sessionRows as any[]).map((row) => ({
      id: row.id,
      title: row.title,
      modelId: row.modelId,
      systemInstructionId: row.systemInstructionId || undefined,
      customSystemInstruction: row.customSystemInstruction || undefined,
      temperature: Number(row.temperature) || 0.7,
      topP: Number(row.topP) || 0.95,
      topK: Number(row.topK) || 40,
      maxOutputTokens: Number(row.maxOutputTokens) || 2048,
      ragEnabled: Boolean(row.ragEnabled),
      ragScope: row.ragScope || "conversation",
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      messages: msgsMap[row.id] || [],
    }));

    const mappedPrompts = (prompts as any[]).map((p) => ({
      id: p.id,
      label: p.label,
      prompt: p.prompt,
      isBuiltIn: Boolean(p.isBuiltIn),
    }));

    const mappedRecords = (records as any[]).map((r) => ({
      id: r.id,
      timestamp: r.timestamp,
      chatId: r.chatId,
      modelId: r.modelId,
      promptTokens: r.promptTokens,
      candidateTokens: r.candidateTokens,
      totalTokens: r.totalTokens,
      estimatedCost: r.estimatedCost,
    }));

    res.json({
      success: true,
      sessions,
      customPrompts: mappedPrompts,
      consumptionRecords: mappedRecords,
    });
  } catch (err: any) {
    console.error("Error reading full MySQL state:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to load MySQL database state. Please check table initialization." });
  }
});

// REST API: Save or update a session with its cascaded messages inside a relational transaction
app.post("/api/db/session", async (req, res) => {
  const { session } = req.body;
  if (!session || !session.id) {
    return res.status(400).json({ success: false, error: "Invalid session object detail." });
  }

  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not configured or active." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const optRag = session.ragEnabled ? 1 : 0;
    await connection.query(
      `INSERT INTO sessions 
       (id, title, modelId, systemInstructionId, customSystemInstruction, temperature, topP, topK, maxOutputTokens, ragEnabled, ragScope, createdAt, updatedAt) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       title = VALUES(title), modelId = VALUES(modelId), systemInstructionId = VALUES(systemInstructionId), 
       customSystemInstruction = VALUES(customSystemInstruction), temperature = VALUES(temperature), topP = VALUES(topP), 
       topK = VALUES(topK), maxOutputTokens = VALUES(maxOutputTokens), ragEnabled = VALUES(ragEnabled), 
       ragScope = VALUES(ragScope), createdAt = VALUES(createdAt), updatedAt = VALUES(updatedAt)`,
      [
        session.id,
        session.title || "",
        session.modelId || "",
        session.systemInstructionId || null,
        session.customSystemInstruction || null,
        Number(session.temperature) || 0.7,
        Number(session.topP) || 0.95,
        Number(session.topK) || 40,
        Number(session.maxOutputTokens) || 2048,
        optRag,
        session.ragScope || "conversation",
        session.createdAt || new Date().toISOString(),
        session.updatedAt || new Date().toISOString(),
      ]
    );

    // Delete existing messages and write standard replacement set
    await connection.query(`DELETE FROM messages WHERE sessionId = ?`, [session.id]);

    if (session.messages && session.messages.length > 0) {
      for (const msg of session.messages) {
        const isRag = msg.isRagContext ? 1 : 0;
        const ragSourcesStr = msg.ragSources ? JSON.stringify(msg.ragSources) : null;
        await connection.query(
          `INSERT INTO messages 
           (id, sessionId, role, content, timestamp, promptTokens, candidateTokens, totalTokens, cost, isRagContext, ragSources) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            msg.id,
            session.id,
            msg.role,
            msg.content || "",
            msg.timestamp || new Date().toISOString(),
            Number(msg.promptTokens) || 0,
            Number(msg.candidateTokens) || 0,
            Number(msg.totalTokens) || 0,
            Number(msg.cost) || 0.0,
            isRag,
            ragSourcesStr,
          ]
        );
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Dialogue and conversations successfully saved to MySQL." });
  } catch (err: any) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }
    console.error("Failed writing chat session to MySQL:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed transaction logic saving dialogue." });
  } finally {
    if (connection) connection.release();
  }
});

// REST API: Delete a single dialogue thread
app.delete("/api/db/session/:id", async (req, res) => {
  const { id } = req.params;
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not configured." });
  }

  try {
    // Delete session (cascade deletes messages automatically!)
    await pool.query(`DELETE FROM sessions WHERE id = ?`, [id]);
    res.json({ success: true, message: "Dialogue session deleted from MySQL." });
  } catch (err: any) {
    console.error("Failed deleting session from MySQL:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to remove dialogue." });
  }
});

// REST API: Save custom system / character setting prompt config
app.post("/api/db/prompt", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || !prompt.id) {
    return res.status(400).json({ success: false, error: "Missing required prompt detail parameters." });
  }

  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not active." });
  }

  try {
    const isBuiltIn = prompt.isBuiltIn ? 1 : 0;
    await pool.query(
      `INSERT INTO system_prompts (id, label, prompt, isBuiltIn) 
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       label = VALUES(label), prompt = VALUES(prompt), isBuiltIn = VALUES(isBuiltIn)`,
      [prompt.id, prompt.label || "", prompt.prompt || "", isBuiltIn]
    );
    res.json({ success: true, message: "Character prompt setting synced to MySQL." });
  } catch (err: any) {
    console.error("Failed writing prompt config to MySQL:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed writing prompt configurations." });
  }
});

// REST API: Delete custom system / character setting prompt
app.delete("/api/db/prompt/:id", async (req, res) => {
  const { id } = req.params;
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not active." });
  }

  try {
    await pool.query(`DELETE FROM system_prompts WHERE id = ?`, [id]);
    res.json({ success: true, message: "Character custom setting deleted from MySQL." });
  } catch (err: any) {
    console.error("Failed deleting prompt from MySQL:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed deleting prompt." });
  }
});

// REST API: Add a consumption record to the database
app.post("/api/db/consumption", async (req, res) => {
  const { record } = req.body;
  if (!record || !record.id) {
    return res.status(400).json({ success: false, error: "Invalid consumption record object." });
  }

  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not active." });
  }

  try {
    await pool.query(
      `INSERT INTO consumption_records (id, timestamp, chatId, modelId, promptTokens, candidateTokens, totalTokens, estimatedCost) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
       timestamp = VALUES(timestamp), chatId = VALUES(chatId), modelId = VALUES(modelId), 
       promptTokens = VALUES(promptTokens), candidateTokens = VALUES(candidateTokens), 
       totalTokens = VALUES(totalTokens), estimatedCost = VALUES(estimatedCost)`,
      [
        record.id,
        record.timestamp || new Date().toISOString(),
        record.chatId || null,
        record.modelId || "",
        Number(record.promptTokens) || 0,
        Number(record.candidateTokens) || 0,
        Number(record.totalTokens) || 0,
        Number(record.estimatedCost) || 0.0,
      ]
    );
    res.json({ success: true, message: "Telemetry consumption record logged in MySQL." });
  } catch (err: any) {
    console.error("Failed saving consumption log to MySQL:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed to record transaction telemetry." });
  }
});

// REST API: Clear out the entire consumption history from database
app.post("/api/db/clear-consumption", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not active." });
  }

  try {
    await pool.query(`DELETE FROM consumption_records`);
    res.json({ success: true, message: "All transactions logs cleared from MySQL." });
  } catch (err: any) {
    console.error("Failed clearing consumption logs in MySQL:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed clearing consumption logs." });
  }
});

// REST API: Sync complete browser template states to MySQL database in one unified push
app.post("/api/db/sync-to-mysql", async (req, res) => {
  const { sessions, customPrompts, consumptionRecords } = req.body;
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not configured or active." });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Sync custom system prompts
    if (Array.isArray(customPrompts)) {
      for (const p of customPrompts) {
        const isBuiltIn = p.isBuiltIn ? 1 : 0;
        await connection.query(
          `INSERT INTO system_prompts (id, label, prompt, isBuiltIn) 
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           label = VALUES(label), prompt = VALUES(prompt), isBuiltIn = VALUES(isBuiltIn)`,
          [p.id, p.label || "", p.prompt || "", isBuiltIn]
        );
      }
    }

    // 2. Sync consumption records
    if (Array.isArray(consumptionRecords)) {
      for (const r of consumptionRecords) {
        await connection.query(
          `INSERT INTO consumption_records (id, timestamp, chatId, modelId, promptTokens, candidateTokens, totalTokens, estimatedCost) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           timestamp = VALUES(timestamp), chatId = VALUES(chatId), modelId = VALUES(modelId), 
           promptTokens = VALUES(promptTokens), candidateTokens = VALUES(candidateTokens), 
           totalTokens = VALUES(totalTokens), estimatedCost = VALUES(estimatedCost)`,
          [
            r.id,
            r.timestamp || new Date().toISOString(),
            r.chatId || null,
            r.modelId || "",
            Number(r.promptTokens) || 0,
            Number(r.candidateTokens) || 0,
            Number(r.totalTokens) || 0,
            Number(r.estimatedCost) || 0.0,
          ]
        );
      }
    }

    // 3. Sync sessions and messages
    if (Array.isArray(sessions)) {
      for (const sess of sessions) {
        const optRag = sess.ragEnabled ? 1 : 0;
        await connection.query(
          `INSERT INTO sessions 
           (id, title, modelId, systemInstructionId, customSystemInstruction, temperature, topP, topK, maxOutputTokens, ragEnabled, ragScope, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE 
           title = VALUES(title), modelId = VALUES(modelId), systemInstructionId = VALUES(systemInstructionId), 
           customSystemInstruction = VALUES(customSystemInstruction), temperature = VALUES(temperature), topP = VALUES(topP), 
           topK = VALUES(topK), maxOutputTokens = VALUES(maxOutputTokens), ragEnabled = VALUES(ragEnabled), 
           ragScope = VALUES(ragScope), createdAt = VALUES(createdAt), updatedAt = VALUES(updatedAt)`,
          [
            sess.id,
            sess.title || "",
            sess.modelId || "",
            sess.systemInstructionId || null,
            sess.customSystemInstruction || null,
            Number(sess.temperature) || 0.7,
            Number(sess.topP) || 0.95,
            Number(sess.topK) || 40,
            Number(sess.maxOutputTokens) || 2048,
            optRag,
            sess.ragScope || "conversation",
            sess.createdAt || new Date().toISOString(),
            sess.updatedAt || new Date().toISOString(),
          ]
        );

        // Reset and insert correct messages
        await connection.query(`DELETE FROM messages WHERE sessionId = ?`, [sess.id]);

        if (sess.messages && sess.messages.length > 0) {
          for (const msg of sess.messages) {
            const isRag = msg.isRagContext ? 1 : 0;
            const ragSourcesStr = msg.ragSources ? JSON.stringify(msg.ragSources) : null;
            await connection.query(
              `INSERT INTO messages 
               (id, sessionId, role, content, timestamp, promptTokens, candidateTokens, totalTokens, cost, isRagContext, ragSources) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                msg.id,
                sess.id,
                msg.role,
                msg.content || "",
                msg.timestamp || new Date().toISOString(),
                Number(msg.promptTokens) || 0,
                Number(msg.candidateTokens) || 0,
                Number(msg.totalTokens) || 0,
                Number(msg.cost) || 0.0,
                isRag,
                ragSourcesStr,
              ]
            );
          }
        }
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Offline browser storage data successfully synchronized into relational MySQL tables!" });
  } catch (err: any) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }
    console.error("Bulk sync state to database transaction logic failed:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed bulk synchronizing offline states." });
  } finally {
    if (connection) connection.release();
  }
});

// REST API: Delete all MySQL records
app.post("/api/db/clear-all", async (req, res) => {
  const pool = getDbPool();
  if (!pool) {
    return res.status(500).json({ success: false, error: "MySQL Database not active." });
  }

  try {
    await pool.query(`DELETE FROM consumption_records`);
    await pool.query(`DELETE FROM system_prompts`);
    await pool.query(`DELETE FROM sessions`); // will cascade delete messages automatically!
    res.json({ success: true, message: "Cleared all tables in MySQL successfully." });
  } catch (err: any) {
    console.error("Failed resetting MySQL data tables:", err);
    res.status(500).json({ success: false, error: err?.message || "Failed database clearing operatics." });
  }
});

// Initialize GoogleGenAI client lazily to prevent crashing if the key is missing on start
let b_aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!b_aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but was not found. Please set it in Settings > Secrets.");
    }
    b_aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return b_aiClient;
}

function getGeminiClient(customKey?: string): GoogleGenAI {
  if (customKey) {
    return new GoogleGenAI({
      apiKey: customKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return getAiClient();
}

// API endpoint: Get live conversable models from the Gemini API and other providers
app.get("/api/models", async (req, res) => {
  const geminiKey = (req.headers["x-gemini-key"] as string) || process.env.GEMINI_API_KEY;
  const openaiKey = req.headers["x-openai-key"] as string;
  const openaiBase = (req.headers["x-openai-base"] as string) || "https://api.openai.com/v1";

  const conversableModels: any[] = [];

  // 1. Fetch Gemini models dynamically
  if (geminiKey) {
    try {
      const ai = getGeminiClient(geminiKey);
      const listResponse = await ai.models.list();
      for (const model of (listResponse as any)) {
        const isConversable = 
          model.supportedGenerationMethods?.includes("generateContent") &&
          !model.name?.includes("embed") &&
          !model.name?.includes("vision") &&
          !model.name?.includes("classifier");
        if (isConversable) {
          conversableModels.push({
            id: model.name?.replace("models/", "") || "",
            name: model.displayName || model.name || "",
            description: model.description || "Inference model obtained from Google Gemini.",
            provider: "gemini",
            inputCostPerMillion: 0.075,
            outputCostPerMillion: 0.30,
            isConversable: true
          });
        }
      }
    } catch (error: any) {
      console.log("Skipped loading dynamic Gemini model listings: API key not valid or configured.");
    }
  }

  // 2. Fetch OpenAI models if key is configured
  if (openaiKey) {
    try {
      const response = await fetch(`${openaiBase}/models`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${openaiKey}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          // Filter out and add clean chat completions models
          data.data.forEach((m: any) => {
            const id = m.id;
            const isChatModel = id.startsWith("gpt") || id.startsWith("o1") || id.includes("chat") || id.includes("instruct");
            if (isChatModel) {
              conversableModels.push({
                id: id,
                name: id.toUpperCase().replace("-", " "),
                description: `Dynamic model obtained from Custom OpenAI Endpoint.`,
                provider: "openai",
                inputCostPerMillion: id.includes("mini") ? 0.15 : 2.50,
                outputCostPerMillion: id.includes("mini") ? 0.60 : 10.00,
                isConversable: true
              });
            }
          });
        }
      }
    } catch (error: any) {
      console.log("Skipped loading dynamic OpenAI model listings: endpoint unavailable.");
    }
  }

  // Fallback static high-fidelity catalogue profiles so models are always available immediately
  const catalogList = [
    { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", description: "Default, recommended ultra-fast model for core assistant tasks, smart RAG embeddings proxy support, and fast dialogues.", provider: "gemini", inputCostPerMillion: 0.075, outputCostPerMillion: 0.30, isConversable: true },
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro (Preview)", description: "Premium model for highly intelligent reasoning tasks including advanced code synthesis.", provider: "gemini", inputCostPerMillion: 1.25, outputCostPerMillion: 5.00, isConversable: true },
    { id: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash Lite", description: "Extremely fast, streamlined model ideal for highly interactive, latency-critical text chats.", provider: "gemini", inputCostPerMillion: 0.0375, outputCostPerMillion: 0.15, isConversable: true },
    { id: "gpt-4o", name: "GPT 4o (Omni)", description: "Flagship high intelligence model from OpenAI for coding and multi-turn planning.", provider: "openai", inputCostPerMillion: 2.50, outputCostPerMillion: 10.00, isConversable: true },
    { id: "gpt-4o-mini", name: "GPT 4o Mini", description: "Surgical, lightweight model with low pricing rates and fast interactive generation.", provider: "openai", inputCostPerMillion: 0.15, outputCostPerMillion: 0.60, isConversable: true },
    { id: "claude-3-5-sonnet-latest", name: "Claude 3.5 Sonnet", description: "State-of-the-art coding and reasoning flagship model from Anthropic.", provider: "anthropic", inputCostPerMillion: 3.00, outputCostPerMillion: 15.00, isConversable: true },
    { id: "claude-3-5-haiku-latest", name: "Claude 3.5 Haiku", description: "Incredibly fast instruction follower and structured formatting agent.", provider: "anthropic", inputCostPerMillion: 0.80, outputCostPerMillion: 4.00, isConversable: true },
    { id: "deepseek-chat", name: "DeepSeek Chat (V3)", description: "Powerful reasoning and conversational standard model from DeepSeek.", provider: "deepseek", inputCostPerMillion: 0.14, outputCostPerMillion: 0.28, isConversable: true },
    { id: "deepseek-coder", name: "DeepSeek Coder (R1)", description: "Highly logical coder and chain-of-thought verification model from DeepSeek.", provider: "deepseek", inputCostPerMillion: 0.55, outputCostPerMillion: 2.19, isConversable: true }
  ];

  // Merge static catalogues gracefully
  catalogList.forEach(item => {
    if (!conversableModels.some(m => m.id === item.id)) {
      conversableModels.push(item);
    }
  });

  // Strict visual deduplication by model ID
  const uniqueModels = conversableModels.filter((model, idx, self) => {
    return model && model.id && self.findIndex(m => m.id === model.id) === idx;
  });

  res.json({ success: true, models: uniqueModels });
});

// API endpoint: Multi-provider prompt generation or conversational block
app.post("/api/chat", async (req, res) => {
  const { model, history, systemInstruction, temperature, topP, topK, maxOutputTokens, provider: clientProvider } = req.body;

  if (!history || !Array.isArray(history)) {
    return res.status(400).json({ success: false, error: "Missing or invalid 'history' parameter." });
  }

  // Dynamic automatic provider inference
  let provider = clientProvider || "gemini";
  if (!clientProvider) {
    const md = model || "gemini-3.5-flash";
    if (md.startsWith("gpt") || md.startsWith("o1") || md.includes("openai")) {
      provider = "openai";
    } else if (md.startsWith("claude") || md.includes("anthropic")) {
      provider = "anthropic";
    } else if (md.includes("deepseek")) {
      provider = "deepseek";
    } else {
      provider = "gemini";
    }
  }

  try {
    const activeModel = model || "gemini-3.5-flash";
    const activeTemp = typeof temperature === "number" ? temperature : 0.7;
    const activeMaxTokens = typeof maxOutputTokens === "number" ? maxOutputTokens : 2048;

    if (provider === "gemini") {
      const customKey = req.headers["x-gemini-key"] as string;
      const ai = getGeminiClient(customKey);

      // Build contents schema conformant to @google/genai SDK
      const formattedContents = history.map((msg: any) => {
        return {
          role: msg.role === "model" ? "model" : "user",
          parts: [{ text: msg.content }]
        };
      });

      const response = await ai.models.generateContent({
        model: activeModel,
        contents: formattedContents,
        config: {
          systemInstruction: systemInstruction || undefined,
          temperature: activeTemp,
          topP: typeof topP === "number" ? topP : 0.95,
          topK: typeof topK === "number" ? topK : 40,
          maxOutputTokens: activeMaxTokens,
        },
      });

      const text = response.text || "";
      const promptTokens = response.usageMetadata?.promptTokenCount || 0;
      const candidateTokens = response.usageMetadata?.candidatesTokenCount || 0;
      const totalTokens = response.usageMetadata?.totalTokenCount || 0;

      return res.json({
        success: true,
        text,
        promptTokens,
        candidateTokens,
        totalTokens,
      });

    } else if (provider === "openai" || provider === "deepseek") {
      let apiKey = "";
      let baseUrl = "";

      if (provider === "deepseek") {
        apiKey = (req.headers["x-deepseek-key"] as string) || (req.headers["x-openai-key"] as string) || "";
        baseUrl = "https://api.deepseek.com/v1";
      } else {
        apiKey = req.headers["x-openai-key"] as string;
        baseUrl = (req.headers["x-openai-base"] as string) || "https://api.openai.com/v1";
      }

      if (!apiKey) {
        throw new Error(`API Key for provider '${provider}' is required but was not found. Please set your credentials in App Settings.`);
      }

      // Format messages conformant to OpenAI style
      const messages = history.map((msg: any) => ({
        role: msg.role === "model" ? "assistant" : msg.role,
        content: msg.content
      }));

      if (systemInstruction) {
        messages.unshift({
          role: "system",
          content: systemInstruction
        });
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: activeModel,
          messages,
          temperature: activeTemp,
          max_tokens: activeMaxTokens,
          top_p: typeof topP === "number" ? topP : 1.0
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Provider ${provider} returned API Error (${response.status}): ${response.statusText}`);
      }

      const text = data.choices?.[0]?.message?.content || "";
      const promptTokens = data.usage?.prompt_tokens || 0;
      const candidateTokens = data.usage?.completion_tokens || 0;
      const totalTokens = data.usage?.total_tokens || 0;

      return res.json({
        success: true,
        text,
        promptTokens,
        candidateTokens,
        totalTokens,
      });

    } else if (provider === "anthropic") {
      const apiKey = req.headers["x-api-key"] || req.headers["x-anthropic-key"] as string;
      if (!apiKey) {
        throw new Error("Anthropic API Key is required but was not found. Please set your credentials in App Settings.");
      }

      const messages = history
        .filter((msg: any) => msg.role !== "system")
        .map((msg: any) => ({
          role: msg.role === "model" ? "assistant" : "user",
          content: msg.content
        }));

      const bodyData: any = {
        model: activeModel,
        messages,
        max_tokens: activeMaxTokens,
        temperature: activeTemp
      };

      if (systemInstruction) {
        bodyData.system = systemInstruction;
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey as string,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-profiles-allowed": "true"
        },
        body: JSON.stringify(bodyData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || `Anthropic returned API Error: ${response.statusText}`);
      }

      const text = data.content?.[0]?.text || "";
      const promptTokens = data.usage?.input_tokens || 0;
      const candidateTokens = data.usage?.output_tokens || 0;
      const totalTokens = promptTokens + candidateTokens;

      return res.json({
        success: true,
        text,
        promptTokens,
        candidateTokens,
        totalTokens,
      });
    }

    throw new Error(`Unsupported provider algorithm targeting context: '${provider}'`);
  } catch (error: any) {
    console.error("Error generating content via backend dispatcher:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "An error occurred while generating a response from the selected LLM provider.",
    });
  }
});

// API endpoint: Generate Vector Embeddings for a given text or list of texts with credential header support
app.post("/api/embed", async (req, res) => {
  const { texts } = req.body;

  if (!texts || (!Array.isArray(texts) && typeof texts !== "string")) {
    return res.status(400).json({ success: false, error: "Missing or invalid 'texts' parameter." });
  }

  try {
    const customKey = req.headers["x-gemini-key"] as string;
    const ai = getGeminiClient(customKey);
    const inputTexts = Array.isArray(texts) ? texts : [texts];
    
    const embeddingsList: number[][] = [];
    for (const text of inputTexts) {
      if (!text.trim()) {
        embeddingsList.push(new Array(768).fill(0));
        continue;
      }
      const response = await ai.models.embedContent({
        model: "gemini-embedding-2-preview",
        contents: text,
      });

      const vals = (response as any).embedding?.values || (response as any).embeddings?.[0]?.values;
      if (vals && Array.isArray(vals)) {
        embeddingsList.push(vals);
      } else {
        embeddingsList.push(new Array(768).fill(0));
      }
    }

    res.json({
      success: true,
      embeddings: Array.isArray(texts) ? embeddingsList : embeddingsList[0],
    });
  } catch (error: any) {
    console.error("Error generating embeddings via on-demand API:", error);
    res.status(500).json({
      success: false,
      error: error?.message || "An error occurred during vector embedding extraction.",
    });
  }
});

// Sync data endpoint: Push state to personal cloud synchronization node
const syncDir = path.join(process.cwd(), "data");
if (!fs.existsSync(syncDir)) {
  fs.mkdirSync(syncDir, { recursive: true });
}

app.post("/api/sync/:key", (req, res) => {
  const { key } = req.params;
  const backupData = req.body;

  if (!key || key.length < 4) {
    return res.status(400).json({ success: false, error: "Sync key is too short or invalid." });
  }

  try {
    const filename = path.join(syncDir, `sync_${key}.json`);
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2), "utf8");
    res.json({ success: true, message: `Backup uploaded successfully under key '${key}'.` });
  } catch (error: any) {
    console.error("Sync backup upload failure:", error);
    res.status(500).json({ success: false, error: "Could not persist backup on-server." });
  }
});

// Sync data endpoint: Pull state from personal cloud synchronization node
app.get("/api/sync/:key", (req, res) => {
  const { key } = req.params;

  if (!key) {
    return res.status(400).json({ success: false, error: "Sync key parameter required." });
  }

  try {
    const filename = path.join(syncDir, `sync_${key}.json`);
    if (!fs.existsSync(filename)) {
      return res.status(444).json({ success: false, error: "No backup was found for this code key." });
    }

    const fileContent = fs.readFileSync(filename, "utf8");
    const data = JSON.parse(fileContent);
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Sync backup fetch failure:", error);
    res.status(500).json({ success: false, error: "Failed to download backup." });
  }
});

// Integrate Vite Dev Server in dev mode, serve static build in production
async function runServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode serving static layout...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AI Chat & RAG Assistant Server listening at http://localhost:${PORT}`);
  });
}

runServer().catch((err) => {
  console.error("Fatal error during starting Express Vite Server:", err);
});
