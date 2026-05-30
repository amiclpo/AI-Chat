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

const FN_TRANSLATIONS: Record<string, Record<Language, { name: string; description: string }>> = {
  "fn-summarizer": {
    en: { name: "Executive Briefing Summarizer", description: "Condense long articles, reports, or research papers into strategic highlights and bullet points." },
    zh: { name: "高管概要汇报提炼", description: "将长篇文章、报告或研究论文浓缩为战略要点与核心结论。" },
    es: { name: "Resumen Ejecutivo de Negocios", description: "Condensa artículos largos, informes o papeles de investigación en puntos estratégicos clave." },
    ja: { name: "エグゼクティブサマリー要約機", description: "長文記事、報告書、研究論文を戦略的なハイライトや要点に凝縮します。" },
    fr: { name: "Synthèse de Briefing Exécutif", description: "Condensez de longs articles, rapports ou mémoires de recherche en points stratégiques essentiels." }
  },
  "fn-polish": {
    en: { name: "Grammar & Style Polisher", description: "Refine word choice, elevate sentence pacing, and eliminate spelling/grammar flaws." },
    zh: { name: "文案语法与风格润色", description: "精心雕琢字词、优化句子节奏并根除拼写与语法错漏。" },
    es: { name: "Pulidor de Gramática y Estilo", description: "Refina la selección de palabras, mejora el ritmo y elimina imperfecciones gramaticales." },
    ja: { name: "校正・文章スタイル調整", description: "言葉の選択を洗練し、文のテンポを高め、つづりや文法の誤りを一送します。" },
    fr: { name: "Polisseur de Style et Grammaire", description: "Affinez le choix des mots, améliorez le rythme des phrases et éliminez les erreurs." }
  },
  "fn-coder": {
    en: { name: "Smart Code Synthesizer", description: "Generate robust TypeScript, React, SQL, HTML, or CSS code snippets with documentation." },
    zh: { name: "智能代码自动合成", description: "自动生成健壮、类型安全且包含详实注释的 React/TypeScript/SQL 代码库。" },
    es: { name: "Sintetizador de Código Inteligente", description: "Genera fragmentos de código robustos en TypeScript, React, SQL o CSS con documentación." },
    ja: { name: "スマートコード自動生成", description: "注釈付きの堅牢な TypeScript、React、SQL、HTML、CSS のコードコードを生成します。" },
    fr: { name: "Synthétiseur de Code Intelligent", description: "Générez des fragments de code TypeScript, React, SQL, HTML ou CSS robustes et documentés." }
  },
  "fn-translator": {
    en: { name: "Contextual Translator", description: "Bridge communication with idiomatic translations rather than literal word-to-word transfers." },
    zh: { name: "情境化地道翻译官", description: "打破生硬的字面直译桎梏，结合地域文化与行文语气进行润色直译。" },
    es: { name: "Traductor de Contexto Idiomático", description: "Escribe traducciones fluidas y naturales en lugar de realizar una traducción literal." },
    ja: { name: "コンテキスト翻訳機", description: "逐語的な直訳ではなく、文化的・対話のコンテキストに則した表現で翻訳します。" },
    fr: { name: "Traducteur de Contexte", description: "Rapprochez la communication grâce à des expressions naturelles plutôt que des traductions littérales." }
  },
  "fn-socratic": {
    en: { name: "Socratic Method Tutor", description: "Master difficult scientific or humanities principles through structured Socratic tutoring." },
    zh: { name: "苏格拉底智慧导师", description: "不直接给你现成答案，而是通过精准启发连问助你彻底理解复杂学术原理。" },
    es: { name: "Tutor del Método Socrático", description: "Domina principios complejos de ciencias o humanidades mediante preguntas reflexivas." },
    ja: { name: "ソクラテス式知的対話チューター", description: "直接答えを与えず、綿密な対話型質問を通じて深い学術的・人文的理解へと導きます。" },
    fr: { name: "Tuteur de Méthode Socratique", description: "Maîtrisez des concepts complexes de manière rigoureuse grâce à un questionnement guidé." }
  },
  "fn-copywriter": {
    en: { name: "Creative Copywriter", description: "Generate viral social media captions, landing page copy, or email subject lines that convert." },
    zh: { name: "爆款硬核创意文案", description: "打造极具粘性与心理推力的社交媒体文体、落地页标题或引流点击标题。" },
    es: { name: "Redactor Creativo con Conversión", description: "Genera textos de alta interacción para redes, títulos de páginas de destino y ganchos." },
    ja: { name: "バズワード・クリエイティブ文章", description: "思わずクリックしたくなる見出しや、SNSテキスト、LPキャッチコピーを創出します。" },
    fr: { name: "Concepteur Rédacteur Créatif", description: "Générez des accroches virales, des textes de pages de vente ou des objets d'emails percutants." }
  },
  "fn-email": {
    en: { name: "Executive Email Composer", description: "Draft professional out-of-office plans, business proposals, sales pitches, or polite replies." },
    zh: { name: "商务行政邮件拟定", description: "编撰得体、凝练、直击业务痛点的专业公文信函及回复邮件。" },
    es: { name: "Redactor de Correos Ejecutivos", description: "Redacta correos de negocios pulidos, propuestas comerciales o actualizaciones de estado." },
    ja: { name: "ビジネス事務メール作成", description: "洗練され、要点が極めて明確に伝わるビジネス公用電子メールを起草します。" },
    fr: { name: "Compositeur d'Emails Professionnels", description: "Rédigez des propositions commerciales, newsletters ou réponses courtoises à forte valeur ajoutée." }
  },
  "fn-meetings": {
    en: { name: "Meeting Minute Processor", description: "Convert chaotic raw speaker transcripts into clean briefs, action matrices, and milestones." },
    zh: { name: "混乱会议纪要精细归纳", description: "将会议发言速记日志快速收纳为做成清晰的决议流水、跟进排期与里程碑。" },
    es: { name: "Procesador de Minutas de Reunión", description: "Convierte transcripciones confusas en planes de acción, fechas de entrega y dueños de tareas." },
    ja: { name: "会議議事録・タスク自動編成", description: "雑多な発言記録や音声を、タスク一覧、担当者マトリクス、決定事項へと集約します。" },
    fr: { name: "Rédacteur de Compte-Rendu", description: "Transformez les notes de réunions brutes en synthèses claires, tableaux de tâches et jalons." }
  },
  "fn-recipe": {
    en: { name: "Dietary Ingredient Chef", description: "Design healthy, balanced culinary recipes using whatever remains in your kitchen cupboard." },
    zh: { name: "冰箱剩菜健康大厨", description: "根据您冰箱现存的边角食材与调料，量身构思合理的创意菜品与卡路里折算。" },
    es: { name: "Chef Creativo de Despensa", description: "Diseña recetas saludables y balanceadas usando lo que te quede disponible en la despensa." },
    ja: { name: "冷蔵庫の残り物シェフ", description: "おうちにある残り物食材を使って、美味しく健康的なプロのレシピを考案します。" },
    fr: { name: "Chef Anti-Gaspillage", description: "Créez des recettes équilibrées et saines à partir des restes de votre cuisine." }
  },
  "fn-flashcard": {
    en: { name: "Study Flashcard Architect", description: "Synthesize study terminology, math formulas, or tech glossary terms into crisp exam cards." },
    zh: { name: "备考记忆卡片架构师", description: "将厚重晦涩的学术笔记提炼为正反面特征鲜明的备考自测闪卡进行冲刺记忆。" },
    es: { name: "Arquitecto de Fichas de Memoria", description: "Sintetiza términos y fórmulas densos en juegos interactivos de autoevaluación rápida." },
    ja: { name: "試験対策フラッシュカード設計", description: "覚えづらい専門用語や数学・科学の公式を、効率の良い暗記用カードに書き起こします。" },
    fr: { name: "Créateur de Fiches Flash", description: "Transformez vos cours ou formules techniques en fiches mémo interactives adaptées." }
  },
  "fn-sentiment": {
    en: { name: "Mood & Sentiment Tracker", description: "Deconstruct personal journals or customer feedback to isolate core emotional states and trends." },
    zh: { name: "情感波动与情绪审计", description: "深度扫描私人日记、会客交谈或客户投诉，量化情绪走势并给出关怀建议。" },
    es: { name: "Analizador de Sentimiento y Ánimo", description: "Detecta sesgos emocionales en transcripciones, diarios o comentarios de servicios." },
    ja: { name: "感情トーン・センチメント分析", description: "日常の日誌や顧客レビューから内包する精神的トーンや感情比率を可視化します。" },
    fr: { name: "Analyseur de Sentiments", description: "Analysez de longs retours clients ou des journaux intimes pour extraire les émotions dominantes." }
  },
  "fn-interview": {
    en: { name: "Virtual Interview Simulator", description: "Rehearse responses to high-stakes interview questions with professional contextual critiques." },
    zh: { name: "AI 仿真模拟面试考官", description: "根据您心仪的职级和企业，发起一对一追问演练，并获得多维度专业点评。" },
    es: { name: "Simulador Virtual de Entrevistas", description: "Ensaya respuestas de negocios para roles críticos con retroalimentación profesional instantánea." },
    ja: { name: "バーチャル模擬面接官", description: "目指すポジションや企業に完全に合わせた1対1の質問追及と採点評価を行います。" },
    fr: { name: "Simulateur d'Entretien d'Embauche", description: "Entraînez-vous à répondre à des questions difficiles avec des critiques constructives en temps réel." }
  },
  "fn-itinerary": {
    en: { name: "Adaptive Travel Concierge", description: "Generate highly optimized hourly travel schedules with local highlights, transport, and reviews." },
    zh: { name: "个性化定制旅行游记", description: "定制科学的时段出行攻略、包含交通工具转换、特色名小吃推荐及时间缓冲区。" },
    es: { name: "Conserje de Viajes Adaptativo", description: "Diseña itinerarios diarios completos optimizando el tiempo, transporte y recomendaciones." },
    ja: { name: "トラベル計画・ガイドコンシェルジュ", description: "交通機関や美味しい食べ物の穴場など、時間単位で最適化された旅行スケジュールを自動編成します。" },
    fr: { name: "Concierge de Voyage Adaptatif", description: "Générez des plannings journaliers de voyage optimisés avec des escales gastronomiques." }
  },
  "fn-keywords": {
    en: { name: "SEO Metadata & Tag Analyst", description: "Extract high-density search keywords, write custom meta-tags, and draft descriptions." },
    zh: { name: "SEO 元数据与高浓标签分析", description: "解析内容段落，挖掘最贴切的用户检索关键词，并提供能够吸引点击的标题设计。" },
    es: { name: "Analista de Etiquetas SEO", description: "Extrae palabras clave primarias y redacta descripciones con alta tasa de clicks." },
    ja: { name: "SEOメタデータ・タグ分析機", description: "コラムやサイトから自動でキーワードを選択し、クリック率を最大化する見出しを作ります。" },
    fr: { name: "Analyseur de Balises et Mots-clés SEO", description: "Extrayez des mots-clés haute densité et formulez des méta-descriptions optimisées." }
  },
  "fn-json": {
    en: { name: "Structured JSON Reformatter", description: "Clean up malformed JSON objects, resolve indentation, and generate clean types declarations." },
    zh: { name: "JSON 数据流清洗与规整", description: "一键修缮多余逗号、剔除报错括号、纠正错乱缩进并生成标准 TS 定义。" },
    es: { name: "Reformateador de JSON Estructurado", description: "Corrige comas rotas, brackets corruptos y genera tipos directos en TypeScript." },
    ja: { name: "JSON構文バグ修正・フォーマッタ", description: "余計なカンマや欠損した括弧を自動修復し、美しいインデントで整形式定義を出力します。" },
    fr: { name: "Réformateur de Fichiers JSON", description: "Corrigez les virgules superflues, indentez vos structures de données et générez des interfaces TypeScript." }
  },
  "fn-ragcompanion": {
    en: { name: "RAG Vector Companion", description: "Retrieve vector intelligence and extract context files from your local database." },
    zh: { name: "RAG 本地知识检索罗盘", description: "穿透离线数据层，精准调度、关联对比您的私人本地文档并生成附带引用的答复。" },
    es: { name: "Compañero RAG de Inteligencia Local", description: "Consulta las bases de conocimientos de tus archivos corporativos adjuntando citas explícitas." },
    ja: { name: "オフラインRAG知識検索コンパス", description: "読み込んだドキュメントやファイル群から横断検索し、参照元を明示した高信頼性の回答を得ます。" },
    fr: { name: "Compagnon d'Indexation RAG", description: "Interrogez l'index de connaissances local pour croiser vos documents d'entreprise avec citation de sources." }
  }
};

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
    const meta = FN_TRANSLATIONS[fn.id]?.[language] || { name: fn.name, description: fn.description };
    let combinedPrompt = `## ${meta.name} Action Task\n`;
    
    // Aggregate all defined inputs
    fn.inputs.forEach((input) => {
      const val = getInputValue(fn.id, input.key) || input.placeholder || "";
      combinedPrompt += `* **${input.label}**: ${val}\n`;
    });

    const coreContent = getInputValue(fn.id, "content", "");
    combinedPrompt += `\n### User Sub-Function Request Body:\n${coreContent}\n`;

    onExecuteFunction(fn.systemPrompt, combinedPrompt, meta.name);
  };

  const filteredFunctions = AI_SUB_FUNCTIONS.filter((fn) => {
    const meta = FN_TRANSLATIONS[fn.id]?.[language] || { name: fn.name, description: fn.description };
    const matchesSearch = 
      meta.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meta.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = activeCategory === "all" || fn.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categoriesList = [
    { id: "all", label: getTranslation(language, "SUB_FUNCTIONS_CAT_ALL"), count: AI_SUB_FUNCTIONS.length },
    { id: "writing", label: getTranslation(language, "SUB_FUNCTIONS_CAT_WRITING"), count: AI_SUB_FUNCTIONS.filter(f => f.category === "writing").length },
    { id: "code", label: getTranslation(language, "SUB_FUNCTIONS_CAT_CODE"), count: AI_SUB_FUNCTIONS.filter(f => f.category === "code").length },
    { id: "productivity", label: getTranslation(language, "SUB_FUNCTIONS_CAT_PRODUCTIVITY"), count: AI_SUB_FUNCTIONS.filter(f => f.category === "productivity").length },
    { id: "lifestyle", label: getTranslation(language, "SUB_FUNCTIONS_CAT_STUDY"), count: AI_SUB_FUNCTIONS.filter(f => f.category === "lifestyle").length },
    { id: "advanced", label: getTranslation(language, "SUB_FUNCTIONS_CAT_COGNITIVE"), count: AI_SUB_FUNCTIONS.filter(f => f.category === "advanced").length },
  ];

  return (
    <div className="space-y-6">
      {/* Search and Category Headers */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500 animate-pulse" />
            {getTranslation(language, "SUB_FUNCTIONS_TITLE")}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {getTranslation(language, "SUB_FUNCTIONS_SUBTITLE")}
          </p>
        </div>

        {/* Live Search bar */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={getTranslation(language, "SUB_FUNCTIONS_SEARCH_PLACEHOLDER")}
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
          const meta = FN_TRANSLATIONS[fn.id]?.[language] || { name: fn.name, description: fn.description };

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
                      {fn.category === "writing" ? getTranslation(language, "SUB_FUNCTIONS_CAT_WRITING")
                       : fn.category === "code" ? getTranslation(language, "SUB_FUNCTIONS_CAT_CODE")
                       : fn.category === "productivity" ? getTranslation(language, "SUB_FUNCTIONS_CAT_PRODUCTIVITY")
                       : fn.category === "lifestyle" ? getTranslation(language, "SUB_FUNCTIONS_CAT_STUDY")
                       : fn.category === "advanced" ? getTranslation(language, "SUB_FUNCTIONS_CAT_COGNITIVE")
                       : fn.category}
                    </span>
                    {!isExpanded && (
                      <div className="p-1 rounded-full group-hover:bg-zinc-100 text-zinc-400 group-hover:text-zinc-650 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{meta.name}</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans mt-1">
                    {meta.description}
                  </p>
                </div>
              </div>

              {/* Collapsed view CTA */}
              {!isExpanded && (
                <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-850/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  <span>{getTranslation(language, "SUB_FUNCTIONS_STANDARD_EXECUTION")}</span>
                  <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 font-semibold">
                    {getTranslation(language, "SUB_FUNCTIONS_OPEN_FORM")} <ChevronRight className="w-3.5 h-3.5" />
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
                        <span>{getTranslation(language, "SUB_FUNCTIONS_PROMPT_TEMPLATE")}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFnId(null)}
                        className="text-xs font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 px-2 py-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      >
                        {getTranslation(language, "SUB_FUNCTIONS_COLLAPSE_FORM")}
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
                      {getTranslation(language, "SUB_FUNCTIONS_CLEAR_INPUTS")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRun(fn)}
                      className="px-4 py-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl cursor-pointer shadow flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform"
                    >
                      <Send className="w-3.5 h-3.5 shrink-0" />
                      <span>{getTranslation(language, "SUB_FUNCTIONS_EXECUTE")}</span>
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
