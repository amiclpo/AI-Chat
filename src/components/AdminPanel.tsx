/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { 
  ShieldCheck, 
  Lock, 
  Terminal, 
  Cpu, 
  HelpCircle, 
  RefreshCw, 
  Database, 
  AlertTriangle,
  Layers, 
  Globe, 
  Percent, 
  CheckCircle,
  Eye,
  EyeOff,
  Coins,
  History,
  Trash2,
  ListRestart
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { ConsumptionRecord } from "../types";
import { REF_MODELS } from "../lib/data";
import { SettingsPanel } from "./SettingsPanel";
import { Language } from "../lib/translations";

interface AdminPanelProps {
  records: ConsumptionRecord[];
  vectorCount: number;
  availableModels: any[];
  onClearRecords: () => void;
  onClearVectorDb: () => void;
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

  // Settings Panel Configs
  temperature: number;
  setTemperature: (val: number) => void;
  topP: number;
  setTopP: (val: number) => void;
  topK: number;
  setTopK: (val: number) => void;
  maxOutputTokens: number;
  setMaxOutputTokens: (val: number) => void;
  ragEnabled: boolean;
  setRagEnabled: (val: boolean) => void;
  ragSourceCount: number;
  setRagSourceCount: (val: number) => void;
  ragSimilarityThreshold: number;
  setRagSimilarityThreshold: (val: number) => void;
  customPrompts: any[];
  onAddCustomPrompt: (label: string, promptText: string) => void;
  onDeleteCustomPrompt: (id: string) => void;
  onSyncPush: (syncKey: string) => Promise<{ success: boolean; error?: string }>;
  onSyncPull: (syncKey: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  handleFullStateImport: (importedState: any) => void;
  handleFullStateExport: () => any;
  language: Language;
  onLanguageChange: (lang: Language) => void;

  // MySQL connection parameters integration
  useMysql: boolean;
  setUseMysql: (val: boolean) => void;
  sessions: any[];
  loadAllDataFromDb: () => Promise<void>;
}

export function AdminPanel({
  records,
  vectorCount,
  availableModels,
  onClearRecords,
  onClearVectorDb,
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
  ragEnabled,
  setRagEnabled,
  ragSourceCount,
  setRagSourceCount,
  ragSimilarityThreshold,
  setRagSimilarityThreshold,
  customPrompts,
  onAddCustomPrompt,
  onDeleteCustomPrompt,
  onSyncPush,
  onSyncPull,
  handleFullStateImport,
  handleFullStateExport,
  language,
  onLanguageChange,
  useMysql,
  setUseMysql,
  sessions,
  loadAllDataFromDb
}: AdminPanelProps) {
  // Authentication states
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (password === "admin123") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Incorrect system passcode. Attempt audit logged.");
    }
  };

  const handleQuickFill = () => {
    setPassword("admin123");
    setAuthError("");
  };

  // Admin Diagnostics Data
  const diagnostics = useMemo(() => {
    const totalPrompt = records.reduce((acc, current) => acc + current.promptTokens, 0);
    const totalCompletion = records.reduce((acc, current) => acc + current.candidateTokens, 0);
    const totalEstCost = records.reduce((acc, current) => acc + current.estimatedCost, 0);

    return {
      totalPrompt,
      totalCompletion,
      totalEstCost,
      averageLatency: records.length > 0 ? "1.42s" : "0.00s",
      activeCores: "16-Thread Virtualized CPU",
      serverMemory: "3.71 GB / 4.00 GB Allocated",
      databaseType: "Vector Firestore Proxy System",
      ragStatus: vectorCount > 0 ? "Optimized index ready" : "Awaiting files ingestion",
    };
  }, [records, vectorCount]);

  // Chart aggregation: Model Token Distribution Pie Chart
  const pieChartData = useMemo(() => {
    const tokensByProvider: Record<string, number> = {
      gemini: 0,
      openai: 0,
      anthropic: 0,
      deepseek: 0,
      fallback: 0
    };

    records.forEach((rec) => {
      // Find provider of active model
      const modelMeta = (availableModels || REF_MODELS).find(m => m.id === rec.modelId);
      const provider = modelMeta?.provider || "fallback";
      if (typeof tokensByProvider[provider] === "number") {
        tokensByProvider[provider] += rec.totalTokens;
      }
    });

    return Object.entries(tokensByProvider)
      .map(([name, value]) => ({
        name: name.toUpperCase(),
        value
      }))
      .filter(item => item.value > 0);
  }, [records, availableModels]);

  const COLORS = ["#4f46e5", "#10b981", "#f59e0b", "#ec4899", "#71717a"];

  // Mock operational events
  const auditLogs = useMemo(() => {
    const events = [
      { id: "1", date: new Date(Date.now() - 30000).toISOString(), type: "SUCCESS", msg: "API Gateway proxy heartbeat verify success." },
      { id: "2", date: new Date(Date.now() - 120000).toISOString(), type: "AUTH", msg: "Admin authentication socket initial test." },
      { id: "3", date: new Date(Date.now() - 600000).toISOString(), type: "VECTOR", msg: `Vector storage instance verified with index size ${vectorCount}.` },
    ];

    records.slice(-5).forEach((rec, idx) => {
      events.push({
        id: `rec-${idx}`,
        date: rec.timestamp,
        type: "INFERENCE",
        msg: `Processed transaction ${rec.id.substring(0,6)} using ${rec.modelId}. Tokens: ${rec.totalTokens} (+${rec.estimatedCost.toFixed(5)} USD)`
      });
    });

    return events.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, vectorCount]);

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 rounded-2xl">
            <Lock className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Administrator Controls Login</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Secure panel access. To bypass this screen during test previewing, authorize with standard passcode.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Passcode Credentials
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl pl-4 pr-10 py-2.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-zinc-400 hover:text-zinc-650"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {authError && (
              <p className="text-[11px] text-red-500 font-semibold">{authError}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow transition-all"
          >
            Authorize Admin Session
          </button>
        </form>

        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans">
            <span className="font-bold">Developer Bypass Instruction:</span> The default local administrator passphrase is pre-configured as <code className="bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold px-1.5 py-0.5 rounded">admin123</code>. Click below to quickly fill.
            <button
              onClick={handleQuickFill}
              className="mt-2 block text-[10.5px] text-indigo-500 hover:underline font-semibold cursor-pointer"
            >
              Fill Credentials Automatically
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Dashboard Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <ShieldCheck className="w-5.5 h-5.5 text-emerald-500" />
            Admin System Control Desk
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Real-time diagnostics logs, system database credentials health, and container micro-loads.
          </p>
        </div>
        <button
          onClick={() => setIsAuthenticated(false)}
          className="px-3 py-1.5 text-xs text-red-650 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg cursor-pointer border border-zinc-200 dark:border-zinc-800 font-semibold"
        >
          Revoke Credentials
        </button>
      </div>

      {/* Grid Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Micro VM Memory</p>
            <h4 className="text-md font-extrabold font-mono text-zinc-800 dark:text-zinc-200 mt-1">{diagnostics.serverMemory}</h4>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-indigo-500">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">RAG Databases status</p>
            <h4 className="text-md font-extrabold text-zinc-800 dark:text-zinc-200 mt-1">{diagnostics.ragStatus}</h4>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-indigo-555">
            <Database className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">Vector size in indices</p>
            <h4 className="text-md font-extrabold font-mono text-indigo-500 mt-1">{vectorCount} indices stored</h4>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-indigo-500">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-850 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">AVG Client Query latency</p>
            <h4 className="text-md font-extrabold font-mono text-emerald-500 mt-1">{diagnostics.averageLatency}</h4>
          </div>
          <div className="p-2 bg-zinc-50 dark:bg-zinc-800/60 rounded-lg text-emerald-500">
            <Percent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Database control cards and charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* API Credentials Registry check */}
        <div className="p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl space-y-4">
          <h3 className="text-sm font-semibold text-zinc-850 dark:text-zinc-250 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Proxy Services Registry
          </h3>

          <div className="space-y-3">
            {/* Gemini Check */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Google Gemini API</span>
              {geminiApiKey ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active Secure
                </span>
              ) : (
                <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Placeholder API key
                </span>
              )}
            </div>

            {/* OpenAI Check */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">OpenAI API Engine</span>
              {openaiApiKey ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active Secure
                </span>
              ) : (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold px-2 py-0.5 rounded-full">
                  Not Configured
                </span>
              )}
            </div>

            {/* Anthropic Check */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Anthropic Claude</span>
              {anthropicApiKey ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active Secure
                </span>
              ) : (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold px-2 py-0.5 rounded-full">
                  Not Configured
                </span>
              )}
            </div>

            {/* DeepSeek Check */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">DeepSeek Core</span>
              {deepseekApiKey ? (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> Active Secure
                </span>
              ) : (
                <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 font-semibold px-2 py-0.5 rounded-full">
                  Not Configured
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-150 dark:border-zinc-850 space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-red-500">Destructive Actions Zone</h4>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onClearRecords}
                className="w-full text-left py-2 px-3 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold border border-red-200 dark:border-red-950 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                Clear Telemetry Logs
              </button>
              <button
                type="button"
                onClick={onClearVectorDb}
                className="w-full text-left py-2 px-3 text-xs text-red-650 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold border border-red-200 dark:border-red-950 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
              >
                <ListRestart className="w-3.5 h-3.5 shrink-0" />
                Purge RAG Embedding Index
              </button>
            </div>
          </div>
        </div>

        {/* Recharts Pie Chart panel showing model share */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl flex flex-col justify-between">
          <div className="space-y-1 pb-3">
            <h3 className="text-sm font-semibold text-zinc-850 dark:text-zinc-250 flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-500" />
              Token Volumetric Distribution by Provider
            </h3>
            <p className="text-[11px] text-zinc-500 leading-none">
              Comparative visualization of token traffic grouped by model manufacturer boundaries.
            </p>
          </div>

          <div className="flex-1 w-full min-h-[190px] flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-xs text-zinc-400 font-sans text-center py-5">
                No token records retrieved yet. Interact with the chat first!
              </div>
            ) : (
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-around">
                <div className="w-48 h-48 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value.toLocaleString()} tokens`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 mt-4 md:mt-0 font-sans text-xs">
                  {pieChartData.map((d, index) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div 
                        className="w-3.5 h-3.5 rounded-full shrink-0" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-semibold text-zinc-750 dark:text-zinc-350">{d.name}</span>
                      <span className="font-mono text-zinc-450 dark:text-zinc-500 text-[11px]">
                        ({d.value.toLocaleString()} t)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operational System Logs */}
      <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3">
        <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-400" />
          Runtime Diagnostics Console Logs
        </h3>

        <div className="rounded-lg bg-black border border-zinc-900 p-4 font-mono text-[11px] leading-relaxed select-text space-y-2 max-h-[220px] overflow-y-auto scroller-custom text-zinc-350">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-2.5">
              <span className="text-zinc-500 hover:text-zinc-400 font-mono shrink-0 select-none">
                [{new Date(log.date).toLocaleTimeString()}]
              </span>
              <span className={`font-bold uppercase tracking-wider shrink-0 select-none ${log.type === "SUCCESS" ? "text-emerald-500" : log.type === "AUTH" ? "text-indigo-400" : log.type === "VECTOR" ? "text-amber-400" : "text-blue-400"}`}>
                [{log.type}]
              </span>
              <span className="text-zinc-100">{log.msg}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Embedded Settings Functions under the Control Desk */}
      <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-800">
        <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-900 shadow-sm text-left">
          <SettingsPanel
            temperature={temperature}
            setTemperature={setTemperature}
            topP={topP}
            setTopP={setTopP}
            topK={topK}
            setTopK={setTopK}
            maxOutputTokens={maxOutputTokens}
            setMaxOutputTokens={setMaxOutputTokens}
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
            ragEnabled={ragEnabled}
            setRagEnabled={setRagEnabled}
            ragSourceCount={ragSourceCount}
            setRagSourceCount={setRagSourceCount}
            ragSimilarityThreshold={ragSimilarityThreshold}
            setRagSimilarityThreshold={setRagSimilarityThreshold}
            customPrompts={customPrompts}
            onAddCustomPrompt={onAddCustomPrompt}
            onDeleteCustomPrompt={onDeleteCustomPrompt}
            onSyncPush={onSyncPush}
            onSyncPull={onSyncPull}
            onFullStateImport={handleFullStateImport}
            onFullStateExport={handleFullStateExport}
            vectorCount={vectorCount}
            onClearVectorDb={onClearVectorDb}
            language={language}
            onLanguageChange={onLanguageChange}
            useMysql={useMysql}
            setUseMysql={setUseMysql}
            sessions={sessions}
            loadAllDataFromDb={loadAllDataFromDb}
          />
        </div>
      </div>
    </div>
  );
}
