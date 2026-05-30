/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  Plus, 
  MessageSquare, 
  Trash2, 
  Search, 
  Menu, 
  X, 
  Settings, 
  Activity, 
  Database,
  BrainCircuit, 
  Smartphone,
  ChevronLeft,
  Globe,
  Edit3,
  Check,
  ChevronDown,
  Sparkles,
  Download,
  Upload,
  ShieldCheck
} from "lucide-react";
import { ChatSession, SystemPrompt } from "../types";
import { REF_MODELS, BUILT_IN_PROMPTS } from "../lib/data";
import { Language, LANGUAGES, getTranslation } from "../lib/translations";

interface SidebarProps {
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClearAllSessions: () => void;
  onAddCustomSession: (title: string, modelId: string, systemPromptId: string) => void;
  customPrompts: SystemPrompt[];
  
  // Navigation tabs
  activeTab: "chat" | "stats" | "settings" | "tools" | "admin";
  setActiveTab: (tab: "chat" | "stats" | "settings" | "tools" | "admin") => void;

  // DB Vectors Count
  vectorCount: number;
  ragEnabled: boolean;

  // Drawer toggling on smaller viewports
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;

  // Multi-lingual
  language: Language;
  onLanguageChange: (lang: Language) => void;

  // Dynamic Models Fallback
  availableModels?: any[];

  // File Upload Backup Import
  onUploadBackup?: (backupData: any) => void;
}

export function Sidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onAddCustomSession,
  customPrompts,
  activeTab,
  setActiveTab,
  vectorCount,
  ragEnabled,
  sidebarOpen,
  setSidebarOpen,
  language,
  onLanguageChange,
  availableModels,
  onUploadBackup
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const [showCustomAdd, setShowCustomAdd] = useState(false);
  const [customTitle, setCustomTitle] = useState("");
  const [customModelId, setCustomModelId] = useState("gemini-3.5-flash");
  const [customPromptId, setCustomPromptId] = useState("prompt-helpful");

  // Long-press gestures tracking
  const [longPressedSessionId, setLongPressedSessionId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActive = useRef(false);

  const startPress = (sessionId: string) => {
    isLongPressActive.current = false;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      isLongPressActive.current = true;
      setLongPressedSessionId(sessionId);
    }, 600); // 600ms hold action
  };

  const endPress = (sessionId: string, e: React.MouseEvent | React.TouchEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (isLongPressActive.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  useEffect(() => {
    const handleOutsideClick = () => {
      // Keep selected long-pressed items until deliberate dismiss
    };
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSidebarBackupExport = () => {
    try {
      const data = {
        chats: sessions,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chats_all_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert("Database export failed.");
    }
  };

  const handleSidebarBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed) {
          if (onUploadBackup) {
            onUploadBackup(parsed);
            alert("Database backup imported successfully!");
          }
        }
      } catch (err) {
        alert("Invalid backup file format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filteredSessions = sessions.filter((session) => {
    const titleMatch = session.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Also match messages content for extra-intelligent offline search
    const messageMatch = session.messages.some((msg) => 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return titleMatch || messageMatch;
  });

  return (
    <>
      {/* Mobile Drawer Trigger Mask */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-all duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-900 z-50 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Top Section */}
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Brand/Indicator */}
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-md">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1">
                  {getTranslation(language, "APP_TITLE")}
                </h1>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                  {getTranslation(language, "APP_SUBTITLE")}
                </p>
              </div>
            </div>
            
            {/* Language switch on mobile trigger & Close menu */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 lg:hidden px-1.5 py-1 rounded bg-zinc-200/50 dark:bg-zinc-900/80 border border-zinc-200/30">
                <Globe className="w-3 h-3 text-indigo-500" />
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value as Language)}
                  className="bg-transparent border-none text-[10px] font-semibold text-zinc-750 dark:text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code} className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200">
                      {l.flag} {l.code.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Close Mobile Drawer */}
              <button 
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 lg:hidden hover:bg-zinc-150 dark:hover:bg-zinc-900 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Tab Selectors */}
          <div className="p-3 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-100/50 dark:bg-zinc-900/30 flex flex-col gap-1.5">
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => {
                  setActiveTab("chat");
                  setSidebarOpen(false);
                }}
                className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-200 flex flex-col items-center gap-0.5 ${activeTab === "chat" ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/50 dark:border-zinc-800" : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{getTranslation(language, "CHATS")}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("stats");
                  setSidebarOpen(false);
                }}
                className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-200 flex flex-col items-center gap-0.5 ${activeTab === "stats" ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/50 dark:border-zinc-800" : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"}`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>{getTranslation(language, "STATS")}</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("tools");
                  setSidebarOpen(false);
                }}
                className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-200 flex flex-col items-center gap-0.5 ${activeTab === "tools" ? "bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-zinc-200/50 dark:border-zinc-800" : "text-zinc-550 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"}`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI Tools</span>
              </button>
            </div>
            <div className="w-full">
              <button
                onClick={() => {
                  setActiveTab("admin");
                  setSidebarOpen(false);
                }}
                className={`w-full py-2 px-3 text-center rounded-xl text-xs font-bold cursor-pointer transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "admin" ? "bg-indigo-600 text-white shadow-md border border-indigo-500" : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800"}`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Admin Panel</span>
              </button>
            </div>
          </div>

          {/* Action Button: Start Conversation */}
          <div className="p-3 space-y-2 border-b border-zinc-200/65 dark:border-zinc-900/40">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onNewSession();
                  setActiveTab("chat");
                  setSidebarOpen(false);
                  setShowCustomAdd(false);
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 active:scale-[0.98] text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                title={getTranslation(language, "QUICK_ADD")}
              >
                <Plus className="w-3.5 h-3.5 text-indigo-500 font-bold" />
                <span>{getTranslation(language, "QUICK_ADD")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCustomAdd(!showCustomAdd);
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 active:scale-[0.98] rounded-xl text-xs font-semibold cursor-pointer transition-all border ${showCustomAdd ? "bg-indigo-600 text-white border-indigo-500" : "bg-white dark:bg-zinc-900 text-indigo-650 dark:text-indigo-400 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850"}`}
                title={getTranslation(language, "CUSTOM_ADD")}
              >
                <Sparkles className="w-3 h-3" />
                <span>{getTranslation(language, "CUSTOM_ADD")}</span>
              </button>
            </div>

            {/* Collapsible custom new session form */}
            {showCustomAdd && (
              <div className="p-3 bg-zinc-100/80 dark:bg-zinc-950/40 rounded-xl border border-zinc-250 dark:border-zinc-900 space-y-2.5 animate-fadeIn">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 flex items-center gap-1.5 justify-between">
                  <span>{getTranslation(language, "CREATE_CHAT_TITLE")}</span>
                  <button type="button" onClick={() => setShowCustomAdd(false)} className="text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200">✕</button>
                </div>
                
                {/* ID title name */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500">{getTranslation(language, "CHAT_TITLE_INPUT")}</label>
                  <input
                    type="text"
                    placeholder={`e.g. Dialogue #${sessions.length + 1}`}
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-50 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                
                {/* select model */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500">{getTranslation(language, "SELECT_MODEL_INPUT")}</label>
                  <select
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    {(availableModels || REF_MODELS).map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* select starting persona */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-semibold text-zinc-400 dark:text-zinc-500">{getTranslation(language, "SELECT_PERSONA_INPUT")}</label>
                  <select
                    value={customPromptId}
                    onChange={(e) => setCustomPromptId(e.target.value)}
                    className="w-full px-2 py-1 text-xs rounded border border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    {[...BUILT_IN_PROMPTS, ...customPrompts].map((p) => {
                      const labelTrans = p.id.startsWith("prompt-") ? getTranslation(language, p.id.slice(7).toUpperCase()) || p.label : p.label;
                      return (
                        <option key={p.id} value={p.id}>
                          {labelTrans}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onAddCustomSession(customTitle, customModelId, customPromptId);
                      setCustomTitle("");
                      setShowCustomAdd(false);
                      setSidebarOpen(false);
                    }}
                    className="flex-1 py-1 px-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded text-[11px] font-semibold transition-all cursor-pointer text-center"
                  >
                    {getTranslation(language, "CREATE")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCustomAdd(false)}
                    className="py-1 px-2 bg-zinc-250 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 hover:bg-zinc-300 hover:text-zinc-800 dark:hover:bg-zinc-750 dark:hover:text-zinc-205 rounded text-[11px] font-medium transition-all cursor-pointer"
                  >
                    {getTranslation(language, "CANCEL")}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Search bar */}
          <div className="px-3 pb-2 relative">
            <Search className="absolute left-6 top-2.5 w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder={getTranslation(language, "SEARCH_PLACEHOLDER")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-zinc-200/50 dark:bg-zinc-900 border-none text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none"
            />
          </div>

          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto px-3 space-y-1">
            <span className="px-2 text-[10px] font-bold tracking-wider uppercase text-zinc-450 dark:text-zinc-550 block mb-1">
              {getTranslation(language, "HISTORY_TITLE")}
            </span>
            {filteredSessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-450 dark:text-zinc-500 space-y-1 bg-zinc-100/30 dark:bg-zinc-900/20 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800/80">
                <MessageSquare className="w-5 h-5 mx-auto text-zinc-350 dark:text-zinc-650" />
                <p className="font-light">{getTranslation(language, "EMPTY_HISTORY")}</p>
              </div>
            ) : (
            filteredSessions.map((session) => {
              const isActive = activeSessionId === session.id && activeTab === "chat";
              const lastMsg = session.messages[session.messages.length - 1]?.content || "No messages";
              const modelLabel = (availableModels || REF_MODELS).find(m => m.id === session.modelId)?.name || session.modelId;
              
              const sessionIndex = sessions.findIndex((s) => s.id === session.id);
              const dialogueNumber = sessionIndex !== -1 ? (sessions.length - sessionIndex) : (filteredSessions.indexOf(session) + 1);
              const maskedTitle = `Dialogue #${dialogueNumber}`;

              return (
                <div
                  key={session.id}
                  className={`group relative flex items-center justify-between p-2 rounded-xl transition-all border ${isActive ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/60" : "hover:bg-zinc-150/60 dark:hover:bg-zinc-900/40 border-transparent"} cursor-pointer select-none`}
                  onClick={(e) => {
                    onSelectSession(session.id);
                    setActiveTab("chat");
                    setSidebarOpen(false);
                  }}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isActive ? "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"}`}>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0 pr-2 flex-1">
                      <div className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 truncate leading-tight">
                        {maskedTitle}
                      </div>
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-snug mt-0.5">
                        {lastMsg}
                      </p>
                      <div className="flex items-center gap-1 text-[9px] text-zinc-450 dark:text-zinc-500 mt-1">
                        <span className="font-mono bg-zinc-200 dark:bg-zinc-850 px-1 rounded truncate max-w-[120px]">{modelLabel}</span>
                        <span>•</span>
                        <span>{session.messages.length} msg</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
            )}
          </div>
        </div>

        {/* Database Index Health & Dialogue Database Manager (Bottom) */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-150/40 dark:bg-zinc-950 space-y-3">
          <div className="p-3.5 rounded-xl border border-zinc-250 dark:border-zinc-900 bg-white dark:bg-zinc-900/40 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-zinc-800 dark:text-zinc-300 flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                {getTranslation(language, "LOCAL_VECTOR_DB")}
              </span>
              <span className={`h-2 w-2 rounded-full ${ragEnabled ? "bg-emerald-500" : "bg-amber-400"}`} />
            </div>
            
            <div className="flex justify-between items-baseline text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              <span>{getTranslation(language, "RAG_MATCHES_INDEXED")}:</span>
              <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">{vectorCount} phrases</span>
            </div>

            <div className="text-[9px] text-zinc-400 dark:text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 pt-1.5">
              {getTranslation(language, "INDEX_SECURE_EXPLANATION")}
            </div>
          </div>

          {/* Dialogue Database Manager Actions */}
          <div className="border border-zinc-200 dark:border-zinc-850 bg-white/40 dark:bg-zinc-900/10 rounded-xl p-3 space-y-2">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">
              {getTranslation(language, "DATABASE_SUMMARY")}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              <div className="bg-white dark:bg-zinc-900/60 p-1.5 rounded border border-zinc-150 dark:border-zinc-850">
                <span className="text-zinc-400 leading-none block text-[9.5px]">{getTranslation(language, "TOTAL_SESSIONS")}</span>
                <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-350 mt-1 block">{sessions.length}</span>
              </div>
              <div className="bg-white dark:bg-zinc-900/60 p-1.5 rounded border border-zinc-150 dark:border-zinc-850">
                <span className="text-zinc-400 leading-none block text-[9.5px]">{getTranslation(language, "TOTAL_MESSAGES")}</span>
                <span className="text-xs font-bold font-mono text-zinc-700 dark:text-zinc-350 mt-1 block">
                  {sessions.reduce((acc, s) => acc + s.messages.length, 0)}
                </span>
              </div>
            </div>

            {/* Injected quick backup controls */}
            <div className="grid grid-cols-2 gap-1 text-[10px] pt-1.5 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleSidebarBackupExport}
                className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-355 rounded border border-zinc-200 dark:border-zinc-800 font-semibold cursor-pointer transition-colors"
                title="Download Backup JSON"
              >
                <Download className="w-2.5 h-2.5 text-indigo-500" />
                <span>Backup JSON</span>
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleSidebarBackupImport}
                  className="hidden"
                  id="sidebar-file-import-input"
                />
                <label
                  htmlFor="sidebar-file-import-input"
                  className="flex items-center justify-center gap-1 py-1 px-1.5 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-355 rounded border border-zinc-200 dark:border-zinc-800 font-semibold cursor-pointer transition-colors text-center"
                  title="Upload Backup JSON"
                >
                  <Upload className="w-2.5 h-2.5 text-indigo-500" />
                  <span>Restore JSON</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
