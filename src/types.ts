/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = "user" | "model" | "system";

export interface RagSource {
  messageId: string;
  chatId: string;
  chatTitle: string;
  text: string;
  similarity: number;
  timestamp: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: string;
  promptTokens?: number;
  candidateTokens?: number;
  totalTokens?: number;
  cost?: number;
  isRagContext?: boolean;
  ragSources?: RagSource[];
}

export interface ChatSession {
  id: string;
  title: string;
  modelId: string;
  systemInstructionId?: string;
  customSystemInstruction?: string;
  temperature: number;
  topP: number;
  topK: number;
  maxOutputTokens: number;
  ragEnabled: boolean;
  ragScope?: "conversation" | "global";
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface ModelInfo {
  id: string;
  name: string;
  isConversable: boolean;
  description: string;
  inputCostPerMillion: number; // in USD
  outputCostPerMillion: number; // in USD
  provider?: string;
}

export interface SystemPrompt {
  id: string;
  label: string;
  prompt: string;
  isBuiltIn: boolean;
}

export interface ConsumptionRecord {
  id: string;
  timestamp: string;
  chatId: string;
  modelId: string;
  promptTokens: number;
  candidateTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface VectorRecord {
  id: string;
  chatId: string;
  messageId: string;
  text: string;
  embedding: number[];
  timestamp: string;
}

export interface AppStats {
  totalTokens: number;
  totalQueries: number;
  totalCost: number;
  modelBreakdown: Record<string, { tokens: number; queries: number; cost: number }>;
}

export interface SyncBackup {
  chats: ChatSession[];
  systemPrompts: SystemPrompt[];
  consumptionRecords: ConsumptionRecord[];
  vectorsCount: number;
  syncedAt: string;
}
