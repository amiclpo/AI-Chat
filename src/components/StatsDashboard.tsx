/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area 
} from "recharts";
import { 
  Coins, 
  Cpu, 
  Activity, 
  MessageSquare, 
  Trash2, 
  TrendingUp, 
  DollarSign, 
  ArrowUpRight,
  ChevronLeft
} from "lucide-react";
import { ConsumptionRecord, AppStats } from "../types";
import { REF_MODELS } from "../lib/data";
import { Language, getTranslation } from "../lib/translations";

interface StatsDashboardProps {
  records: ConsumptionRecord[];
  onClearRecords: () => void;
  language: Language;
  onBackToChat?: () => void;
  availableModels?: any[];
}

export function StatsDashboard({ records, onClearRecords, language, onBackToChat, availableModels }: StatsDashboardProps) {
  // Aggregate stats
  const stats: AppStats = useMemo(() => {
    let totalTokens = 0;
    let totalQueries = 0;
    let totalCost = 0;
    const modelBreakdown: Record<string, { tokens: number; queries: number; cost: number }> = {};

    // Initialize breakdowns
    (availableModels || REF_MODELS).forEach((m) => {
      modelBreakdown[m.id] = { tokens: 0, queries: 0, cost: 0 };
    });

    records.forEach((record) => {
      totalTokens += record.totalTokens;
      totalQueries += 1;
      totalCost += record.estimatedCost;

      if (!modelBreakdown[record.modelId]) {
        modelBreakdown[record.modelId] = { tokens: 0, queries: 0, cost: 0 };
      }
      modelBreakdown[record.modelId].tokens += record.totalTokens;
      modelBreakdown[record.modelId].queries += 1;
      modelBreakdown[record.modelId].cost += record.estimatedCost;
    });

    return {
      totalTokens,
      totalQueries,
      totalCost,
      modelBreakdown,
    };
  }, [records]);

  // Format data for Recharts (history of usage grouped by day)
  const chartData = useMemo(() => {
    const dailyMap: Record<string, { date: string; prompt: number; candidate: number; cost: number }> = {};

    // Sort records chronologically
    const sorted = [...records].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Limit to latest 30 records to keep chart elegant
    const recent = sorted.slice(-30);

    recent.forEach((rec) => {
      try {
        const dObj = new Date(rec.timestamp);
        const dateStr = dObj.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
        dailyMap[rec.id] = {
          date: dateStr,
          prompt: rec.promptTokens,
          candidate: rec.candidateTokens,
          cost: parseFloat(rec.estimatedCost.toFixed(5)),
        };
      } catch (e) {
        // ignore date formatting errors
      }
    });

    return Object.values(dailyMap);
  }, [records]);

  return (
    <div id="stats_dashboard" className="space-y-6">
      {/* Back to Chat navigation action */}
      {onBackToChat && (
        <button
          type="button"
          onClick={onBackToChat}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-indigo-600 dark:text-indigo-400 cursor-pointer transition-all active:scale-95 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{getTranslation(language, "BACK_TO_CHAT")}</span>
        </button>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Coins className="w-5 h-5 text-indigo-500" />
            {getTranslation(language, "STATS_TITLE")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {getTranslation(language, "STATS_DESC")}
          </p>
        </div>
        {records.length > 0 && (
          <button
            type="button"
            onClick={onClearRecords}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-colors border border-red-200 dark:border-red-900/50 cursor-pointer font-sans"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {getTranslation(language, "CLEAR_STATS_BTN")}
          </button>
        )}
      </div>

      {/* Grid Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{getTranslation(language, "TOTAL_SPEND")}</span>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              ${stats.totalCost.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{getTranslation(language, "TOTAL_TOKENS")}</span>
            <div className="text-2xl font-bold font-mono text-zinc-800 dark:text-zinc-100">
              {stats.totalTokens.toLocaleString()}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500">
            <Cpu className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{getTranslation(language, "QUERIES_MADE")}</span>
            <div className="text-2xl font-bold font-mono text-zinc-800 dark:text-zinc-100">
              {stats.totalQueries}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-amber-500">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500">{getTranslation(language, "AVG_COST")}</span>
            <div className="text-2xl font-bold font-mono text-indigo-500 dark:text-indigo-400">
              ${stats.totalQueries > 0 ? (stats.totalCost / stats.totalQueries).toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 }) : "0.00000"}
            </div>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Bento Model Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Model breakdown list */}
        <div className="lg:col-span-1 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              {getTranslation(language, "USAGE_BY_MODEL")}
            </h3>
            <div className="space-y-4">
              {(availableModels || REF_MODELS).map((model) => {
                const b = stats.modelBreakdown[model.id] || { tokens: 0, queries: 0, cost: 0 };
                const tokenPercent = stats.totalTokens > 0 ? (b.tokens / stats.totalTokens) * 100 : 0;

                return (
                  <div key={model.id} className="space-y-1.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-zinc-700 dark:text-zinc-300">{model.name}</span>
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[10px]">
                        {b.queries} queries • {b.tokens.toLocaleString()} t
                      </span>
                    </div>
                    <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full" 
                        style={{ width: `${tokenPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-zinc-400 dark:text-zinc-500">
                      <span>Est. cost: ${b.cost.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}</span>
                      <span>{tokenPercent.toFixed(1)}% volume</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            Pricing models are computed on estimation rules mapping directly to Standard Google Cloud Pricing Catalog.
          </div>
        </div>

        {/* Recharts chart */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            {getTranslation(language, "TIMELINE_TITLE")}
          </h3>

          <div className="flex-1 w-full min-h-[240px]">
            {chartData.length === 0 ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 py-10 space-y-2">
                <p className="text-xs text-center">{getTranslation(language, "NO_LOG_RECORDED")}</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPrompt" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCandidate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" strokeOpacity={0.1} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: "#71717a", fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <YAxis 
                    tick={{ fill: "#71717a", fontSize: 10 }} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#18181b", 
                      borderColor: "#27272a",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#fafafa"
                    }} 
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "11px" }} />
                  <Area 
                    type="monotone" 
                    name="Prompt (Input)" 
                    dataKey="prompt" 
                    stroke="#4f46e5" 
                    fillOpacity={1} 
                    fill="url(#colorPrompt)" 
                  />
                  <Area 
                    type="monotone" 
                    name="Completion (Output)" 
                    dataKey="candidate" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorCandidate)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Query log listing inside statistics */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
          {getTranslation(language, "DETAILED_LOG")}
        </h3>
        {records.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">No telemetry log entries available.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-100 dark:border-zinc-800/80">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
                  <th className="p-3">{getTranslation(language, "TIMESTAMP")}</th>
                  <th className="p-3">{getTranslation(language, "MODEL_NAME")}</th>
                  <th className="p-3 text-right">Prompt Tokens</th>
                  <th className="p-3 text-right">Completion Tokens</th>
                  <th className="p-3 text-right">Total Tokens</th>
                  <th className="p-3 text-right">{getTranslation(language, "EST_COST")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50 text-zinc-700 dark:text-zinc-300 font-mono">
                {records.slice().reverse().map((record) => {
                  const mName = (availableModels || REF_MODELS).find(m => m.id === record.modelId)?.name || record.modelId;
                  return (
                    <tr key={record.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20">
                      <td className="p-3 text-zinc-400 dark:text-zinc-500 font-mono">
                        {new Date(record.timestamp).toLocaleString(undefined, { 
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" 
                        })}
                      </td>
                      <td className="p-3 text-zinc-800 dark:text-zinc-200 font-sans font-medium">{mName}</td>
                      <td className="p-3 text-right">{record.promptTokens.toLocaleString()}</td>
                      <td className="p-3 text-right">{record.candidateTokens.toLocaleString()}</td>
                      <td className="p-3 text-right text-indigo-500 dark:text-indigo-400">{record.totalTokens.toLocaleString()}</td>
                      <td className="p-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold text-[13px]">
                        ${record.estimatedCost.toLocaleString(undefined, { minimumFractionDigits: 5, maximumFractionDigits: 5 })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
