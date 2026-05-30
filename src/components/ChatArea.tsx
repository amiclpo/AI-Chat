/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Sparkles, 
  Database, 
  Cpu, 
  Terminal, 
  Copy, 
  Check, 
  Brain, 
  Maximize2, 
  ChevronDown, 
  ChevronUp, 
  Smartphone, 
  Compass, 
  Code, 
  Edit3, 
  Menu,
  Coins,
  AlertCircle,
  Sliders,
  Download,
  Paperclip,
  FileText,
  Trash2
} from "lucide-react";
import { ChatSession, Message, SystemPrompt, RagSource, VectorRecord } from "../types";
import { localVectorDb } from "../lib/vectorDb";
import { REF_MODELS, BUILT_IN_PROMPTS } from "../lib/data";
import { Language, getTranslation } from "../lib/translations";

interface ChatAreaProps {
  session: ChatSession | null;
  sessions?: ChatSession[];
  onSendMessage: (content: string, overrideSystemId?: string) => void;
  isLoading: boolean;
  
  // Custom system prompts directories
  customPrompts: SystemPrompt[];
  
  // Dynamic model parameter changes for active chat
  onChangeSessionModel: (modelId: string) => void;
  onChangeSessionSystemPromptRef: (promptId: string) => void;
  onToggleSessionRag: () => void;
  onUpdateSessionParams: (params: Partial<ChatSession>) => void;

  // Drawer triggers
  setSidebarOpen: (open: boolean) => void;
  
  // Translation
  language: Language;

  // Dynamic model aggregation & DB stats hooks
  availableModels?: any[];
  onRefreshVectorCount?: () => void;

  // File Upload and Ingestion callbacks
  onUploadBackup?: (backupData: any) => void;
  onIngestFileToRag?: (filename: string, fileContent: string) => Promise<void>;
}

// Highly reliable, lightweight custom markdown parser to convert markdown structure gracefully
function parseMarkdownToJsx(text: string): React.ReactNode[] {
  if (!text) return [];
  
  const lines = text.split("\n");
  const processedElements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle code blocks
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        const codeText = codeBlockContent.join("\n");
        const currentLang = codeLang;
        processedElements.push(
          <div key={`code-block-${i}`}>
            <CodeBlock lang={currentLang} content={codeText} />
          </div>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = line.replace("```", "").trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Headers
    if (line.startsWith("# ")) {
      processedElements.push(
        <h1 key={`h1-${i}`} className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-3 mb-1">{line.slice(2)}</h1>
      );
      continue;
    }
    if (line.startsWith("## ")) {
      processedElements.push(
        <h2 key={`h2-${i}`} className="text-base font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-2.5 mb-1">{line.slice(3)}</h2>
      );
      continue;
    }
    if (line.startsWith("### ")) {
      processedElements.push(
        <h3 key={`h3-${i}`} className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mt-2 mb-1">{line.slice(4)}</h3>
      );
      continue;
    }

    // Bullets & Lists
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const bulletText = line.trim().slice(2);
      processedElements.push(
        <li key={`li-${i}`} className="text-xs text-zinc-700 dark:text-zinc-300 ml-4 list-disc pl-1 py-0.5 leading-relaxed">
          {renderInlineFormatting(bulletText)}
        </li>
      );
      continue;
    }

    // Lists with numbers
    const numListMatch = line.trim().match(/^(\d+)\.\s(.*)/);
    if (numListMatch) {
      const num = numListMatch[1];
      const bulletText = numListMatch[2];
      processedElements.push(
        <li key={`li-num-${i}`} className="text-xs text-zinc-700 dark:text-zinc-300 ml-4 list-decimal pl-1 py-0.5 leading-relaxed">
          {renderInlineFormatting(bulletText)}
        </li>
      );
      continue;
    }

    // Default Paragraphs
    if (line.trim() === "") {
      processedElements.push(<div key={`space-${i}`} className="h-1.5" />);
    } else {
      processedElements.push(
        <p key={`p-${i}`} className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed mb-1.5">
          {renderInlineFormatting(line)}
        </p>
      );
    }
  }

  // If file finishes and code block is unclosed
  if (inCodeBlock && codeBlockContent.length > 0) {
    processedElements.push(
      <div key="code-unclosed">
        <CodeBlock lang={codeLang} content={codeBlockContent.join("\n")} />
      </div>
    );
  }

  return processedElements;
}

// Inline formatting wrapper (strong, code segments)
function renderInlineFormatting(inputText: string): React.ReactNode {
  const parts: { type: "text" | "bold" | "code"; text: string }[] = [];
  
  // Quick splitter
  const tokens = inputText.split(/(\*\*.*?\*\*|`.*?`)/g);
  tokens.forEach((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push({ type: "bold", text: token.slice(2, -2) });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push({ type: "code", text: token.slice(1, -1) });
    } else if (token) {
      parts.push({ type: "text", text: token });
    }
  });

  return (
    <>
      {parts.map((p, idx) => {
        if (p.type === "bold") {
          return <strong key={idx} className="font-bold text-zinc-900 dark:text-zinc-50">{p.text}</strong>;
        } else if (p.type === "code") {
          return <code key={idx} className="bg-zinc-100 dark:bg-zinc-800 text-pink-650 dark:text-pink-400 font-mono text-[10.5px] px-1 rounded">{p.text}</code>;
        } else {
          return p.text;
        }
      })}
    </>
  );
}

// Renderable Code block with single click copy helper
function CodeBlock({ lang, content }: { lang: string; content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 my-3 overflow-hidden bg-zinc-950 text-zinc-100 font-mono text-[11px] shadow-sm">
      <div className="flex justify-between items-center py-2 px-4 border-b border-zinc-850 bg-zinc-900">
        <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-500">
          <Terminal className="w-3.5 h-3.5 text-indigo-500" />
          {lang || "code"}
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1 text-[10px] cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto leading-relaxed">
        <code>{content}</code>
      </pre>
    </div>
  );
}

export function ChatArea({
  session,
  sessions,
  onSendMessage,
  isLoading,
  customPrompts,
  onChangeSessionModel,
  onChangeSessionSystemPromptRef,
  onToggleSessionRag,
  onUpdateSessionParams,
  setSidebarOpen,
  language,
  availableModels,
  onRefreshVectorCount,
  onUploadBackup,
  onIngestFileToRag
}: ChatAreaProps) {
  const [inputText, setInputText] = useState("");
  const [showParamsPanel, setShowParamsPanel] = useState(false);
  const [chatRecords, setChatRecords] = useState<VectorRecord[]>([]);
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const exportChatAsMarkdown = () => {
    if (!session) return;
    const sIndex = sessions ? sessions.findIndex(s => s.id === session.id) : -1;
    const dNum = sIndex !== -1 ? (sessions.length - sIndex) : 1;
    const maskedTitle = `Dialogue #${dNum}`;
    const modelLabel = (availableModels || REF_MODELS).find(m => m.id === session.modelId)?.name || session.modelId;
    let md = `# ${maskedTitle}\n`;
    md += `* **Model Setup**: ${modelLabel}\n`;
    md += `* **Created At (local/offline db)**: ${new Date(session.createdAt).toLocaleString()}\n`;
    md += `\n---\n\n`;

    session.messages.forEach((m) => {
      const actor = m.role === "user" ? "User" : `Assistant (${modelLabel})`;
      md += `### 👤 ${actor} *(${new Date(m.timestamp).toLocaleString()})*\n\n`;
      md += `${m.content}\n\n`;
      if (m.candidateTokens) {
        md += `*Generated: ${m.candidateTokens} tokens*  \n`;
      }
      if (m.cost) {
        md += `*Telemetry Cost: $${m.cost.toFixed(5)}*  \n`;
      }
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${maskedTitle.toLowerCase().replace(/\s+/g, "_")}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportChatAsJson = () => {
    if (!session) return;
    const sIndex = sessions ? sessions.findIndex(s => s.id === session.id) : -1;
    const dNum = sIndex !== -1 ? (sessions.length - sIndex) : 1;
    const maskedTitle = `Dialogue #${dNum}`;
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${maskedTitle.toLowerCase().replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split(".").pop()?.toLowerCase();

    reader.onload = async (evt) => {
      const content = evt.target?.result as string;
      if (!content) return;

      if (extension === "json") {
        try {
          const parsed = JSON.parse(content);
          if (parsed && typeof parsed === "object") {
            if (onUploadBackup) {
              onUploadBackup(parsed);
              alert("Conversation file imported successfully!");
            }
          }
        } catch (err) {
          alert("Error unpacking JSON chat backup.");
        }
      } else if (extension === "txt" || extension === "md") {
        setInputText((prev) => {
          const spacing = prev ? "\n\n" : "";
          return `${prev}${spacing}=== Context File: ${file.name} ===\n${content}\n=================================`;
        });
        
        if (session && onIngestFileToRag) {
          try {
            await onIngestFileToRag(file.name, content);
          } catch (e) {
            console.warn("Direct file RAG feed failed:", e);
          }
        }
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  };

  const refreshChatRecords = async () => {
    if (session) {
      const records = await localVectorDb.getVectorsForChat(session.id);
      setChatRecords(records);
    } else {
      setChatRecords([]);
    }
  };

  useEffect(() => {
    refreshChatRecords();
  }, [session?.id, showParamsPanel, session?.messages?.length]);

  const handleDeleteMemoryRecord = async (recId: string) => {
    const ok = await localVectorDb.deleteVector(recId);
    if (ok) {
      refreshChatRecords();
      if (onRefreshVectorCount) onRefreshVectorCount();
    }
  };

  const handleClearThreadMemory = async () => {
    if (!session) return;
    if (confirm("Are you sure you want to wipe all stored vector memories strictly for this active conversation?")) {
      const ok = await localVectorDb.deleteVectorsForChat(session.id);
      if (ok) {
        refreshChatRecords();
        if (onRefreshVectorCount) onRefreshVectorCount();
      }
    }
  };
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Combine built-in and custom system prompts for selection directory
  const availableSystemPrompts = [...BUILT_IN_PROMPTS, ...customPrompts];

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session?.messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !session) return;
    onSendMessage(inputText);
    setInputText("");
  };

  const currentSystemInstruction = availableSystemPrompts.find(
    (p) => p.id === session?.systemInstructionId
  );

  // Welcome choices trigger
  const handleQuickPrompt = (txt: string) => {
    if (isLoading || !session) return;
    onSendMessage(txt);
  };

  // Helper localized prompts
  const systemInstructionLabel = currentSystemInstruction 
    ? (currentSystemInstruction.id.startsWith("prompt-") ? getTranslation(language, currentSystemInstruction.id.slice(7).toUpperCase()) || currentSystemInstruction.label : currentSystemInstruction.label)
    : getTranslation(language, "HELPFUL_ASSISTANT") || "Helpful Assistant";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-white dark:bg-zinc-950">
      
      {/* Dynamic Toolbar */}
      <header className="py-3 px-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-950/70 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-150 lg:hidden hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-lg cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {session ? (
            <div>
              <h2 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {(() => {
                  const sIndex = sessions ? sessions.findIndex(s => s.id === session.id) : -1;
                  const dNum = sIndex !== -1 ? (sessions.length - sIndex) : 1;
                  return `Dialogue #${dNum}`;
                })()}
              </h2>
              {/* Dynamic Toolbar parameters metadata */}
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-zinc-400 font-medium">Temp: {session.temperature}</span>
                <span className="text-[10px] text-zinc-300 dark:text-zinc-800">•</span>
                <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-semibold">{systemInstructionLabel}</span>
              </div>
            </div>
          ) : (
            <div>
              <h2 className="text-xs font-bold text-zinc-500">{getTranslation(language, "NO_SESSION_SELECTED")}</h2>
              <p className="text-[9px] text-zinc-400">{getTranslation(language, "INIT_NEW_CHAT_HELP")}</p>
            </div>
          )}
        </div>

        {session && (
          <div className="flex items-center gap-2">
            
            {/* Active Model Selector directly on headers toolbar */}
            <div className="relative">
              <select
                value={session.modelId}
                onChange={(e) => onChangeSessionModel(e.target.value)}
                className="pl-7 pr-3 py-1 text-[10.5px] font-mono font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                {(availableModels || []).map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <Cpu className="absolute left-2 top-1.5 w-3.5 h-3.5 text-indigo-500 pointer-events-none" />
            </div>

            {/* Persona Quick Swap Dropdown directly in Workspace Toolbar */}
            <div className="relative">
              <select
                value={session.systemInstructionId || "prompt-helpful"}
                onChange={(e) => onChangeSessionSystemPromptRef(e.target.value)}
                className="pl-7 pr-3 py-1 text-[10.5px] font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
              >
                {availableSystemPrompts.map((p) => {
                  const labelTrans = p.id.startsWith("prompt-") ? getTranslation(language, p.id.slice(7).toUpperCase()) || p.label : p.label;
                  return (
                    <option key={p.id} value={p.id}>
                      👤 {labelTrans}
                    </option>
                  );
                })}
              </select>
              <Sparkles className="absolute left-2.5 top-1.5 w-3 h-3 text-amber-500 pointer-events-none" />
            </div>

            {/* Quick RAG toggle on Header */}
            <button
              type="button"
              onClick={onToggleSessionRag}
              title={session.ragEnabled ? getTranslation(language, "RAG_ENGINE_ON") : getTranslation(language, "RAG_ENGINE_OFF")}
              className={`p-1.5 rounded-lg border cursor-pointer transition-all ${session.ragEnabled ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <Database className="w-3.5 h-3.5" />
            </button>

            {/* Tuning Sliders toggle on Header */}
            <button
              type="button"
              onClick={() => setShowParamsPanel(!showParamsPanel)}
              title={getTranslation(language, "ACTIVE_PARAMETER_TUNING")}
              className={`p-1.5 rounded-lg border cursor-pointer transition-all ${showParamsPanel ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/30 text-indigo-655 dark:text-indigo-400" : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-455 hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>

            {/* Injected quick download dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                title="Download Conversation"
                className={`p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer transition-all ${showDownloadMenu ? "border-indigo-200 bg-indigo-50 text-indigo-500" : ""}`}
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              {showDownloadMenu && (
                <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl py-1 z-40 animate-scaleUp">
                  <div className="px-2.5 py-1 text-[9px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
                    Export Dialogue
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      exportChatAsMarkdown();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    As Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      exportChatAsJson();
                      setShowDownloadMenu(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <Code className="w-3.5 h-3.5 text-emerald-500" />
                    As Backup (.json)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Split-pane Workspace for Messages & Parameter controls */}
      <div className="flex-1 flex min-h-0 relative">
        
        {/* Left side: Messages display & Input field */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* Main Contents Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!session ? (
              /* Empty / No selected state */
              <div className="h-full flex flex-col items-center justify-center p-6 space-y-3 text-center">
                <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full text-zinc-400">
                  <Brain className="w-8 h-8 text-indigo-500" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-300">{getTranslation(language, "CHOOSE_COMPANION_CHAT")}</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
                  {getTranslation(language, "CHOOSE_COMPANION_CHAT_DESC")}
                </p>
              </div>
            ) : session.messages.length === 0 ? (
              
              /* Welcoming Custom Dashboard for fresh conversations */
              <div className="max-w-2xl mx-auto py-6 space-y-6">
                
                <div className="text-center space-y-2 p-6 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-100 dark:border-zinc-900">
                  <div className="p-2 w-9 h-9 bg-indigo-600 rounded-xl text-white mx-auto shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {getTranslation(language, "LETS_START_DISCUSSION")}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                    {getTranslation(language, "LETS_START_DISCUSSION_DESC")}
                  </p>
                </div>

                {/* Quick select parameters grids */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Box 1: Instructions selection info */}
                  <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 space-y-2.5">
                    <div className="flex items-center gap-1 text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                      <Compass className="w-4 h-4 text-amber-500" />
                      <span>{getTranslation(language, "CHOOSE_PERSONA_BEHAVIOR")}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {availableSystemPrompts.slice(0, 3).map((prompt) => {
                        const promptLabel = prompt.id.startsWith("prompt-") ? getTranslation(language, prompt.id.slice(7).toUpperCase()) || prompt.label : prompt.label;
                        return (
                          <button
                            key={prompt.id}
                            onClick={() => onChangeSessionSystemPromptRef(prompt.id)}
                            type="button"
                            className={`text-left p-2 rounded-lg text-[11px] font-medium border cursor-pointer transition-all ${session.systemInstructionId === prompt.id ? "border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/60 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400" : "border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900"}`}
                          >
                            <div className="font-semibold">{promptLabel}</div>
                            <p className="text-[9.5px] text-zinc-400 truncate mt-0.5">{prompt.prompt}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Box 2: Offline RAG capability toggle */}
                  <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 space-y-3.5 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-300">
                        <span className="flex items-center gap-1">
                          <Database className="w-4 h-4 text-indigo-500" />
                          {getTranslation(language, "OFFLINE_LOCAL_RAG")}
                        </span>
                        <span className={`px-2 py-0.2 text-[8px] font-bold uppercase rounded ${session.ragEnabled ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"}`}>
                          {session.ragEnabled ? getTranslation(language, "PEER_ON") : getTranslation(language, "PEER_OFF")}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal">
                        {getTranslation(language, "INDEX_SECURE_EXPLANATION")}
                      </p>
                    </div>
                    <button
                      onClick={onToggleSessionRag}
                      type="button"
                      className={`w-full py-2 hover:scale-[0.99] text-center text-xs font-semibold rounded-xl transition-all cursor-pointer ${session.ragEnabled ? "bg-zinc-100 text-zinc-850 hover:bg-zinc-200 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md border border-indigo-500"}`}
                    >
                      {session.ragEnabled ? getTranslation(language, "RAG_ENGINE_ON") : getTranslation(language, "RAG_ENGINE_OFF")}
                    </button>
                  </div>
                </div>

                {/* Quickstart suggestions */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{getTranslation(language, "QUICK_PROMPT_SUGGESTIONS")}</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleQuickPrompt("Let's build a clean TypeScript class with comprehensive error catching.")}
                      type="button"
                      className="p-3 text-left rounded-xl border border-zinc-150 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-xs text-zinc-650 dark:text-zinc-400 cursor-pointer"
                    >
                      <Code className="w-4 h-4 text-emerald-500 mb-1.5" />
                      <p className="font-semibold text-zinc-800 dark:text-zinc-300">{getTranslation(language, "QUOTE_TS_CODE")}</p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block leading-tight mt-1 truncate">{getTranslation(language, "QUOTE_TS_CODE_DESC")}</span>
                    </button>

                    <button
                      onClick={() => handleQuickPrompt("Please audit and polish the paragraph above. Make it flow with higher professional tone.")}
                      type="button"
                      className="p-3 text-left rounded-xl border border-zinc-150 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-xs text-zinc-650 dark:text-zinc-400 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-pink-500 mb-1.5" />
                      <p className="font-semibold text-zinc-800 dark:text-zinc-300">{getTranslation(language, "QUOTE_COPYEDIT_PROSE")}</p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block leading-tight mt-1 truncate">{getTranslation(language, "QUOTE_COPYEDIT_PROSE_DESC")}</span>
                    </button>

                    <button
                      onClick={() => handleQuickPrompt("What are key differences between traditional databases and vector indices?")}
                      type="button"
                      className="p-3 text-left rounded-xl border border-zinc-150 dark:border-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-xs text-zinc-650 dark:text-zinc-400 cursor-pointer"
                    >
                      <Compass className="w-4 h-4 text-sky-500 mb-1.5" />
                      <p className="font-semibold text-zinc-800 dark:text-zinc-300">{getTranslation(language, "QUOTE_EXPLAIN_VDB")}</p>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block leading-tight mt-1 truncate">{getTranslation(language, "QUOTE_EXPLAIN_VDB_DESC")}</span>
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Render messages */
              <div className="max-w-3xl mx-auto space-y-4">
                {session.messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const isSystem = msg.role === "system";
                  
                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2">
                        <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 text-[10px] font-mono px-3 py-1 rounded-full border border-zinc-200/50 dark:border-zinc-800 flex items-center gap-1.5 shadow-sm">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {getTranslation(language, "INJECTED_INSTRUCTION", { msg: msg.content })}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5 animate-fadeIn`}
                    >
                      {/* Left Avatar Icon */}
                      {!isUser && (
                        <div className="h-8 w-8 rounded-full bg-indigo-600 dark:bg-indigo-900/60 shrink-0 flex items-center justify-center text-white border border-indigo-500/30">
                          <Brain className="w-4 h-4" />
                        </div>
                      )}

                      {/* Message Bubble Panel */}
                      <div className={`max-w-[85%] rounded-2xl p-4 gap-1 flex flex-col ${isUser ? "bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-600/10" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-tl-none border border-zinc-200/50 dark:border-zinc-850"}`}>
                        
                        {/* Role Header */}
                        <div className={`flex justify-between items-baseline text-[9.5px] font-bold uppercase tracking-wider mb-1 ${isUser ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"}`}>
                          <span>{isUser ? getTranslation(language, "USER") : getTranslation(language, "ASSISTANT")}</span>
                          <span>
                            {new Date(msg.timestamp).toLocaleTimeString(undefined, { 
                              hour: "2-digit", minute: "2-digit" 
                            })}
                          </span>
                        </div>

                        {/* Parser Body */}
                        <div className="space-y-1">
                          {isUser ? (
                            <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          ) : (
                            parseMarkdownToJsx(msg.content)
                          )}
                        </div>

                        {/* Expandable RAG Context matched segments if present */}
                        {!isUser && msg.ragSources && msg.ragSources.length > 0 && (
                          <RagAccordion sources={msg.ragSources} language={language} />
                        )}

                        {/* Bubble Footer Meter: Prompt input costing & token consumption */}
                        {!isUser && (msg.totalTokens || msg.cost) && (
                          <div className="flex items-center gap-2 mt-3 pt-1.5 border-t border-zinc-250 dark:border-zinc-800 text-[9.5px] text-zinc-400 dark:text-zinc-500 font-mono">
                            <Coins className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{getTranslation(language, "PROMPT_MATCHING")}: {(msg.promptTokens || 0).toLocaleString()} t</span>
                            <span>•</span>
                            <span>{getTranslation(language, "RESPONSE")}: {(msg.candidateTokens || 0).toLocaleString()} t</span>
                            <span>•</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-sans">
                              {getTranslation(language, "COST")}: ${msg.cost ? msg.cost.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : "0.00000"}
                            </span>
                          </div>
                        )}

                      </div>

                      {/* Right Avatar Icon */}
                      {isUser && (
                        <div className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 shrink-0 flex items-center justify-center font-bold text-xs border border-zinc-200 dark:border-zinc-700 shadow-sm">
                          U
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* In-chat Loading Indicator */}
                {isLoading && (
                  <div className="flex justify-start items-start gap-2.5 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 flex items-center justify-center text-zinc-400">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div className="bg-zinc-100 dark:bg-zinc-900 rounded-2xl rounded-tl-none p-4 w-[160px] space-y-1.5 border border-zinc-200/50 dark:border-zinc-800">
                      <div className="h-2 bg-zinc-300 dark:bg-zinc-800 rounded w-1/3"></div>
                      <div className="h-2.5 bg-indigo-200 dark:bg-indigo-950/40 rounded w-full"></div>
                      <div className="h-2 bg-zinc-300 dark:bg-zinc-800 rounded w-5/6"></div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Form Footer Bar */}
          {session && (
            <footer className="p-3 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950">
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
                <div className="relative rounded-2xl border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm flex items-end">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={session.ragEnabled ? getTranslation(language, "ENTER_PROMPT_RAG_PLACEHOLDER") : getTranslation(language, "ENTER_PROMPT_PLACEHOLDER")}
                    rows={Math.min(inputText.split("\n").length, 5)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (inputText.trim()) handleSubmit(e);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-transparent border-none text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none resize-none max-h-[140px]"
                  />

                  <div className="p-2 shrink-0 flex items-center gap-1.5 self-center">
                    {/* File Attachment Upload */}
                    <div className="relative">
                      <input
                        type="file"
                        id="chat-file-upload-input"
                        accept=".txt,.md,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="chat-file-upload-input"
                        title="Upload backup (.json) or ingest text/markdown Context (.txt, .md)"
                        className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer flex items-center justify-center shrink-0"
                      >
                        <Paperclip className="w-4 h-4 shrink-0 text-zinc-400" />
                      </label>
                    </div>

                    {/* RAG trigger on input bar */}
                    <button
                      type="button"
                      onClick={onToggleSessionRag}
                      title={session.ragEnabled ? getTranslation(language, "RAG_ENGINE_ON") : getTranslation(language, "RAG_ENGINE_OFF")}
                      className={`p-2 rounded-xl transition-all cursor-pointer ${session.ragEnabled ? "text-indigo-500 hover:text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" : "text-zinc-400 hover:text-zinc-700 bg-transparent"}`}
                    >
                      <Database className="w-4 h-4" />
                    </button>

                    {/* Submit button */}
                    <button
                      type="submit"
                      disabled={!inputText.trim() || isLoading}
                      className="p-2 bg-indigo-655 hover:bg-indigo-750 text-white rounded-xl shadow-md cursor-pointer transition-all disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Offline watermark info text */}
                <div className="flex justify-between text-[9.5px] text-zinc-400 dark:text-zinc-500 px-2 mt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" /> {getTranslation(language, "PRIVATE_CHAT_SAVED")}
                  </span>
                  {session.ragEnabled && (
                    <span className="flex items-center gap-1 text-indigo-500 font-semibold uppercase tracking-wider text-[8px]">
                      <Sparkles className="w-3 h-3 anim-pulse text-amber-400" /> {getTranslation(language, "SEMANTIC_RECALL_ARMED")}
                    </span>
                  )}
                </div>
              </form>
            </footer>
          )}

        </div>

        {/* Dynamic Hyperparameters Slider Drawer Panel */}
        {showParamsPanel && session && (
          <div id="quick_params_tuning_drawer" className="w-80 border-l border-zinc-200 dark:border-zinc-900 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md p-5 overflow-y-auto shrink-0 flex flex-col gap-4 animate-fadeIn z-20">
            
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                {getTranslation(language, "ACTIVE_PARAMETER_TUNING")}
              </span>
              <button
                onClick={() => setShowParamsPanel(false)}
                className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 rounded-lg text-xs cursor-pointer"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Visual Chat Name Editing */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{getTranslation(language, "EDIT_DISCUSSION_TITLE")}</label>
              <input
                type="text"
                value={session.title}
                onChange={(e) => onUpdateSessionParams({ title: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Interactive Model selection representation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{getTranslation(language, "ACTIVE_PRESET_PROFILES")}</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => onUpdateSessionParams({ temperature: 0.2, topP: 0.8, topK: 20 })}
                  className="py-1 text-[10px] font-medium rounded-lg border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-center"
                >
                  🎯 {getTranslation(language, "PRECISE")}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSessionParams({ temperature: 0.7, topP: 0.95, topK: 40 })}
                  className="py-1 text-[10px] font-medium rounded-lg border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-center"
                >
                  ⚖️ {getTranslation(language, "BALANCED")}
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSessionParams({ temperature: 1.2, topP: 0.98, topK: 60 })}
                  className="py-1 text-[10px] font-medium rounded-lg border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 cursor-pointer text-center"
                >
                  🎨 {getTranslation(language, "CREATIVE")}
                </button>
              </div>
            </div>

            {/* Sliders list */}
            <div className="space-y-4 pt-2 border-t border-zinc-200 dark:border-zinc-800">
              
              {/* Temperature */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-350 text-[11px] font-semibold">{getTranslation(language, "TEMPERATURE_CREATIVITY")}</span>
                  <span className="font-mono text-indigo-500 font-bold">{session.temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={session.temperature}
                  onChange={(e) => onUpdateSessionParams({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 text-indigo-650"
                />
                <p className="text-[9.5px] text-zinc-400 dark:text-zinc-500 leading-tight">
                  {session.temperature <= 0.3 ? getTranslation(language, "DETERMINISTIC_HELP") : session.temperature <= 0.8 ? getTranslation(language, "BALANCED_HELP") : getTranslation(language, "CREATIVE_HELP")}
                </p>
              </div>

              {/* Max Generated tokens */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-350 text-[11px] font-semibold">{getTranslation(language, "MAX_OUTPUT_LIMIT")}</span>
                  <span className="font-mono text-indigo-500 font-bold">{session.maxOutputTokens} t</span>
                </div>
                <input
                  type="range"
                  min="256"
                  max="8192"
                  step="128"
                  value={session.maxOutputTokens}
                  onChange={(e) => onUpdateSessionParams({ maxOutputTokens: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Top P */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-350 text-[11px] font-semibold">{getTranslation(language, "TOP_P_NUCLEUS")}</span>
                  <span className="font-mono text-indigo-500 font-bold">{session.topP}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={session.topP}
                  onChange={(e) => onUpdateSessionParams({ topP: parseFloat(e.target.value) })}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Top K */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-350 text-[11px] font-semibold">{getTranslation(language, "TOP_K_SELECTION")}</span>
                  <span className="font-mono text-indigo-500 font-bold">{session.topK}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={session.topK}
                  onChange={(e) => onUpdateSessionParams({ topK: parseInt(e.target.value) })}
                  className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

            </div>

            {/* Conversation-Level Database Management */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  Thread Memory Controls
                </span>
                {chatRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearThreadMemory}
                    title="Purge conversation memory index"
                    className="p-1 px-1.5 text-[9px] font-bold text-red-650 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded border border-red-200 dark:border-red-900/30 transition-all cursor-pointer"
                  >
                    Wipe
                  </button>
                )}
              </div>

              {/* RAG Isolation Scope Selector */}
              <div className="space-y-1">
                <label className="text-[9px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wide block">Local Memory search scope</label>
                <select
                  value={session.ragScope || "global"}
                  onChange={(e) => onUpdateSessionParams({ ragScope: e.target.value as "global" | "conversation" })}
                  className="w-full text-xs p-1.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="global">🌐 Global (Dynamic aggregate indexing)</option>
                  <option value="conversation">🔒 Conversation Only (Isolate context)</option>
                </select>
                <p className="text-[8.5px] text-zinc-400 leading-normal block">
                  {session.ragScope === "conversation" 
                    ? "RAG searches strictly search vectors saved in this current thread." 
                    : "RAG searches fetch matching fragments across all conversations."}
                </p>
              </div>

              {/* Vector Inspector List */}
              <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800/80 pt-2 shadow-inner">
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wide">
                  <span>Saved fragments</span>
                  <span className="font-mono text-indigo-500 font-bold">{chatRecords.length} records</span>
                </div>
                {chatRecords.length === 0 ? (
                  <span className="text-[9px] text-zinc-400 italic block py-1">No vector memories registered. Send messages to index them automatically.</span>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1 mt-1 pr-1 border border-zinc-150 dark:border-zinc-850 rounded bg-white dark:bg-zinc-900 shadow-inner">
                    {chatRecords.map((m) => (
                      <div key={m.id} className="group flex items-start justify-between gap-1.5 p-1 px-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded transition-all">
                        <span className="text-[9px] text-zinc-600 dark:text-zinc-400 line-clamp-2 select-none break-all" title={m.text}>
                          {m.text}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemoryRecord(m.id)}
                          title="Delete this item"
                          className="p-1 text-zinc-400 hover:text-red-650 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer filter hover:scale-105 shrink-0 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Interactive Model info block */}
            <div className="mt-auto p-3.5 rounded-xl border border-zinc-250 dark:border-zinc-800 bg-zinc-100/40 dark:bg-zinc-900/40 text-[10px] space-y-1">
              <div className="font-bold text-zinc-700 dark:text-zinc-350 uppercase tracking-wide">{getTranslation(language, "ACTIVE_MODEL_CONTEXT")}</div>
              <p className="text-zinc-450 dark:text-zinc-500 leading-normal">
                {(availableModels || []).find(m => m.id === session.modelId)?.description || getTranslation(language, "ACTIVE_MODEL_HELP").replace("{modelId}", session.modelId)}
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

// Subordinate Component: Rag sources expander
function RagAccordion({ sources, language }: { sources: RagSource[]; language: Language }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mt-3.5 p-2 bg-zinc-200/50 dark:bg-zinc-950/50 border border-zinc-250 dark:border-zinc-800/80 rounded-xl space-y-2">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400 text-left cursor-pointer"
      >
        <span className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5" />
          Retrieved Matched Local Memory ({sources.length} fragments)
        </span>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="pt-2 divide-y divide-zinc-200 dark:divide-zinc-850 space-y-1.5">
          {sources.map((src, i) => (
            <div key={src.messageId + "-" + i} className="pt-1.5 text-[9.5px] space-y-1">
              <div className="flex justify-between text-zinc-450 dark:text-zinc-500 font-medium">
                <span>In thread: <span className="text-zinc-700 dark:text-zinc-300 font-semibold">"{src.chatTitle}"</span></span>
                <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1 rounded">
                  {Math.round(src.similarity * 100)}% match
                </span>
              </div>
              <p className="text-zinc-650 dark:text-zinc-400 leading-relaxed italic bg-white/40 dark:bg-zinc-900/40 p-2 rounded border border-zinc-100 dark:border-zinc-850/50 line-clamp-3">
                "{src.text}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
