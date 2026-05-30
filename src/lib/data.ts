/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ModelInfo, SystemPrompt } from "../types";

export const REF_MODELS: ModelInfo[] = [
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    isConversable: true,
    description: "Default ultra-fast model for core assistant tasks, smart RAG embedding recall, and dialogue proxies.",
    inputCostPerMillion: 0.075,
    outputCostPerMillion: 0.30,
    provider: "gemini"
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    isConversable: true,
    description: "Premium model for advanced development and high logic content.",
    inputCostPerMillion: 1.25,
    outputCostPerMillion: 5.00,
    provider: "gemini"
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    isConversable: true,
    description: "Extremely fast, lower cost conversations.",
    inputCostPerMillion: 0.0375,
    outputCostPerMillion: 0.15,
    provider: "gemini"
  },
  {
    id: "gpt-4o",
    name: "GPT 4o (Omni)",
    isConversable: true,
    description: "High intelligence and versatile flagship reasoning model from OpenAI.",
    inputCostPerMillion: 2.50,
    outputCostPerMillion: 10.00,
    provider: "openai"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT 4o Mini",
    isConversable: true,
    description: "Surgical, ultra-fast and cost-efficient lightweight OpenAI companion.",
    inputCostPerMillion: 0.15,
    outputCostPerMillion: 0.60,
    provider: "openai"
  },
  {
    id: "claude-3-5-sonnet-latest",
    name: "Claude 3.5 Sonnet",
    isConversable: true,
    description: "State-of-the-art coding and analytical reasoning companion from Anthropic.",
    inputCostPerMillion: 3.00,
    outputCostPerMillion: 15.00,
    provider: "anthropic"
  },
  {
    id: "claude-3-5-haiku-latest",
    name: "Claude 3.5 Haiku",
    isConversable: true,
    description: "Blazing fast instruction follower, perfect for editing tasks.",
    inputCostPerMillion: 0.80,
    outputCostPerMillion: 4.00,
    provider: "anthropic"
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat (V3)",
    isConversable: true,
    description: "Multi-billion parameter reasoning and conversational standard model.",
    inputCostPerMillion: 0.14,
    outputCostPerMillion: 0.28,
    provider: "deepseek"
  },
  {
    id: "deepseek-coder",
    name: "DeepSeek Coder (R1)",
    isConversable: true,
    description: "Reasoning and code synthesis optimized model with deep trace validation.",
    inputCostPerMillion: 0.55,
    outputCostPerMillion: 2.19,
    provider: "deepseek"
  }
];

export const BUILT_IN_PROMPTS: SystemPrompt[] = [
  {
    id: "prompt-helpful",
    label: "Adaptive Personal Companion",
    prompt: "You are a versatile and highly empathetic personal AI companion. Focus on giving helpful, clear, and comprehensive answers. Prioritize accuracy and well-structured formatting in your responses.",
    isBuiltIn: true
  },
  {
    id: "prompt-developer",
    label: "Senior Software Architect",
    prompt: "You are a senior software engineer and architect. Provide highly modular, well-commented, elegant, and standard-compliant code. Strictly include error handling, outline files structure if necessary, and use robust types.",
    isBuiltIn: true
  },
  {
    id: "prompt-academic",
    label: "Socratic Method Tutor",
    prompt: "You are a Socratic tutor. Do not give the answers directly. Guide the student step-by-step to discover the concepts by asking precise, gentle, and thought-provoking questions that build on their inputs.",
    isBuiltIn: true
  },
  {
    id: "prompt-editor",
    label: "Refined Copyeditor",
    prompt: "You are a premier publisher copyeditor. Take the user's rough text and refine it for clarity, pacing, flow, and style. Maintain the original core message but elevate the prose to be engaging, professional, and grammatically immaculate.",
    isBuiltIn: true
  },
  {
    id: "prompt-summarizer",
    label: "Executive Briefing Officer",
    prompt: "You are an executive concise communicator. Condense any length of context into extremely structured executive briefs. Start with a 2-sentence key conclusion, followed by scannable, logical nested bullet points under thematic headers.",
    isBuiltIn: true
  }
];

export const INITIAL_USER_CONFIG = {
  theme: "dark" as "dark" | "light",
  defaultModelId: "gemini-3.5-flash",
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
  ragEnabled: true,
  ragSourceCount: 3,
  ragSimilarityThreshold: 0.35,
};
