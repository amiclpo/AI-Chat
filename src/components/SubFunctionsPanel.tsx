/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  FileText, 
  Code, 
  Languages, 
  HelpCircle, 
  PenTool, 
  Mail, 
  FileSpreadsheet, 
  Activity, 
  GraduationCap, 
  Smile, 
  UserCheck, 
  Compass, 
  Megaphone, 
  Braces, 
  BookOpen,
  Search,
  Zap,
  ChevronRight,
  Send,
  Database
} from "lucide-react";
import { Language, getTranslation } from "../lib/translations";
import { ChatSession, SystemPrompt } from "../types";

// Interface for 15+ sub-functions
interface AiFunction {
  id: string;
  name: string;
  description: string;
  category: "writing" | "code" | "productivity" | "lifestyle" | "advanced";
  icon: React.ComponentType<any>;
  systemPrompt: string;
  placeholderText: string;
  inputs: {
    label: string;
    key: string;
    type: "text" | "textarea" | "select";
    options?: string[];
    placeholder?: string;
  }[];
}

interface SubFunctionsPanelProps {
  onExecuteFunction: (systemPrompt: string, userText: string, functionTitle: string) => void;
  language: Language;
}

export const AI_SUB_FUNCTIONS: AiFunction[] = [
  {
    id: "fn-summarizer",
    name: "Executive Briefing Summarizer",
    description: "Condense long articles, reports, or research papers into strategic highlights and bullet points.",
    category: "writing",
    icon: FileText,
    systemPrompt: "You are an expert Executive Summarizer. Analyze the input content and output a structured summary. Start with a bold 2-sentence key conclusion, followed by a bulleted breakdown of core facts, and end with a 'Strategic Action Points' section.",
    placeholderText: "Paste your lengthy text or report here for professional summarization...",
    inputs: [
      { label: "Target Length", key: "length", type: "select", options: ["Brief (1-2 paragraphs)", "Detailed Report", "Key Bullet Points Only"] },
      { label: "Content Block", key: "content", type: "textarea", placeholder: "Paste your source text here..." }
    ]
  },
  {
    id: "fn-polish",
    name: "Grammar & Style Polisher",
    description: "Refine word choice, elevate sentence pacing, and eliminate spelling/grammar flaws.",
    category: "writing",
    icon: PenTool,
    systemPrompt: "You are an elite publishing editor. Analyze the user text and rewrite it perfectly. Retain the core meaning, but optimize vocabulary density, tone, sentence pacing, and clean up grammatical errors. Highlight the major enhancements you made.",
    placeholderText: "Type or paste your rough copy here...",
    inputs: [
      { label: "Desired Tone", key: "tone", type: "select", options: ["Professional / Executive", "Engaging / Conversational", "Academic / Formal", "Creative"] },
      { label: "Raw Draft", key: "content", type: "textarea", placeholder: "Paste the draft you want polished..." }
    ]
  },
  {
    id: "fn-coder",
    name: "Smart Code Synthesizer",
    description: "Generate robust TypeScript, React, SQL, HTML, or CSS code snippets with documentation.",
    category: "code",
    icon: Code,
    systemPrompt: "You are a software architect program analyzer. Generate clean, modular, and modern type-safe script blocks based on requirements. Include comments, handle theoretical exceptions, and write a high-level explanation showing component setup.",
    placeholderText: "Describe the function or UI component you wish to build...",
    inputs: [
      { label: "Programming Dialect", key: "language", type: "select", options: ["TypeScript / React", "JavaScript / HTML CSS", "Python", "SQL Query", "Tailwind CSS Layout"] },
      { label: "Requirements", key: "content", type: "textarea", placeholder: "e.g., Create interactive modal that closes on escape key..." }
    ]
  },
  {
    id: "fn-translator",
    name: "Contextual Translator",
    description: "Bridge communication with idiomatic translations rather than literal word-to-word transfers.",
    category: "productivity",
    icon: Languages,
    systemPrompt: "You are an expert bilingual interpreter. Translate the text contextually. Do not give direct cold literal dictionary matchings; preserve appropriate localized expressions, natural cultural idioms, and original tone.",
    placeholderText: "Text to be translated contextually...",
    inputs: [
      { label: "Target Dialect", key: "target", type: "select", options: ["English", "Mandarin (中文)", "Spanish (Español)", "Japanese (日本語)", "French (Français)", "German (Deutsch)"] },
      { label: "Source Content", key: "content", type: "textarea" }
    ]
  },
  {
    id: "fn-socratic",
    name: "Socratic Method Tutor",
    description: "Master difficult scientific or humanities principles through structured Socratic tutoring.",
    category: "lifestyle",
    icon: GraduationCap,
    systemPrompt: "You are a Socratic tutor. Do not provide answers straight away. Guide the student step-by-step to discover the concepts by asking precise, gentle, and thought-provoking questions that build on their insights.",
    placeholderText: "What hard concept do you want to master?",
    inputs: [
      { label: "Topic", key: "topic", type: "text", placeholder: "e.g., Quantum Entanglement, Supply & Demand curves" },
      { label: "Your Current Understanding", key: "content", type: "textarea", placeholder: "Write what you already know or suspect about this topic..." }
    ]
  },
  {
    id: "fn-copywriter",
    name: "Creative Copywriter",
    description: "Generate viral social media captions, landing page copy, or email subject lines that convert.",
    category: "writing",
    icon: Megaphone,
    systemPrompt: "You are a digital conversion copywriter. Generate catchy high-engagement draft concepts. Ensure you include psychological triggers, rhythmic structure, and elegant callToActions. Offer 3 diverse alternative styles.",
    placeholderText: "What product, service, or topic are you marketing?",
    inputs: [
      { label: "Marketing Platform", key: "channel", type: "select", options: ["LinkedIn Post", "Landing Page Hero Headline", "SaaS Newsletter Pitch", "Product Subtitle / Slogan"] },
      { label: "Core Proposition", key: "content", type: "textarea", placeholder: "Describe the product and who it is built for..." }
    ]
  },
  {
    id: "fn-email",
    name: "Executive Email Composer",
    description: "Draft professional out-of-office plans, business proposals, sales pitches, or polite replies.",
    category: "productivity",
    icon: Mail,
    systemPrompt: "You are a corporate communications consultant. Draft highly refined, courteous, and crisp business mail copy. Avoid passive aggregate clichés, optimize readability, ensure clear action targets, and provide alternate concise subject lines.",
    placeholderText: "Briefly outline the objective of your email...",
    inputs: [
      { label: "Situation Type", key: "style", type: "select", options: ["Client Follow-up", "Polite Decline / Boundary Setting", "Project Launch Update", "Meeting Invite Request"] },
      { label: "Key points to include", key: "content", type: "textarea", placeholder: "e.g., Request budget sign-off by Thursday, attach report links..." }
    ]
  },
  {
    id: "fn-meetings",
    name: "Meeting Minute Processor",
    description: "Convert chaotic raw speaker transcripts into clean briefs, action matrices, and milestones.",
    category: "productivity",
    icon: FileSpreadsheet,
    systemPrompt: "You are an Agile Project Manager. Ingest disorganized transcription logs and compile clean meeting minutes. Organize output by: 1. Core Decisions Made (Numbered), 2. Action Matrix (Owner, Action Item, Target Date Table), 3. Next Follow-up Milestones.",
    placeholderText: "Paste raw transcript lines here...",
    inputs: [
      { label: "Transcription Input", key: "content", type: "textarea", placeholder: "Paste transcript lines (e.g., 'John: Let's ship by Tuesday... Sarah: Yes, but we need API ready...')" }
    ]
  },
  {
    id: "fn-recipe",
    name: "Dietary Ingredient Chef",
    description: "Design healthy, balanced culinary recipes using whatever remains in your kitchen cupboard.",
    category: "lifestyle",
    icon: Activity,
    systemPrompt: "You are a creative culinary dietitian. Build delicious step-by-step recipes utilizing exclusively the food items input by the user, supplemented by standard pantry spices/oils. Include calories estimation and health benefits.",
    placeholderText: "List items inside your pantry or fridge...",
    inputs: [
      { label: "Primary Ingredients", key: "content", type: "textarea", placeholder: "e.g., Salmon, sweet potato, green peas, greek yogurt..." },
      { label: "Diet Limit", key: "diet", type: "select", options: ["None / Low Carb", "Vegetarian", "Vegan", "Gluten-Free", "High Protein Keto"] }
    ]
  },
  {
    id: "fn-flashcard",
    name: "Study Flashcard Architect",
    description: "Synthesize study terminology, math formulas, or tech glossary terms into crisp exam cards.",
    category: "lifestyle",
    icon: BookOpen,
    systemPrompt: "You are a cognitive study expert. Convert complex factual materials into high-retainment flashcards. Each card must have a structured Front (question/concept) and Back (succinct, visual, bold definition). Generate at least 5 complete cards.",
    placeholderText: "Paste technical notes, historical data, or raw glossary words here...",
    inputs: [
      { label: "Glossary Material", key: "content", type: "textarea", placeholder: "Paste material to study..." }
    ]
  },
  {
    id: "fn-sentiment",
    name: "Mood & Sentiment Tracker",
    description: "Deconstruct personal journals or customer feedback to isolate core emotional states and trends.",
    category: "advanced",
    icon: Smile,
    systemPrompt: "You are an emotive analyst. Evaluate the structural tone of journal text or reviews. Provide: 1. Primary Sentiment & Confidence Rating (%) 2. Core Emotional Spectrum breakdown, 3. constructive suggestions or coaching insights.",
    placeholderText: "Paste diary entry or client testimonial...",
    inputs: [
      { label: "Analyze Content", key: "content", type: "textarea", placeholder: "Write down your journal entry or paste review text here..." }
    ]
  },
  {
    id: "fn-interview",
    name: "Virtual Interview Simulator",
    description: "Rehearse responses to high-stakes interview questions with professional contextual critiques.",
    category: "advanced",
    icon: UserCheck,
    systemPrompt: "You are a senior talent acquisition consultant. Behave as an interviewer. Output: 1. A typical difficult question tailored to the role specified. 2. Ask the candidate to speak their draft answer. 3. (When provided) offer constructive critique on content organization.",
    placeholderText: "What job position or sector are you aiming for?",
    inputs: [
      { label: "Job Title", key: "role", type: "text", placeholder: "e.g., Senior Product Manager, Junior Frontend Dev" },
      { label: "Company Profile", key: "company", type: "select", options: ["SaaS Startup", "Enterprise Fortune 500", "Creative Agency", "Nonprofit Organization"] },
      { label: "Simulate Round", key: "content", type: "textarea", placeholder: "Paste a draft answer or type 'Start interview' to get your first question!" }
    ]
  },
  {
    id: "fn-itinerary",
    name: "Adaptive Travel Concierge",
    description: "Generate highly optimized hourly travel schedules with local highlights, transport, and reviews.",
    category: "lifestyle",
    icon: Compass,
    systemPrompt: "You are a local travel curator. Formulate optimized visual travel itineraries. For the inputs, design a structured daily roster showing morning, afternoon, and evening slots. Include food stop suggestions and transit recommendations.",
    placeholderText: "Where are you heading and what do you like?",
    inputs: [
      { label: "Destination", key: "destination", type: "text", placeholder: "e.g., Kyoto, Japan; Paris, France" },
      { label: "Duration (Days)", key: "duration", type: "select", options: ["1 Day Trip", "3-Day Exploration", "5-Day Comprehensive", "7-Day Full Package"] },
      { label: "Interests & Budget", key: "content", type: "textarea", placeholder: "e.g., Historical shrines, budget ramen, minimal rapid walking..." }
    ]
  },
  {
    id: "fn-keywords",
    name: "SEO Metadata & Tag Analyst",
    description: "Extract high-density search keywords, write custom meta-tags, and draft descriptions.",
    category: "advanced",
    icon: Zap,
    systemPrompt: "You are an SEO Strategist. Analyze the input text. Provide: 1. Top 10 Primary keywords ranked by relevance. 2. A 160-character Meta Description that maximizes click-through rate. 3. Primary keywords group mappings.",
    placeholderText: "Paste landing page body or blog text...",
    inputs: [
      { label: "Source URL or Article Content", key: "content", type: "textarea" }
    ]
  },
  {
    id: "fn-json",
    name: "Structured JSON Reformatter",
    description: "Clean up malformed JSON objects, resolve indentation, and generate clean types declarations.",
    category: "code",
    icon: Braces,
    systemPrompt: "You are a senior data engineer. Parse and clean raw JSON objects. Fix any misplaced brackets or commas, correctly re-indent data structure, and output the clean TypeScript/JSON interface mapping definitions underneath.",
    placeholderText: "Paste loose or messy JSON records to clean...",
    inputs: [
      { label: "Unformatted String", key: "content", type: "textarea", placeholder: "{ 'name': 'John', age: 30, orders: [1,2, ] }" }
    ]
  },
  {
    id: "fn-ragcompanion",
    name: "RAG Vector Companion",
    description: "Retrieve vector intelligence and extract context files from your local database.",
    category: "advanced",
    icon: Database,
    systemPrompt: "You are an AI RAG Assistant with active access to local vector indices. Retrieve semantic fragments from files and conversations, formulate highly grounded responses with citations, and state which files were consulted.",
    placeholderText: "Query your RAG content or analyze file integrations...",
    inputs: [
      { label: "Consultation Goal", key: "goal", type: "select", options: ["Compare across documents", "Retrieve specific numeric citations", "Draft review summaries"] },
      { label: "Specific Question", key: "content", type: "textarea", placeholder: "What has John mentioned in our meeting notes files regarding product metrics?" }
    ]
  }
];

export function SubFunctionsPanel({ onExecuteFunction, language }: SubFunctionsPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "writing" | "code" | "productivity" | "lifestyle" | "advanced">("all");
  const [selectedFnId, setSelectedFnId] = useState<string | null>(null);

  // Form values state map
  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const handleInputChange = (fnId: string, key: string, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [`${fnId}-${key}`]: value
    }));
  };

  const getInputValue = (fnId: string, key: string, defaultValue = "") => {
    return formValues[`${fnId}-${key}`] || defaultValue;
  };

  const handleRun = (fn: AiFunction) => {
    let combinedPrompt = `## ${fn.name} Action Task\n`;
    
    // Aggregate all defined inputs
    fn.inputs.forEach((input) => {
      const val = getInputValue(fn.id, input.key) || input.placeholder || "";
      combinedPrompt += `* **${input.label}**: ${val}\n`;
    });

    const coreContent = getInputValue(fn.id, "content", "");
    combinedPrompt += `\n### User Sub-Function Request Body:\n${coreContent}\n`;

    onExecuteFunction(fn.systemPrompt, combinedPrompt, fn.name);
  };

  const filteredFunctions = AI_SUB_FUNCTIONS.filter((fn) => {
    const matchesSearch = 
      fn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fn.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || fn.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    { id: "all", label: "All Functions", count: AI_SUB_FUNCTIONS.length },
    { id: "writing", label: "Writing & Prose", count: AI_SUB_FUNCTIONS.filter(f => f.category === "writing").length },
    { id: "code", label: "Code & Structure", count: AI_SUB_FUNCTIONS.filter(f => f.category === "code").length },
    { id: "productivity", label: "Office Productivity", count: AI_SUB_FUNCTIONS.filter(f => f.category === "productivity").length },
    { id: "lifestyle", label: "Study & Life", count: AI_SUB_FUNCTIONS.filter(f => f.category === "lifestyle").length },
    { id: "advanced", label: "Cognitive Intelligence", count: AI_SUB_FUNCTIONS.filter(f => f.category === "advanced").length },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Category Headers */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            AI Sub-Functions Menu
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Deploy over fifteen high-performance micro-utilities configured with surgically tuned system templates.
          </p>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search specialized sub-functions..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
          />
        </div>
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className="flex flex-wrap gap-1.5 pb-2 overflow-x-auto scroller-custom">
        {categoriesList.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id as any);
              setSelectedFnId(null);
            }}
            className={`px-3 py-1.5 text-xs rounded-full cursor-pointer transition-all font-semibold shrink-0 border flex items-center gap-1.5 ${activeCategory === cat.id ? "bg-indigo-650 text-white border-indigo-600 dark:bg-indigo-600" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-850"}`}
          >
            <span>{cat.label}</span>
            <span className={`text-[10px] px-1.5 py-0.25 rounded-md ${activeCategory === cat.id ? "bg-white/20 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-450 dark:text-zinc-500 font-mono"}`}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Grid of Sub-functions cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredFunctions.map((fn) => {
          const Icon = fn.icon;
          const isExpanded = selectedFnId === fn.id;
          return (
            <div
              key={fn.id}
              className={`rounded-xl border bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 overflow-hidden flex flex-col ${isExpanded ? "border-indigo-500 ring-1 ring-indigo-500/30 md:col-span-2 xl:col-span-3 scale-[1.005]" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md cursor-pointer"}`}
              onClick={() => {
                if (!isExpanded) setSelectedFnId(fn.id);
              }}
            >
              {/* Card Header information bar */}
              <div className="p-4 flex items-start gap-3 w-full self-start">
                <div className={`p-2.5 rounded-xl shrink-0 ${isExpanded ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:text-indigo-500 transition-colors"}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-wider text-indigo-500 dark:text-indigo-400">
                      {fn.category}
                    </span>
                    {!isExpanded && (
                      <div className="p-1 rounded-full group-hover:bg-zinc-100 text-zinc-400 group-hover:text-zinc-650 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{fn.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans mt-1">
                    {fn.description}
                  </p>
                </div>
              </div>

              {/* Collapsed view CTA */}
              {!isExpanded && (
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-850/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  <span>Standard execution</span>
                  <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-semibold">
                    Open Task Form <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              )}

              {/* Expanded Action Panel Form */}
              {isExpanded && (
                <div 
                  className="p-5 bg-zinc-50 dark:bg-zinc-950 border-t border-indigo-100 dark:border-zinc-800/80 animate-fadeEnter flex-1 flex flex-col justify-between"
                  onClick={(e) => e.stopPropagation()} // Prevent closing on click content
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/20 px-2.5 py-1 rounded-lg">
                        <Zap className="w-3 h-3 text-indigo-500 shrink-0" />
                        <span>Surgically configured prompt template</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFnId(null)}
                        className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        Collapse Form
                      </button>
                    </div>

                    {/* Generate Form Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fn.inputs.map((input) => {
                        const val = getInputValue(fn.id, input.key);
                        return (
                          <div key={input.key} className={`space-y-1.5 ${input.type === "textarea" ? "md:col-span-2" : ""}`}>
                            <label className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                              {input.label}
                            </label>

                            {input.type === "select" ? (
                              <select
                                value={val}
                                onChange={(e) => handleInputChange(fn.id, input.key, e.target.value)}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50"
                              >
                                {input.options?.map((opt) => (
                                  <option key={opt} value={opt}>
                                    {opt}
                                  </option>
                                ))}
                              </select>
                            ) : input.type === "text" ? (
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleInputChange(fn.id, input.key, e.target.value)}
                                placeholder={input.placeholder || "Enter details..."}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400"
                              />
                            ) : (
                              <textarea
                                value={val}
                                rows={4}
                                onChange={(e) => handleInputChange(fn.id, input.key, e.target.value)}
                                placeholder={input.placeholder || fn.placeholderText}
                                className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 leading-relaxed font-sans min-h-[100px]"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Execution CTA Buttons bar */}
                  <div className="flex items-center justify-end gap-3 mt-5 pt-4 border-t border-zinc-200/50 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => {
                        const newValues = { ...formValues };
                        fn.inputs.forEach((inp) => {
                          delete newValues[`${fn.id}-${inp.key}`];
                        });
                        setFormValues(newValues);
                      }}
                      className="px-3.5 py-1.5 text-xs text-zinc-650 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 font-semibold rounded-lg cursor-pointer"
                    >
                      Clear Inputs
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRun(fn)}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>Execute in AI workspace</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
