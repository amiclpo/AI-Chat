/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { 
  BrainCircuit, 
  Database, 
  Settings, 
  MessageSquare, 
  Activity, 
  Sun, 
  Moon, 
  Smartphone, 
  HelpCircle,
  FolderOpen,
  Plus,
  Globe,
  Monitor,
  Laptop,
  Cpu,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { ChatSession, Message, SystemPrompt, ConsumptionRecord, VectorRecord, RagSource } from "./types";
import { Sidebar } from "./components/Sidebar";
import { ChatArea } from "./components/ChatArea";
import { StatsDashboard } from "./components/StatsDashboard";
import { SettingsPanel } from "./components/SettingsPanel";
import { SubFunctionsPanel } from "./components/SubFunctionsPanel";
import { AdminPanel } from "./components/AdminPanel";
import { REF_MODELS, BUILT_IN_PROMPTS, INITIAL_USER_CONFIG } from "./lib/data";
import { localVectorDb } from "./lib/vectorDb";
import { generateUUID } from "./lib/uuid";
import { Language, LANGUAGES, getTranslation } from "./lib/translations";

export function getConversationTitle(num: number): string {
  const words = [
    "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty",
    "Twenty-One", "Twenty-Two", "Twenty-Three", "Twenty-Four", "Twenty-Five", "Twenty-Six", "Twenty-Seven", "Twenty-Eight", "Twenty-Nine", "Thirty"
  ];
  if (num >= 1 && num <= words.length) {
    return `Conversation ${words[num - 1]}`;
  }
  return `Conversation ${num}`;
}

export default function App() {
  // Navigation Tabs State
  const [activeTab, setActiveTab] = useState<"chat" | "stats" | "settings" | "tools" | "admin">("chat");
  const [deviceMode, setDeviceMode] = useState<"auto" | "desktop" | "android">("auto");
  const [isRealMobile, setIsRealMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // 1024px is standard breakpoint for sidebar vs overlay
      setIsRealMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // App Layout State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [language, setLanguage] = useState<Language>("en");

  // Core Data States
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [customPrompts, setCustomPrompts] = useState<SystemPrompt[]>([]);
  const [consumptionRecords, setConsumptionRecords] = useState<ConsumptionRecord[]>([]);
  const [vectorCount, setVectorCount] = useState(0);
  
  // MySQL Database sync state
  const [useMysql, setUseMysql] = useState(() => {
    return localStorage.getItem("AIChatLocalRAG_UseMysql") === "true";
  });

  // API key configurations and providers
  const [geminiApiKey, setGeminiApiKeyState] = useState("");
  const [openaiApiKey, setOpenaiApiKeyState] = useState("");
  const [openaiBaseUrl, setOpenaiBaseUrlState] = useState("https://api.openai.com/v1");
  const [anthropicApiKey, setAnthropicApiKeyState] = useState("");
  const [deepseekApiKey, setDeepseekApiKeyState] = useState("");
  const [availableModels, setAvailableModels] = useState<any[]>(REF_MODELS);

  const setGeminiApiKey = (val: string) => {
    setGeminiApiKeyState(val);
    localStorage.setItem("AIChatLocalRAG_GeminiKey", val);
  };
  const setOpenaiApiKey = (val: string) => {
    setOpenaiApiKeyState(val);
    localStorage.setItem("AIChatLocalRAG_OpenaiKey", val);
  };
  const setOpenaiBaseUrl = (val: string) => {
    setOpenaiBaseUrlState(val || "https://api.openai.com/v1");
    localStorage.setItem("AIChatLocalRAG_OpenaiBase", val || "https://api.openai.com/v1");
  };
  const setAnthropicApiKey = (val: string) => {
    setAnthropicApiKeyState(val);
    localStorage.setItem("AIChatLocalRAG_AnthropicKey", val);
  };
  const setDeepseekApiKey = (val: string) => {
    setDeepseekApiKeyState(val);
    localStorage.setItem("AIChatLocalRAG_DeepseekKey", val);
  };

  const fetchAvailableModels = async (gKey?: string, oKey?: string, oBase?: string) => {
    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      const activeG = typeof gKey === "string" ? gKey : (localStorage.getItem("AIChatLocalRAG_GeminiKey") || "");
      const activeO = typeof oKey === "string" ? oKey : (localStorage.getItem("AIChatLocalRAG_OpenaiKey") || "");
      const activeOBase = typeof oBase === "string" ? oBase : (localStorage.getItem("AIChatLocalRAG_OpenaiBase") || "https://api.openai.com/v1");
      
      if (activeG) headers["x-gemini-key"] = activeG;
      if (activeO) headers["x-openai-key"] = activeO;
      if (activeOBase) headers["x-openai-base"] = activeOBase;

      const res = await fetch("/api/models", { headers });
      const data = await res.json();
      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        const uniqueModels = data.models.filter((m: any, idx: number, self: any[]) => {
          return m && m.id && self.findIndex(x => x.id === m.id) === idx;
        });
        setAvailableModels(uniqueModels);
      }
    } catch (err) {
      console.warn("Unable to fetch available models, relying on catalog.", err);
    }
  };

  // Parameter Configuration State
  const [temperature, setTemperature] = useState(INITIAL_USER_CONFIG.temperature);
  const [topP, setTopP] = useState(INITIAL_USER_CONFIG.topP);
  const [topK, setTopK] = useState(INITIAL_USER_CONFIG.topK);
  const [maxOutputTokens, setMaxOutputTokens] = useState(INITIAL_USER_CONFIG.maxOutputTokens);
  const [ragEnabled, setRagEnabled] = useState(INITIAL_USER_CONFIG.ragEnabled);
  const [ragSourceCount, setRagSourceCount] = useState(INITIAL_USER_CONFIG.ragSourceCount);
  const [ragSimilarityThreshold, setRagSimilarityThreshold] = useState(INITIAL_USER_CONFIG.ragSimilarityThreshold);

  // Loading indicator for chats
  const [isLoading, setIsLoading] = useState(false);

  // Initialize and load saved environments on mount
  useEffect(() => {
    // 0. Language Configuration
    const savedLanguage = localStorage.getItem("AIChatLocalRAG_Language") as Language || "en";
    setLanguage(savedLanguage);

    // 1. Theme Configuration
    const savedTheme = localStorage.getItem("AIChatLocalRAG_Theme") as "dark" | "light" || "dark";
    setTheme(savedTheme);
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

    // 2. Reload private credential parameters
    const gKey = localStorage.getItem("AIChatLocalRAG_GeminiKey") || "";
    setGeminiApiKeyState(gKey);

    const oKey = localStorage.getItem("AIChatLocalRAG_OpenaiKey") || "";
    setOpenaiApiKeyState(oKey);

    const oBase = localStorage.getItem("AIChatLocalRAG_OpenaiBase") || "https://api.openai.com/v1";
    setOpenaiBaseUrlState(oBase);

    const aKey = localStorage.getItem("AIChatLocalRAG_AnthropicKey") || "";
    setAnthropicApiKeyState(aKey);

    const dKey = localStorage.getItem("AIChatLocalRAG_DeepseekKey") || "";
    setDeepseekApiKeyState(dKey);

    // 3. Conditional initialization: load from MySQL server if enabled; otherwise default to localStorage
    const savedUseMysql = localStorage.getItem("AIChatLocalRAG_UseMysql") === "true";
    if (savedUseMysql) {
      loadAllDataFromDb();
    } else {
      // Load custom system instructions prompts from browser
      const savedPrompts = localStorage.getItem("AIChatLocalRAG_CustomPrompts");
      if (savedPrompts) {
        try {
          setCustomPrompts(JSON.parse(savedPrompts));
        } catch (e) {
          console.error("Failed loading custom prompts:", e);
        }
      }

      // Load metrics telemetry logs from browser
      const savedTelemetry = localStorage.getItem("AIChatLocalRAG_ConsumptionRecords");
      if (savedTelemetry) {
        try {
          setConsumptionRecords(JSON.parse(savedTelemetry));
        } catch (e) {
          console.error("Failed loading consumption metadata:", e);
        }
      }

      // Load dialogues and active chats from browser
      const savedSessions = localStorage.getItem("AIChatLocalRAG_Sessions");
      let loadedSessions: ChatSession[] = [];
      if (savedSessions) {
        try {
          const decoded = JSON.parse(savedSessions);
          if (Array.isArray(decoded)) {
            loadedSessions = decoded;
          }
        } catch (e) {
          console.error("Failed unpacking chat sessions:", e);
        }
      }

      loadedSessions = loadedSessions.map((sess: ChatSession, idx: number) => {
        if (sess.title.startsWith("Personal Chat #") || !sess.title.trim() || sess.title.startsWith("Dialogue #")) {
          return {
            ...sess,
            title: getConversationTitle(loadedSessions.length - idx)
          };
        }
        return sess;
      });

      if (loadedSessions.length === 0) {
        const firstId = generateUUID();
        const firstSess: ChatSession = {
          id: firstId,
          title: "Conversation One",
          modelId: "gemini-3.5-flash",
          systemInstructionId: "prompt-helpful",
          temperature: INITIAL_USER_CONFIG.temperature,
          topP: INITIAL_USER_CONFIG.topP,
          topK: INITIAL_USER_CONFIG.topK,
          maxOutputTokens: INITIAL_USER_CONFIG.maxOutputTokens,
          ragEnabled: INITIAL_USER_CONFIG.ragEnabled,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [],
        };
        loadedSessions = [firstSess];
        localStorage.setItem("AIChatLocalRAG_Sessions", JSON.stringify(loadedSessions));
      }

      setSessions(loadedSessions);
      if (loadedSessions.length > 0) {
        setActiveSessionId(loadedSessions[0].id);
      }
    }

    // 4. Initialize local vectors client
    localVectorDb.init().then(() => {
      refreshVectorCount();
    });
  }, []);

  // Trigger models update automatically upon core keys transitions
  useEffect(() => {
    fetchAvailableModels(geminiApiKey, openaiApiKey, openaiBaseUrl);
  }, [geminiApiKey, openaiApiKey, openaiBaseUrl]);

  // Guard the active session selection to ensure it never becomes orphaned
  useEffect(() => {
    if (sessions.length > 0) {
      const exists = sessions.some((s) => s.id === activeSessionId);
      if (!exists || !activeSessionId) {
        setActiveSessionId(sessions[0].id);
      }
    } else {
      setActiveSessionId(null);
    }
  }, [sessions, activeSessionId]);

  // Loads all data (dialogues, custom system prompts, metrics) directly from relational MySQL APIs
  const loadAllDataFromDb = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/db/data");
      const data = await res.json();
      if (data.success) {
        if (data.sessions && data.sessions.length > 0) {
          setSessions(data.sessions);
          // Only pull activeSessionId forward if it exists in current DB returned sessions list
          const activeExists = data.sessions.some((s: any) => s.id === activeSessionId);
          if (!activeExists && data.sessions.length > 0) {
            setActiveSessionId(data.sessions[0].id);
          }
        } else {
          // Relational db contains zero dialogues yet: seed one initial conversation
          const firstId = generateUUID();
          const firstSess: ChatSession = {
            id: firstId,
            title: "Conversation One",
            modelId: "gemini-3.5-flash",
            systemInstructionId: "prompt-helpful",
            temperature: temperature || 0.7,
            topP: topP || 0.95,
            topK: topK || 40,
            maxOutputTokens: maxOutputTokens || 2048,
            ragEnabled: ragEnabled || false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [],
          };
          setSessions([firstSess]);
          setActiveSessionId(firstId);
          
          await fetch("/api/db/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ session: firstSess })
          });
        }
        
        if (data.customPrompts) {
          setCustomPrompts(data.customPrompts);
        }
        if (data.consumptionRecords) {
          setConsumptionRecords(data.consumptionRecords);
        }
      }
    } catch (err) {
      console.error("Critical error downloading state from database pool:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Save changes to localStorage with async relay writes to MySQL if enabled
  const saveSessions = (updatedSessions: ChatSession[], changedSessionId?: string) => {
    setSessions(updatedSessions);
    localStorage.setItem("AIChatLocalRAG_Sessions", JSON.stringify(updatedSessions));

    if (useMysql) {
      const targetId = changedSessionId || activeSessionId;
      const target = updatedSessions.find(s => s.id === targetId);
      if (target) {
        fetch("/api/db/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ session: target })
        }).catch(err => console.error("MySQL background session update failed:", err));
      }
    }
  };

  const saveCustomPrompts = (updatedPrompts: SystemPrompt[], singlePromptToSync?: SystemPrompt, deleteId?: string) => {
    setCustomPrompts(updatedPrompts);
    localStorage.setItem("AIChatLocalRAG_CustomPrompts", JSON.stringify(updatedPrompts));

    if (useMysql) {
      if (deleteId) {
        fetch(`/api/db/prompt/${deleteId}`, { method: "DELETE" })
          .catch(err => console.error("MySQL background custom prompt delete failed:", err));
      } else if (singlePromptToSync) {
        fetch("/api/db/prompt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: singlePromptToSync })
        }).catch(err => console.error("MySQL background custom prompt sync failed:", err));
      }
    }
  };

  const saveConsumptionRecords = (updatedRecords: ConsumptionRecord[], singleRecordToSync?: ConsumptionRecord) => {
    setConsumptionRecords(updatedRecords);
    localStorage.setItem("AIChatLocalRAG_ConsumptionRecords", JSON.stringify(updatedRecords));

    if (useMysql && singleRecordToSync) {
      fetch("/api/db/consumption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ record: singleRecordToSync })
      }).catch(err => console.error("MySQL background consumption record sync failed:", err));
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("AIChatLocalRAG_Language", lang);
  };

  // Live vectors status updater
  const refreshVectorCount = async () => {
    try {
      const cnt = await localVectorDb.getRecordCount();
      setVectorCount(cnt);
    } catch (e) {
      setVectorCount(0);
    }
  };

  // Dark/Light Theme swapper
  const toggleTheme = () => {
    const target = theme === "dark" ? "light" : "dark";
    setTheme(target);
    localStorage.setItem("AIChatLocalRAG_Theme", target);
    if (target === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Find active session object
  const activeSession = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Session Handlers
  const handleNewSession = () => {
    const newId = generateUUID();
    const newSess: ChatSession = {
      id: newId,
      title: getConversationTitle(sessions.length + 1),
      modelId: "gemini-3.5-flash",
      systemInstructionId: "prompt-helpful",
      temperature: temperature,
      topP: topP,
      topK: topK,
      maxOutputTokens: maxOutputTokens,
      ragEnabled: ragEnabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    const nextSessions = [newSess, ...sessions];
    saveSessions(nextSessions);
    setActiveSessionId(newId);
    setActiveTab("chat");
  };

  const handleDeleteSession = async (id: string) => {
    const nextSessions = sessions.filter((s) => s.id !== id);
    saveSessions(nextSessions);
    
    if (useMysql) {
      try {
        await fetch(`/api/db/session/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("MySQL delete session error:", err);
      }
    }
    
    // Clean related vectors asynchronously to optimize storage memory
    try {
      await localVectorDb.deleteVectorsForChat(id);
      refreshVectorCount();
    } catch (err) {
      console.error("Clean vector references error:", err);
    }

    if (activeSessionId === id) {
      if (nextSessions.length > 0) {
        setActiveSessionId(nextSessions[0].id);
      } else {
        setActiveSessionId(null);
      }
    }
  };

  const handleChangeSessionModel = (modelId: string) => {
    if (!activeSessionId) return;
    const nextList = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, modelId, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSessions(nextList);
  };

  const handleChangeSessionSystemPromptRef = (promptId: string) => {
    if (!activeSessionId) return;
    const nextList = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, systemInstructionId: promptId, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSessions(nextList);
  };

  const handleToggleSessionRag = () => {
    if (!activeSessionId) return;
    const nextList = sessions.map((s) => {
      if (s.id === activeSessionId) {
        const nextVal = !s.ragEnabled;
        // Keep in sync with general slider config
        setRagEnabled(nextVal);
        return { ...s, ragEnabled: nextVal, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSessions(nextList);
  };

  const handleUpdateActiveSessionParams = (params: Partial<ChatSession>) => {
    if (!activeSessionId) return;
    const nextList = sessions.map((s) => {
      if (s.id === activeSessionId) {
        return { ...s, ...params, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSessions(nextList);
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const nextList = sessions.map((s) => {
      if (s.id === id) {
        return { ...s, title: newTitle, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSessions(nextList);
  };

  const handleClearAllSessions = async () => {
    saveSessions([]);
    setActiveSessionId(null);
    try {
      await localVectorDb.clearAll();
      refreshVectorCount();
    } catch (err) {
      console.warn("Wiping vectors failed:", err);
    }
  };

  const handleCreateSessionWithParams = (title: string, modelId: string, systemPromptId: string) => {
    const newId = generateUUID();
    const newSess: ChatSession = {
      id: newId,
      title: title || getConversationTitle(sessions.length + 1),
      modelId: modelId || "gemini-3.5-flash",
      systemInstructionId: systemPromptId || "prompt-helpful",
      temperature: temperature,
      topP: topP,
      topK: topK,
      maxOutputTokens: maxOutputTokens,
      ragEnabled: ragEnabled,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };

    const nextSessions = [newSess, ...sessions];
    saveSessions(nextSessions);
    setActiveSessionId(newId);
    setActiveTab("chat");
  };

  // Customizable system prompts directory builders
  const handleAddCustomPrompt = (label: string, promptText: string) => {
    const newItem: SystemPrompt = {
      id: `prompt-${Date.now()}`,
      label,
      prompt: promptText,
      isBuiltIn: false,
    };
    const nextList = [...customPrompts, newItem];
    saveCustomPrompts(nextList, newItem);
  };

  const handleDeleteCustomPrompt = (id: string) => {
    const nextList = customPrompts.filter((p) => p.id !== id);
    saveCustomPrompts(nextList, undefined, id);
  };

  // Telemetry statistics operations
  const handleClearRecords = () => {
    saveConsumptionRecords([]);
    if (useMysql) {
      fetch("/api/db/clear-consumption", { method: "POST" })
        .catch(err => console.error("MySQL background telemetry reset fail:", err));
    }
  };

  // Local physical vector DB reset
  const handleClearVectorDb = async () => {
    try {
      await localVectorDb.clearAll();
      refreshVectorCount();
    } catch (e) {
      alert("Clear index failed.");
    }
  };

  // Dynamic RAG context indexing pipeline & Prompt Submission
  const handleSendMessage = async (rawContent: string, sessionOverride?: ChatSession) => {
    const activeSessionToUse = sessionOverride || activeSession;
    if (!activeSessionToUse || isLoading) return;

    const userMessage: Message = {
      id: generateUUID(),
      role: "user",
      content: rawContent,
      timestamp: new Date().toISOString(),
    };

    // Append user message immediately to session list to ensure swift UI feedback
    const originalMessages = [...activeSessionToUse.messages];
    const sessionMessagesWithUser = [...originalMessages, userMessage];
    
    // Update active session locally
    let nextSessions = sessions.map((s) => {
      if (s.id === activeSessionToUse.id) {
        // Automatically rename untitled initial chat title from user's first prompt text
        const title = s.messages.length === 0 ? (rawContent.length > 24 ? rawContent.substring(0, 24) + "..." : rawContent) : s.title;
        return { ...s, title, messages: sessionMessagesWithUser, updatedAt: new Date().toISOString() };
      }
      return s;
    });
    saveSessions(nextSessions);
    setIsLoading(true);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) headers["x-gemini-key"] = geminiApiKey;
      if (openaiApiKey) headers["x-openai-key"] = openaiApiKey;
      if (openaiBaseUrl) headers["x-openai-base"] = openaiBaseUrl;
      if (anthropicApiKey) headers["x-anthropic-key"] = anthropicApiKey;
      if (deepseekApiKey) headers["x-deepseek-key"] = deepseekApiKey;

      let finalSystemInstruction = "";
      const promptPreset = [...BUILT_IN_PROMPTS, ...customPrompts].find(
        (p) => p.id === activeSessionToUse.systemInstructionId
      );

      if (promptPreset) {
        finalSystemInstruction = promptPreset.prompt;
      }

      let retrievedSources: RagSource[] = [];
      let augmentedHistory = [...sessionMessagesWithUser];

      // RAG MATCHING STAGE
      if (activeSessionToUse.ragEnabled) {
        try {
          // 1. Send query to /api/embed for user input embeddings representation
          const embedRes = await fetch("/api/embed", {
            method: "POST",
            headers,
            body: JSON.stringify({ texts: rawContent }),
          });
          const embedData = await embedRes.json();

          if (embedData.success && embedData.embeddings) {
            const queryVec: number[] = embedData.embeddings;
            
            // 2. Perform local similarity audit on secure on-device IndexedDB
            const matches: any[] = await localVectorDb.findSimilar(
              queryVec, 
              ragSourceCount, 
              ragSimilarityThreshold,
              activeSessionToUse.ragScope === "conversation" ? activeSessionToUse.id : undefined
            );

            if (matches && matches.length > 0) {
              // Extract matching elements as RAG sources metadata
              retrievedSources = matches.map((m) => {
                const linkSession = sessions.find((s) => s.id === m.chatId);
                return {
                  messageId: m.messageId,
                  chatId: m.chatId,
                  chatTitle: linkSession?.title || "Archived Chat",
                  text: m.text,
                  similarity: m.similarity,
                  timestamp: m.timestamp,
                };
              });

              // 3. Formulate supportive hidden system instructions mapping context
              const contextInlayHeader = `\n\n[SUPPORTIVE SYSTEM CONTEXT MATCHED FROM USER HISTORICAL CONVERSATIONS ON-DEVICE:\n`;
              const contextInlayBody = retrievedSources.map((s, i) => `Recall Fragment #${i+1} (From discussion "${s.chatTitle}" with similarity match ${Math.round(s.similarity*100)}%): "${s.text}"`).join("\n---\n");
              const contextInlayFooter = `\nEnd of historical context inlay. Prioritize referencing these past matching points if user asks semantic, referential, or background questions about their experiences or history.]`;

              // Apply context block directly as supportive reinforcement
              finalSystemInstruction = finalSystemInstruction + contextInlayHeader + contextInlayBody + contextInlayFooter;
            }
          }
        } catch (ragErr) {
          console.warn("RAG retrieval failed gracefully, proceeding with standard generation:", ragErr);
        }
      }

      // SEND COMM-ROUTE CHAT
      const reqPayload = {
        model: activeSessionToUse.modelId,
        history: augmentedHistory,
        systemInstruction: finalSystemInstruction,
        temperature: activeSessionToUse.temperature,
        topP: activeSessionToUse.topP,
        topK: activeSessionToUse.topK,
        maxOutputTokens: activeSessionToUse.maxOutputTokens,
      };

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify(reqPayload),
      });

      const data = await res.json();

      if (data.success && data.text) {
        const costMeta = (availableModels || REF_MODELS).find((m) => m.id === activeSessionToUse.modelId) || {
          inputCostPerMillion: 0.075,
          outputCostPerMillion: 0.30,
        };

        const estimatedCost = 
          ((data.promptTokens * costMeta.inputCostPerMillion) / 1000000) + 
          ((data.candidateTokens * costMeta.outputCostPerMillion) / 1000000);

        const modelMessage: Message = {
          id: generateUUID(),
          role: "model",
          content: data.text,
          timestamp: new Date().toISOString(),
          promptTokens: data.promptTokens,
          candidateTokens: data.candidateTokens,
          totalTokens: data.totalTokens,
          cost: parseFloat(estimatedCost.toFixed(6)),
          ragSources: retrievedSources.length > 0 ? retrievedSources : undefined,
        };

        const nextSessionMessages = [...sessionMessagesWithUser, modelMessage];
        
        nextSessions = sessions.map((s) => {
          if (s.id === activeSessionToUse.id) {
            return {
              ...s,
              messages: nextSessionMessages,
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });
        saveSessions(nextSessions);

        // CREATE CONSUMPTION TRANSACTION RECORD
        const nextRecord: ConsumptionRecord = {
          id: generateUUID(),
          timestamp: new Date().toISOString(),
          chatId: activeSessionToUse.id,
          modelId: activeSessionToUse.modelId,
          promptTokens: data.promptTokens,
          candidateTokens: data.candidateTokens,
          totalTokens: data.totalTokens,
          estimatedCost,
        };
        saveConsumptionRecords([...consumptionRecords, nextRecord], nextRecord);

        // ASYNC EMBEDDING INGESTION STAGE: Index conversational pair securely inside IndexedDB vector store
        try {
          const textsToEmbed = [rawContent, data.text];
          const embedIngestRes = await fetch("/api/embed", {
            method: "POST",
            headers,
            body: JSON.stringify({ texts: textsToEmbed }),
          });
          const embedIngestData = await embedIngestRes.json();

          if (embedIngestData.success && Array.isArray(embedIngestData.embeddings)) {
            const userVectorRecord: VectorRecord = {
              id: userMessage.id,
              chatId: activeSessionToUse.id,
              messageId: userMessage.id,
              text: rawContent,
              embedding: embedIngestData.embeddings[0],
              timestamp: userMessage.timestamp,
            };

            const modelVectorRecord: VectorRecord = {
              id: modelMessage.id,
              chatId: activeSessionToUse.id,
              messageId: modelMessage.id,
              text: data.text,
              embedding: embedIngestData.embeddings[1],
              timestamp: modelMessage.timestamp,
            };

            // Store inside Local DB
            await localVectorDb.storeVector(userVectorRecord);
            await localVectorDb.storeVector(modelVectorRecord);
            refreshVectorCount();
          }
        } catch (embedIngestError) {
          console.warn("Async vector ingestion failed, index list unaffected:", embedIngestError);
        }

      } else {
        throw new Error(data.error || "Failed to parse chat response validation block.");
      }

    } catch (chatError: any) {
      console.error("General chat submission pipeline failure:", chatError);
      
      const errorMessage: Message = {
        id: generateUUID(),
        role: "model",
        content: `⚠️ **Proxy Communication Error:**\n\n${chatError?.message || "An exception occurred while connecting to our Google GenAI backend proxy. Verify your local network connection, API configuration, or credential validation parameters in Settings > Secrets."}`,
        timestamp: new Date().toISOString(),
      };

      const failSessionMessages = [...sessionMessagesWithUser, errorMessage];
      nextSessions = sessions.map((s) => {
        if (s.id === activeSessionToUse.id) {
          return { ...s, messages: failSessionMessages, updatedAt: new Date().toISOString() };
        }
        return s;
      });
      saveSessions(nextSessions);
    } finally {
      setIsLoading(false);
    }
  };

  // Cross-platform synchronization endpoints hooks
  const handleSyncPush = async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const payload = {
        chats: sessions,
        systemPrompts: customPrompts,
        consumptionRecords: consumptionRecords,
        syncedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/sync/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (e: any) {
      return { success: false, error: e.message || "Network request failed." };
    }
  };

  const handleSyncPull = async (key: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
      const res = await fetch(`/api/sync/${key}`);
      if (res.status === 444) {
        return { success: false, error: "Sync key was not found. Please verify the code key." };
      }
      const data = await res.json();
      if (data.success && data.data) {
        return { success: true, data: data.data };
      } else {
        return { success: false, error: data.error || "Failed to download synchronised backup." };
      }
    } catch (e: any) {
      return { success: false, error: e.message || "Network connection failed." };
    }
  };

  const handleFullStateImport = async (importedState: any) => {
    if (importedState.chats) {
      saveSessions(importedState.chats);
      if (importedState.chats.length > 0) {
        setActiveSessionId(importedState.chats[0].id);
      }
    }
    if (importedState.systemPrompts) {
      saveCustomPrompts(importedState.systemPrompts);
    }
    if (importedState.consumptionRecords) {
      saveConsumptionRecords(importedState.consumptionRecords);
    }

    // Re-index import texts onto Vector DB for optimal local performance
    try {
      await localVectorDb.clearAll();
      const allMsgs: { txt: string; chatId: string; msgId: string; timestamp: string }[] = [];
      
      importedState.chats?.forEach((chat: ChatSession) => {
        chat.messages?.forEach((msg: Message) => {
          if (msg.role !== "system" && msg.content && !msg.content.startsWith("⚠️")) {
            allMsgs.push({
              txt: msg.content,
              chatId: chat.id,
              msgId: msg.id,
              timestamp: msg.timestamp
            });
          }
        });
      });

      // Sequential batch embeddings request to avoid network congestion
      if (allMsgs.length > 0) {
        console.log(`Re-indexing ${allMsgs.length} messages onto the Vector Database...`);
        const batchTexts = allMsgs.map(m => m.txt);
        const chunk = 10; // Batch limit
        for (let i = 0; i < batchTexts.length; i += chunk) {
          const sliceTexts = batchTexts.slice(i, i + chunk);
          const sliceItems = allMsgs.slice(i, i + chunk);

          const ingestRes = await fetch("/api/embed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ texts: sliceTexts }),
          });
          const ingestData = await ingestRes.json();

          if (ingestData.success && Array.isArray(ingestData.embeddings)) {
            for (let j = 0; j < sliceItems.length; j++) {
              const item = sliceItems[j];
              const vectorRecord: VectorRecord = {
                id: item.msgId,
                chatId: item.chatId,
                messageId: item.msgId,
                text: item.txt,
                embedding: ingestData.embeddings[j],
                timestamp: item.timestamp
              };
              await localVectorDb.storeVector(vectorRecord);
            }
          }
        }
      }
      refreshVectorCount();
    } catch (e) {
      console.warn("Re-indexing vectors during sync pull failed. Chat history preserved.", e);
    }
  };

  const handleFullStateExport = () => {
    return {
      chats: sessions,
      systemPrompts: customPrompts,
      consumptionRecords: consumptionRecords,
      syncedAt: new Date().toISOString()
    };
  };

  // Direct File Backup and RAG ingestion pipelines
  const handleUploadBackup = (backupData: any) => {
    if (!backupData) return;
    if (Array.isArray(backupData.chats)) {
      const existingIds = new Set(sessions.map((s) => s.id));
      const addedSessions = backupData.chats.filter((s: any) => s && s.id && !existingIds.has(s.id));
      if (addedSessions.length > 0) {
        const nextSessions = [...addedSessions, ...sessions];
        saveSessions(nextSessions);
        setActiveSessionId(addedSessions[0].id);
      }
    } else if (backupData.id && Array.isArray(backupData.messages)) {
      const existingIds = new Set(sessions.map((s) => s.id));
      let targetId = backupData.id;
      if (existingIds.has(targetId)) {
        targetId = generateUUID();
        backupData.id = targetId;
        backupData.title = `${backupData.title || "Imported Chat"} (Copy)`;
      }
      const nextSessions = [backupData, ...sessions];
      saveSessions(nextSessions);
      setActiveSessionId(targetId);
    }
  };

  const handleIngestFileToRag = async (filename: string, fileContent: string) => {
    if (!activeSession) return;
    try {
      const paragraphs = fileContent
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter((p) => p.length > 15);

      if (paragraphs.length === 0) return;

      for (let i = 0; i < paragraphs.length; i += 10) {
        const sliceParagraphs = paragraphs.slice(i, i + 10);
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (geminiApiKey) headers["x-gemini-key"] = geminiApiKey;
        if (openaiApiKey) headers["x-openai-key"] = openaiApiKey;
        if (openaiBaseUrl) headers["x-openai-base"] = openaiBaseUrl;
        if (anthropicApiKey) headers["x-anthropic-key"] = anthropicApiKey;
        if (deepseekApiKey) headers["x-deepseek-key"] = deepseekApiKey;

        const res = await fetch("/api/embed", {
          method: "POST",
          headers,
          body: JSON.stringify({ texts: sliceParagraphs }),
        });

        const data = await res.json();
        if (data.success && Array.isArray(data.embeddings)) {
          for (let j = 0; j < sliceParagraphs.length; j++) {
            const vectorRecord: VectorRecord = {
              id: generateUUID(),
              chatId: activeSession.id,
              messageId: generateUUID(),
              text: `File Context [${filename}]: ${sliceParagraphs[j]}`,
              embedding: data.embeddings[j],
              timestamp: new Date().toISOString()
            };
            await localVectorDb.storeVector(vectorRecord);
          }
        }
      }
      await refreshVectorCount();
    } catch (e) {
      console.warn("Direct RAG indexing on file ingestion skipped:", e);
    }
  };

  const handleExecuteSubFunction = (systemPromptText: string, userText: string, functionTitle: string) => {
    const newId = generateUUID();
    const customPromptId = `prompt-subfn-${Date.now()}`;
    
    // Register custom persona prompt dynamically
    const newPrompt: SystemPrompt = {
      id: customPromptId,
      label: functionTitle,
      prompt: systemPromptText,
      isBuiltIn: false
    };

    const nextCustomPrompts = [newPrompt, ...customPrompts];
    saveCustomPrompts(nextCustomPrompts);

    const newSess: ChatSession = {
      id: newId,
      title: `${functionTitle} Output`,
      modelId: activeSession?.modelId || "gemini-3.5-flash",
      systemInstructionId: customPromptId,
      temperature: 0.2, // Structured precision
      topP: topP,
      topK: topK,
      maxOutputTokens: maxOutputTokens,
      ragEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };

    const nextSessions = [newSess, ...sessions];
    saveSessions(nextSessions);
    setActiveSessionId(newId);
    setActiveTab("chat");

    setTimeout(() => {
      handleSendMessage(userText, newSess);
    }, 80);
  };

  const isAndroidSim = deviceMode === "android";

  const allProps = {
    activeTab,
    setActiveTab,
    sidebarOpen,
    setSidebarOpen,
    theme,
    toggleTheme,
    language,
    handleLanguageChange,
    sessions,
    activeSessionId,
    setActiveSessionId,
    handleNewSession,
    handleDeleteSession,
    handleRenameSession,
    handleClearAllSessions,
    handleCreateSessionWithParams,
    customPrompts,
    vectorCount,
    ragEnabled,
    setRagEnabled,
    availableModels,
    handleUploadBackup,
    handleSendMessage,
    isLoading,
    handleChangeSessionModel,
    handleChangeSessionSystemPromptRef,
    handleToggleSessionRag,
    handleUpdateActiveSessionParams,
    refreshVectorCount,
    handleIngestFileToRag,
    consumptionRecords,
    handleClearRecords,
    handleClearVectorDb,
    geminiApiKey,
    setGeminiApiKey,
    openaiApiKey,
    setOpenaiApiKey,
    openaiBaseUrl,
    setOpenaiBaseUrl,
    anthropicApiKey,
    setAnthropicApiKey,
    deepseekApiKey,
    setDeepseekApiKey,
    temperature,
    setTemperature,
    topP,
    setTopP,
    topK,
    setTopK,
    maxOutputTokens,
    setMaxOutputTokens,
    ragSourceCount,
    setRagSourceCount,
    ragSimilarityThreshold,
    setRagSimilarityThreshold,
    handleAddCustomPrompt,
    handleDeleteCustomPrompt,
    handleSyncPush,
    handleSyncPull,
    handleFullStateImport,
    handleFullStateExport,
    handleExecuteSubFunction,
    deviceMode,
    setDeviceMode,
    useMysql,
    setUseMysql,
    loadAllDataFromDb
  };

  if (isAndroidSim) {
    return (
      <div className="flex h-screen w-screen bg-gradient-to-tr from-zinc-900 via-zinc-950 to-indigo-950 justify-center items-center overflow-hidden p-4 select-none relative font-sans antialiased text-white">
        
        {/* Floating title header context for simulated previewing mode */}
        <div className="absolute top-4 left-6 hidden xl:block select-none text-left">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span className="font-bold font-sans">Simulated Android AMOLED Workspace</span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">High-fidelity smartphone aspect ratio (380x810, Material design navigation). Responsive inside frame bounds.</p>
        </div>

        <button
          onClick={() => setDeviceMode("desktop")}
          className="absolute top-4 right-6 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold py-1.5 px-3.5 rounded-xl text-xs cursor-pointer select-none transition-colors"
        >
          Reset Computor Full view
        </button>

        {/* Outer phone metal bezel wrapper */}
        <div className="w-[380px] h-[810px] bg-zinc-950 rounded-[48px] border-[12px] border-zinc-850 dark:border-zinc-900 shadow-2xl relative overflow-hidden flex flex-col scale-[0.92] sm:scale-100 transition-all">
          
          {/* AMOLED Status Bar */}
          <div className="h-7 bg-zinc-900 dark:bg-zinc-950 flex justify-between items-center px-6 text-[10px] text-zinc-350 font-bold z-40 select-none border-b border-zinc-900/40 relative">
            {/* Left status bar clocks */}
            <span>10:42 AM</span>
            
            {/* Center camera notch pin */}
            <div className="w-3.5 h-3.5 bg-black rounded-full absolute left-1/2 -translate-x-1/2 top-1.5 border border-zinc-900" />

            {/* Right micro indicators status */}
            <div className="flex items-center gap-1.5">
              <span>98%</span>
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

          {/* Phone simulated app screen bounds */}
          <div className="flex-1 overflow-hidden relative flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
            <AppContent 
              {...allProps}
              isMobileSimulated={true}
            />
          </div>

          {/* Android Home Pills Bezel navigation notch */}
          <div className="h-4 bg-zinc-900 dark:bg-zinc-950 flex justify-center items-center select-none shrink-0 border-t border-zinc-855">
            <div className="w-24 h-1.5 bg-zinc-700 dark:bg-zinc-800 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Otherwise standard desktop viewport (which automatically triggers mobile behaviors if actual screen layout is narrow!)
  return (
    <AppContent 
      {...allProps}
      isMobileSimulated={deviceMode === "desktop" ? false : isRealMobile}
    />
  );
}

// Complete AppContent component packaging both layouts with zero code replication
interface AppContentProps {
  activeTab: "chat" | "stats" | "settings" | "tools" | "admin";
  setActiveTab: (tab: "chat" | "stats" | "settings" | "tools" | "admin") => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
  language: Language;
  handleLanguageChange: (lang: Language) => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  handleNewSession: () => void;
  handleDeleteSession: (id: string) => void;
  handleRenameSession: (id: string, title: string) => void;
  handleClearAllSessions: () => void;
  handleCreateSessionWithParams: (title: string, modelId: string, systemPromptId: string) => void;
  customPrompts: SystemPrompt[];
  vectorCount: number;
  ragEnabled: boolean;
  setRagEnabled: (val: boolean) => void;
  availableModels: any[];
  handleUploadBackup: (backupData: any) => void;
  handleSendMessage: (rawContent: string, sessionOverride?: ChatSession) => void;
  isLoading: boolean;
  handleChangeSessionModel: (modelId: string) => void;
  handleChangeSessionSystemPromptRef: (promptId: string) => void;
  handleToggleSessionRag: () => void;
  handleUpdateActiveSessionParams: (params: Partial<ChatSession>) => void;
  refreshVectorCount: () => void;
  handleIngestFileToRag: (filename: string, fileContent: string) => void;
  consumptionRecords: ConsumptionRecord[];
  handleClearRecords: () => void;
  handleClearVectorDb: () => void;
  geminiApiKey: string;
  setGeminiApiKey: (val: string) => void;
  openaiApiKey: string;
  setOpenaiApiKey: (val: string) => void;
  openaiBaseUrl: string;
  setOpenaiBaseUrl: (val: string) => void;
  anthropicApiKey: string;
  setAnthropicApiKey: (val: string) => void;
  deepseekApiKey: string;
  setDeepseekApiKey: (val: string) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  topP: number;
  setTopP: (val: number) => void;
  topK: number;
  setTopK: (val: number) => void;
  maxOutputTokens: number;
  setMaxOutputTokens: (val: number) => void;
  ragSourceCount: number;
  setRagSourceCount: (val: number) => void;
  ragSimilarityThreshold: number;
  setRagSimilarityThreshold: (val: number) => void;
  handleAddCustomPrompt: (label: string, promptText: string) => void;
  handleDeleteCustomPrompt: (id: string) => void;
  handleSyncPush: (key: string) => Promise<{ success: boolean; error?: string }>;
  handleSyncPull: (key: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  handleFullStateImport: (importedState: any) => void;
  handleFullStateExport: () => any;
  handleExecuteSubFunction: (systemPromptText: string, userText: string, functionTitle: string) => void;
  isMobileSimulated: boolean;
  deviceMode: "auto" | "desktop" | "android";
  setDeviceMode: (mode: "auto" | "desktop" | "android") => void;
  useMysql: boolean;
  setUseMysql: (val: boolean) => void;
  loadAllDataFromDb: () => Promise<void>;
}

function AppContent({
  activeTab,
  setActiveTab,
  sidebarOpen,
  setSidebarOpen,
  theme,
  toggleTheme,
  language,
  handleLanguageChange,
  sessions,
  activeSessionId,
  setActiveSessionId,
  handleNewSession,
  handleDeleteSession,
  handleRenameSession,
  handleClearAllSessions,
  handleCreateSessionWithParams,
  customPrompts,
  vectorCount,
  ragEnabled,
  availableModels,
  handleUploadBackup,
  handleSendMessage,
  isLoading,
  handleChangeSessionModel,
  handleChangeSessionSystemPromptRef,
  handleToggleSessionRag,
  handleUpdateActiveSessionParams,
  refreshVectorCount,
  handleIngestFileToRag,
  consumptionRecords,
  handleClearRecords,
  handleClearVectorDb,
  geminiApiKey,
  setGeminiApiKey,
  openaiApiKey,
  setOpenaiApiKey,
  openaiBaseUrl,
  setOpenaiBaseUrl,
  anthropicApiKey,
  setAnthropicApiKey,
  deepseekApiKey,
  setDeepseekApiKey,
  temperature,
  setTemperature,
  topP,
  setTopP,
  topK,
  setTopK,
  maxOutputTokens,
  setMaxOutputTokens,
  ragEnabled: _ragEnabledIgnored, // rename/bypass collision if needed
  setRagEnabled,
  ragSourceCount,
  setRagSourceCount,
  ragSimilarityThreshold,
  setRagSimilarityThreshold,
  handleAddCustomPrompt,
  handleDeleteCustomPrompt,
  handleSyncPush,
  handleSyncPull,
  handleFullStateImport,
  handleFullStateExport,
  handleExecuteSubFunction,
  isMobileSimulated,
  deviceMode,
  setDeviceMode,
  useMysql,
  setUseMysql,
  loadAllDataFromDb
}: AppContentProps) {
  const activeSession = sessions.find((s) => s.id === activeSessionId) || null;

  return (
    <div className={`flex h-full w-full bg-zinc-100 dark:bg-zinc-950 overflow-hidden font-sans antialiased text-zinc-900 dark:text-zinc-50 transition-colors ${isMobileSimulated ? "flex-col" : "flex-row"}`}>
      
      {/* Sidebar Command Center */}
      <div className={`${isMobileSimulated ? (sidebarOpen ? "block absolute inset-0 z-50 flex" : "hidden") : "flex h-full"}`}>
        {isMobileSimulated && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-black/60 z-30 animate-fadeIn" />
        )}
        <div className={`h-full z-40 relative ${isMobileSimulated ? "w-[260px] animate-slideRight" : "w-80 shrink-0"}`}>
          <Sidebar
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
            onRenameSession={handleRenameSession}
            onClearAllSessions={handleClearAllSessions}
            onAddCustomSession={handleCreateSessionWithParams}
            customPrompts={customPrompts}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            vectorCount={vectorCount}
            ragEnabled={ragEnabled}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            language={language}
            onLanguageChange={handleLanguageChange}
            availableModels={availableModels}
            onUploadBackup={handleUploadBackup}
          />
        </div>
      </div>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Dynamic header tabs - Only rendered in Computer Layout for premium uncluttered space */}
        {!isMobileSimulated && (
          <div className="absolute top-3.5 right-16 z-30 hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-zinc-200/50 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200/20 dark:border-zinc-800">
            {/* Layout simulation selectors */}
            <div className="flex items-center gap-0.5 bg-zinc-300/30 dark:bg-zinc-950/40 p-0.5 rounded-lg border border-zinc-200/20">
              <button
                onClick={() => setDeviceMode("desktop")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${deviceMode === "desktop" ? "bg-white dark:bg-zinc-900 text-indigo-500 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"}`}
              >
                <Monitor className="w-3 h-3" />
                <span>Computer Desktop</span>
              </button>
              <button
                onClick={() => setDeviceMode("android")}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${deviceMode === "android" ? "bg-white dark:bg-zinc-900 text-indigo-500 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"}`}
              >
                <Smartphone className="w-3 h-3" />
                <span>Android App</span>
              </button>
              <button
                onClick={() => setDeviceMode("auto")}
                className={`px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${deviceMode === "auto" ? "bg-white dark:bg-zinc-900 text-indigo-500 shadow-sm" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"}`}
                title="Detect viewport adaptively"
              >
                <span>Auto</span>
              </button>
            </div>
            
            <span className="h-3 w-px bg-zinc-300 dark:bg-zinc-800" />
            
            <div className="flex items-center gap-1 px-1.5 text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200">
              <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value as Language)}
                className="bg-transparent border-none text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer pr-1"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code} className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200">
                    {l.flag} {l.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="h-3 w-px bg-zinc-300 dark:bg-zinc-800" />
            <button 
              onClick={toggleTheme}
              className="p-1 px-2.5 rounded-lg text-xs font-semibold cursor-pointer text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all flex items-center gap-1.5"
              title="Theme Toggle"
            >
              {theme === "dark" ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-zinc-500" />}
              <span className="capitalize">{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        )}

        {/* Workspace Display Routing */}
        <div className="flex-1 flex flex-col min-h-0 pt-0">
          {activeTab === "chat" && (
            <ChatArea
              session={activeSession}
              sessions={sessions}
              onSendMessage={(content) => handleSendMessage(content)}
              isLoading={isLoading}
              customPrompts={customPrompts}
              onChangeSessionModel={handleChangeSessionModel}
              onChangeSessionSystemPromptRef={handleChangeSessionSystemPromptRef}
              onToggleSessionRag={handleToggleSessionRag}
              onUpdateSessionParams={handleUpdateActiveSessionParams}
              setSidebarOpen={setSidebarOpen}
              language={language}
              availableModels={availableModels}
              onRefreshVectorCount={refreshVectorCount}
              onUploadBackup={handleUploadBackup}
              onIngestFileToRag={async (filename, fileContent) => {
                await handleIngestFileToRag(filename, fileContent);
              }}
            />
          )}

          {activeTab === "stats" && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroller-custom">
              <StatsDashboard
                records={consumptionRecords}
                onClearRecords={handleClearRecords}
                language={language}
                onBackToChat={() => setActiveTab("chat")}
                availableModels={availableModels}
              />
            </div>
          )}

          {activeTab === "tools" && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroller-custom">
              <SubFunctionsPanel
                onExecuteFunction={handleExecuteSubFunction}
                language={language}
              />
            </div>
          )}

          {activeTab === "admin" && (
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scroller-custom">
              <AdminPanel
                records={consumptionRecords}
                vectorCount={vectorCount}
                availableModels={availableModels}
                onClearRecords={handleClearRecords}
                onClearVectorDb={handleClearVectorDb}
                geminiApiKey={geminiApiKey}
                setGeminiApiKey={setGeminiApiKey}
                openaiApiKey={openaiApiKey}
                setOpenaiApiKey={setOpenaiApiKey}
                openaiBaseUrl={openaiBaseUrl}
                setOpenaiBaseUrl={setOpenaiBaseUrl}
                anthropicApiKey={anthropicApiKey}
                setAnthropicApiKey={setAnthropicApiKey}
                deepseekApiKey={deepseekApiKey}
                setDeepseekApiKey={setDeepseekApiKey}
                temperature={temperature}
                setTemperature={setTemperature}
                topP={topP}
                setTopP={setTopP}
                topK={topK}
                setTopK={setTopK}
                maxOutputTokens={maxOutputTokens}
                setMaxOutputTokens={setMaxOutputTokens}
                ragEnabled={ragEnabled}
                setRagEnabled={setRagEnabled}
                ragSourceCount={ragSourceCount}
                setRagSourceCount={setRagSourceCount}
                ragSimilarityThreshold={ragSimilarityThreshold}
                setRagSimilarityThreshold={setRagSimilarityThreshold}
                customPrompts={customPrompts}
                onAddCustomPrompt={handleAddCustomPrompt}
                onDeleteCustomPrompt={handleDeleteCustomPrompt}
                onSyncPush={handleSyncPush}
                onSyncPull={handleSyncPull}
                handleFullStateImport={handleFullStateImport}
                handleFullStateExport={handleFullStateExport}
                language={language}
                onLanguageChange={handleLanguageChange}
                useMysql={useMysql}
                setUseMysql={setUseMysql}
                sessions={sessions}
                loadAllDataFromDb={loadAllDataFromDb}
              />
            </div>
          )}
        </div>

        {/* Android Native-Like Navigation Deck (ONLY rendered on Simulated Phone Area) */}
        {isMobileSimulated && (
          <div className="h-16 bg-zinc-900 border-t border-zinc-800/80 flex items-center justify-around z-30 shrink-0 select-none pb-0.5">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer select-none focus:outline-none ${activeTab === "chat" ? "text-indigo-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">Chat</span>
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer select-none focus:outline-none ${activeTab === "tools" ? "text-indigo-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Sparkles className="w-5 h-5 text-indigo-450 animate-pulse" />
              <span className="text-[10px]">AI Tools</span>
            </button>
            <button
              onClick={() => setActiveTab("stats")}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer select-none focus:outline-none ${activeTab === "stats" ? "text-indigo-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <Activity className="w-5 h-5" />
              <span className="text-[10px]">Stats</span>
            </button>
            <button
              onClick={() => setActiveTab("admin")}
              className={`flex-1 flex flex-col justify-center items-center gap-1 cursor-pointer select-none focus:outline-none ${activeTab === "admin" ? "text-emerald-400 font-bold" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              <ShieldCheck className="w-5 h-5" />
              <span className="text-[10px]">Admin</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
