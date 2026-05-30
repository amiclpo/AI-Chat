/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Settings, 
  Database, 
  Plus, 
  Trash2, 
  CloudLightning, 
  Download, 
  Upload, 
  Sliders, 
  Sparkles, 
  RefreshCw, 
  Key, 
  Check, 
  AlertCircle,
  Copy,
  Globe,
  ChevronLeft,
  BookOpen,
  FileText,
  Code,
  Cpu
} from "lucide-react";
import { SystemPrompt, ChatSession, ConsumptionRecord, VectorRecord } from "../types";
import { REF_MODELS, BUILT_IN_PROMPTS } from "../lib/data";
import { Language, LANGUAGES, getTranslation } from "../lib/translations";
import { localVectorDb } from "../lib/vectorDb";
import { generateUUID } from "../lib/uuid";

interface LangDocPreset {
  id: string;
  name: string;
  category: string;
  summary: string;
  bestPractices: string[];
  systemPrompt: string;
  textsToEmbed: string[];
}

const LANG_DOC_PRESETS: LangDocPreset[] = [
  {
    id: "ts-clean",
    name: "TypeScript (Clean Coding & ESM)",
    category: "Web & Frontend",
    summary: "Standard code architectures, strict static checking, properly formulated ES Modules (ESM) imports, and optimal build setups.",
    bestPractices: [
      "No usage of loose `any` types; prefer strict interfaces and type unions.",
      "Strict compilations enabled like `strictNullChecks` or `noImplicitAny`.",
      "Strict compliance with modular ES Modules (`import`/`export`) standard structure.",
      "Proper async-await structures with unified error trapping mechanics."
    ],
    systemPrompt: "You are a senior TypeScript Architect. All response structures must conform precisely with strict type definitions, never use loose 'any' assertions, utilize elegant ES Modules (ESM), ensure clean separation of concerns, and include descriptive return annotations matching clean-code architectural rules.",
    textsToEmbed: [
      "TypeScript Clean Coding: Never declare loose or dynamic 'any' variables; enforce explicit structural interfaces or strict template generics instead. This maintains type integrity and unlocks static audit compiler verification.",
      "ES Modules Syntax & Ingress: Always use explicit nested path imports. Avoid namespace wrapping classes in standard projects; utilize clean import/export syntax conforming directly to ECMAScript standard specs.",
      "Async/Await Secure Patterns: Wrap multi-step promises inside try-catch structures. Never invoke asynchronous routines in an unhandled fire-and-forget style without designated fallback listeners."
    ]
  },
  {
    id: "python-pep8",
    name: "Python (PEP 8 & Type Hints)",
    category: "Data & Systems",
    summary: "PEP-8 formatting constraints, rigorous type assertions (`typing`), standard error handling, and clean script packaging.",
    bestPractices: [
      "Adhere strictly to PEP-8 casing guidelines (snake_case for functions, CapitalCase for classes).",
      "Explicitly annotate parameters and return types using the typing standard library.",
      "Prevent side-effects in list comprehensions; prefer simple, legible operations.",
      "Leverage yield generators to maintain memory efficiency when processing stream data structures."
    ],
    systemPrompt: "You are an expert Python Developer. Write idiomatic, highly readable Python code referencing PEP-8 style rules, comprehensive type annotations, clear docstrings, and robust exception handling using specific try-except hierarchies.",
    textsToEmbed: [
      "PEP 8 Styling: Code layout must use 4 spaces per indentation level. Restrict line lengths to 79 characters for supreme readability inside vertical split screens. Keep custom helper classes clean.",
      "Python Modern Typing: Explicitly declare function signatures with standard parameters (`def compute(items: list[str]) -> dict[str, int]`). Use static variables matching PEP-484 standard specifications.",
      "Effective Python Comprehensions: Use comprehensions strictly for simple mapping transformations. When performing complex recursive iterations, prefer clear multi-line statement blocks to maximize readability."
    ]
  },
  {
    id: "go-idiomatic",
    name: "Go (Idiomatic Concurrency)",
    category: "Backend & Systems",
    summary: "Small single-purpose packages, context propagation, synchronous telemetry, explicit error returning tuple models, and structured channel designs.",
    bestPractices: [
      "Return explicit error interfaces as the last value of return signatures.",
      "Propagate deadlines and cancellation states comprehensively with context.Context.",
      "Coordinate concurrent goroutines safely utilizing select blocks and channels.",
      "Prevent package-level globals to ensure isolation during continuous testing."
    ],
    systemPrompt: "You are a professional Go Developer. Code must be structured idiomatically, always handle returned error interfaces immediately ('if err != nil'), propagate 'context.Context' to downstream routines, and organize goroutines using thread-safe channel orchestration.",
    textsToEmbed: [
      "Idiomatic Go Structures: Keep functions thin and modular. Always handle the error return value right away. Never obscure error bubbles or leave them empty to ensure early crash-safe responses.",
      "Go Concurrency and Channels: Do not trigger goroutines if their exit parameters remain undefined. Prevent memory lockouts by utilizing timeout checks inside channel select routines.",
      "Context Guidelines: Pass context.Context as the first argument in all network or database-facing API interfaces. Use cancels to release dangling files or system file descriptors."
    ]
  },
  {
    id: "rust-safe",
    name: "Rust (Memory Safety)",
    category: "Systems Programming",
    summary: "Satisfying borrow constraints, Option/Result matches, cargo package architectures, memory-clean paradigms, and unsafe avoidance.",
    bestPractices: [
      "Satisfy borrow restrictions without resorting to unneeded deep copies or cloned structures.",
      "Employ robust pattern matching over Option/Result types; never call unsafe unwrap().",
      "Confine raw interface references to thoroughly audited system wrapper libraries.",
      "Manage project features using clean configurations inside and throughout Cargo.toml."
    ],
    systemPrompt: "You are an expert Rust Systems Engineer. All code must compile safely without unnecessary cloning of heap resources, handle errors comprehensively utilizing Result and Option enum structures, and strictly forbid 'unsafe' code declarations.",
    textsToEmbed: [
      "Rust Safe References: Maximize structural lifetimes over dynamic clones. Prefer referencing structures (&T) instead of copying data onto memory heaps to preserve peak processing bounds.",
      "Rust Error Traps: Replace raw matches of '.unwrap()' with '.expect()' or delegate error propagation bubbles to call blocks utilizing '?' operator chains.",
      "Safe vs Unsafe: Avoid utilizing unsafe code declarations unless wrapping external low-level system binaries. Lean thoroughly onto compiler verification structures to execute tasks safely."
    ]
  },
  {
    id: "cpp-modern",
    name: "Modern C++ (Core RAII)",
    category: "Low-level & Performance",
    summary: "Strict RAII design, smart pointers usage (unique/shared), move constructors integration, and compile-time Concepts.",
    bestPractices: [
      "Explicitly enforce RAII memory management; never execute bare raw new/delete memory structures.",
      "Shield block items inside robust std::unique_ptr or std::shared_ptr wrappers.",
      "Enforce zero-copy transfer semantics utilizing modern rvalue move constructors.",
      "Inject check-constraints at compile time applying generic programming concepts."
    ],
    systemPrompt: "You are a senior C++ Systems Developer. Implement modern C++ practices emphasizing strict RAII, memory security through dynamic smart pointer allocations, move semantic optimizations, and concept-based parameter guidelines.",
    textsToEmbed: [
      "Modern C++ RAII Guidelines: Enforce complete object lifecycle management. Bind raw resource acquisition directly to object setup and release them in class destructors to ensure zero leakage.",
      "C++ Smart Memory: Always instantiate heap objects via 'std::make_unique<T>()' or 'std::make_shared<T>()' functions. Avoid using circular references and break links via 'std::weak_ptr<T>'.",
      "Move Semantics Strategy: Design class systems with proper double-ampersand rvalue parameters. Allow values to slide efficiently across stack frames without duplicating raw allocated bytes in dynamic lists."
    ]
  }
];

function getLocalizedPreset(preset: LangDocPreset, lang: Language): LangDocPreset {
  if (lang === "zh") {
    switch (preset.id) {
      case "ts-clean":
        return {
          ...preset,
          name: "TypeScript (整洁代码与 ESM)",
          category: "前端与网页开发",
          summary: "标准代码架构、严格静态类型检查、格式正确的 ES 模块 (ESM) 导入规范，以及最佳构建体系配置。",
          bestPractices: [
            "绝不声明、不使用任何宽松的 `any` 变量；优先定义严格的 Interface 接口或联合类型 (Unions)；",
            "在项目中开启严格编译检查，例如启用 `strictNullChecks` 或 `noImplicitAny`等配置；",
            "严格遵循模块化的 ES Modules (`import`/`export`) 标准进行工程文件设计；",
            "使用标准的 Async/Await 异步等待逻辑结构，并配合统一的异常拦截机制。"
          ]
        };
      case "python-pep8":
        return {
          ...preset,
          name: "Python (PEP 8 规范与类型提示)",
          category: "数据科学与系统后端",
          summary: "PEP-8 格式编排约束、极其严格的函数参数类型提示 (typing 标准库)、精细的报错捕捉与干净的依赖声明包管理。",
          bestPractices: [
            "严格遵守 PEP-8 命名与拼写规范 (函数使用 snake_case 下划线，类名使用 CapitalCase)；",
            "在所有函数边界显式声明参数和返回值类型 (例如：`-> dict[str, int]`)；",
            "避免在列表推导式中编写包含副作用的语句，保持操作简单直接及高可读性；",
            "在大体积数据流进行流式迭代处理时，合理采用 yield 生成器以降低内存空间开销。"
          ]
        };
      case "go-idiomatic":
        return {
          ...preset,
          name: "Go (标准并发与管道流)",
          category: "高并发后端与云原生",
          summary: "极简单一职责包划分、Context 取消与死期扩散规则、显式返回错误 (err) 的双返回值元组及信道协作。",
          bestPractices: [
            "始终遵循将显式 error 接口置于底层函数签名返回值的最后一项位置来传递；",
            "将具有超时属性的 `context.Context` 扩散穿透至后续调用的所有微服务或背景工作携程中；",
            "使用 select 选择项逻辑搭配通道携手调度并发，规避死锁并保证消息的单向安全收发行为；",
            "禁止声明全局可见的程序共享变量，避免并发写冲突并且确保单元测试具有高隔离性。"
          ]
        };
      case "rust-safe":
        return {
          ...preset,
          name: "Rust (内存所有权与生命周期控制)",
          category: "安全系统级开发",
          summary: "完美驾驭 Rust 借用检查器、灵活使用 Option/Result 枚举、模块化的 Cargo 配套架构、无 GC 内存安全范式。",
          bestPractices: [
            "完全满足 Rust 所有权借用限制约束，避免无谓和大量的深克隆 or 不必要的内存复制；",
            "利用模式匹配优雅处理 Option/Result 枚举，绝不正向硬编码执行 unsafe 级的 `.unwrap()`；",
            "将低层直接指涉或不安全的代码，限制在高度隔离、通过安全性审计的标准包装类库中；",
            "在 Cargo.toml 依赖定义中完美划分和解耦不同功能的开关特性参数 (Features)。"
          ]
        };
      case "cpp-modern":
        return {
          ...preset,
          name: "Modern C++ (核心 RAII 机制)",
          category: "底层计算与高性能",
          summary: "安全系统代码规范。严格的 RAII 资源所有权设计，智能指针全面替代裸指针，右值引用移动语义避免任何不必要的深度内存拷贝。",
          bestPractices: [
            "显式强制实施 RAII 资源生命周期绑定设计，避免在业务代码中使用裸 new/delete 操作；",
            "使用 `std::unique_ptr` 或 `std::shared_ptr` 安全封装所有动态分配的堆区对象资源；",
            "应用右值引用及移动语义机制实现托管内存的零拷贝快速装转与堆段字节搬卸；",
            "在模板编程中使用 C++20 Concepts 特性在编译期进行类型约束与前置守卫断言检测。"
          ]
        };
    }
  }

  if (lang === "es") {
    switch (preset.id) {
      case "ts-clean":
        return {
          ...preset,
          name: "TypeScript (Código Limpio y ESM)",
          category: "Desarrollo Web & Frontend",
          summary: "Arquitecturas de código estándar, verificación estática rigurosa, formatación correcta de importaciones ES Modules (ESM) y configuraciones óptimas de compilación.",
          bestPractices: [
            "No use tipos laxos `any`; prefiera interfaces estrictas y uniones de tipos.",
            "Habilite compilaciones estrictas como `strictNullChecks` o `noImplicitAny`.",
            "Cumpla de manera estricta con la estructura estándar de ES Modules (`import`/`export`).",
            "Estructuración adecuada de async/await con un sistema unificado de captura de errores."
          ]
        };
      case "python-pep8":
        return {
          ...preset,
          name: "Python (PEP 8 & Pistas de Tipo)",
          category: "Datos & Sistemas",
          summary: "Restricciones de formato PEP-8, anotaciones de tipo rigurosa (`typing`), manejo estandarizado de excepciones y empaquetado de secuencias de comandos limpio.",
          bestPractices: [
            "Adhiérase a las pautas de nomenclatura PEP-8 (snake_case para funciones, CapitalCase para clases).",
            "Anote los parámetros y valores de retorno con la librería estándar de tipado (`typing`).",
            "Evite efectos secundarios en comprensiones de listas; prefiera operaciones legibles.",
            "Use generadores (yield) para mantener la eficiencia de memoria en el procesamiento de flujos de datos."
          ]
        };
      case "go-idiomatic":
        return {
          ...preset,
          name: "Go (Concurrencia Idiomática)",
          category: "Backend & Sistemas",
          summary: "Paquetes pequeños de un solo propósito, propagación de contexto, telemetría síncrona, retorno de tuplas de error explícitas y canales estructurados.",
          bestPractices: [
            "Devuelva interfaces de error explícitas como la última variable en las firmas de funciones.",
            "Propague límites de tiempo y estados de cancelación de manera exhaustiva con context.Context.",
            "Coordine goroutines de forma segura utilizando bloques select y canales.",
            "Evite variables globales para garantizar aislamiento durante las fases de pruebas unitarias."
          ]
        };
      case "rust-safe":
        return {
          ...preset,
          name: "Rust (Seguridad de Memoria)",
          category: "Programación de Sistemas",
          summary: "Satisfacción de restricciones del borrow checker, gestión de Option/Result de forma correcta y prevención de bloques unsafe.",
          bestPractices: [
            "Evite copias profundas redundantes o el uso excesivo de variables duplicadas.",
            "Prefiera realizar búsquedas mediante pattern matching sobre enums Option/Result; jamás escriba .unwrap() sin control.",
            "Limite las referencias en bruto a módulos estancos que contengan lógica auditada.",
            "Administre el estado de compilaciones opcionales cómodamente en el archivo Cargo.toml."
          ]
        };
      case "cpp-modern":
        return {
          ...preset,
          name: "Modern C++ (Core RAII)",
          category: "Bajo Nivel & Rendimiento",
          summary: "Gestión de memoria estricta con filosofía RAII, uso inteligente de punteros std::unique_ptr/std::shared_ptr y semántica de movimiento.",
          bestPractices: [
            "Enforce la gestión de recursos de adquisición RAII; prohíba el empleo directo de operaciones new/delete.",
            "Asegure la asignación de variables en punteros std::unique_ptr o std::shared_ptr según sea pertinente.",
            "Optimice las operaciones de copia en memoria utilizando constructores de movimiento (move).",
            "Introduzca restricciones y validaciones sólidas en tiempo de compilación utilizando Concepts de plantillas."
          ]
        };
    }
  }

  if (lang === "ja") {
    switch (preset.id) {
      case "ts-clean":
        return {
          ...preset,
          name: "TypeScript (クリーンコード & ESM)",
          category: "ウェブ & フロントエンド",
          summary: "一般的なコードアーキテクチャ、厳格な静的検証、正しく構成されたESモジュール（ESM）読み込み、および理想的なビルド設定。",
          bestPractices: [
            "曖昧な`any`型の使用を完全に排除し、厳格なインターフェースや共用体（Unions）を採用します。",
            "`strictNullChecks` や `noImplicitAny` などの厳格コンパイル規定を有効化します。",
            "モジュール式ES Modules（`import`/`export`）の標準仕様に正確に準拠します。",
            "適切なasync-await記述と例外捕捉のための標準的なTry-Catch階層を構築します。"
          ]
        };
      case "python-pep8":
        return {
          ...preset,
          name: "Python (PEP 8 & 型ヒント)",
          category: "データ & バックエンド",
          summary: "PEP-8におけるレイアウト等制約事項、厳格な型アノテーション規程（`typing`）、共通例外パターン、およびクリーンな環境管理。",
          bestPractices: [
            "PEP-8の命名規則（関数名には snake_case、クラス名には CapitalCase）に正確に従います。",
            "`typing`ライブラリ等を用い、引数および関数の戻り値に対して明示的な型表示を強制します。",
            "リスト内包表記内部で副作用（状態変更）を発生させる行為を禁止し、可読性を高めます。",
            "大規模なストリームデータを扱う処理では yield ジェネレータを採用し、ピーク時メモリを抑制します。"
          ]
        };
      case "go-idiomatic":
        return {
          ...preset,
          name: "Go (慣用的並行処理)",
          category: "バックエンド & インフラ",
          summary: "疎結合で機能特化したパッケージ境界、Contextオブジェクト転送規則、明示的なerror返しタプル構成、およびチャネル協調。",
          bestPractices: [
            "常に関数実行時の最後の戻り値パラメータとして明示的にerrorインタフェースを定義し、即座に評価します。",
            "`context.Context`をダウンストリーム全タスクに正しく引き回し、ネットワーク等タイムアウトや中断を全スレッド波及します。",
            "select分岐、チャネル同期などを組み合わせ、Goroutineリソースのリークやデッドロックを防止します。",
            "並列衝突発生やテスト影響をなくすため、グローバル領域における変更可能変数の宣言を完全排除します。"
          ]
        };
      case "rust-safe":
        return {
          ...preset,
          name: "Rust (メモリ安全性検証)",
          category: "システムプログラミング",
          summary: "Rustコンパイラ借用チェッカー仕様適合、確実なOption/Resultパターンチェック、Cargo等依存仕様最適化、unsafe不要哲学。",
          bestPractices: [
            "冗長なメモリコピーや余分な `.clone()` を排し、不変または可変参照ルール（&T/&mut T）に素直に適合させます。",
            "OptionやResult型に対して丁寧なマッチ判定等の例外処置を行い、不確定状況下での `.unwrap()` 呼び出しは避けます。",
            "必要な生のAPI等外部呼び出し等は、完全に安全性が立証されたコンポーネントまたは静的ハンドラでラップします。",
            "Cargo.toml を用いて有効無効といった制御やモジュールの肥大化を防ぎ、最適な分割を構築します。"
          ]
        };
      case "cpp-modern":
        return {
          ...preset,
          name: "Modern C++ (コア RAII 設計)",
          category: "低レイヤ性能 & 計算処理",
          summary: "徹底された資源管理（RAII概念）、生ポインタ全廃によるスマートポインタ一元化、高速化のための移動（Move）コンストラクタ適用、Concepts活用。",
          bestPractices: [
            "メモリやファイルの安全性を保証するRAIIライフサイクルを導入し、裸のnew/delete命令は書かないようにします。",
            "ローカルで完結する資源は `std::unique_ptr` 等を活用し、役割境界を完全に定義します。",
            "大容量配列或いは構造体等のオブジェクト移送、返却のために、右値参照を用いたMoveセマンティクス最適化を採用します。",
            "テンプレートに対してC++20 Conceptsなどコンパイル時制限をかけ、意図しない定義エラーを検知します。"
          ]
        };
    }
  }

  if (lang === "fr") {
    switch (preset.id) {
      case "ts-clean":
        return {
          ...preset,
          name: "TypeScript (Clean Coding & ESM)",
          category: "Web & Frontend",
          summary: "Architectures de code standard, vérification statique stricte, modules ES (ESM) correctement formulés et configurations de build optimales.",
          bestPractices: [
            "Pas d'utilisation de types flous `any`; préférez des interfaces strictes et des Unions.",
            "Activez les directives strictes du compilateur style `strictNullChecks` ou `noImplicitAny`.",
            "Respect strict de la structure standard d'import/export d'ES Modules.",
            "Utilisation correcte de structures async-await avec capture d'erreurs centrale."
          ]
        };
      case "python-pep8":
        return {
          ...preset,
          name: "Python (PEP 8 & Pistes de Type)",
          category: "Données & Systèmes",
          summary: "Contraintes de formatage PEP-8, annotations de type explicites (`typing`), gestion des exceptions normalisée.",
          bestPractices: [
            "Respect absolu des règles de style de nommage PEP-8 (snake_case pour les fonctions, CapitalCase pour les classes).",
            "Annotez explicitement les signatures de fonctions à l'aide de la bibliothèque standard `typing`.",
            "Évitez les effets secondaires dans les compréhensions de listes pour préserver la lisibilité.",
            "Utilisez les générateurs (yield) pour limiter l'utilisation de la mémoire vive sur les flux."
          ]
        };
      case "go-idiomatic":
        return {
          ...preset,
          name: "Go (Concurrencia Idiomatique)",
          category: "Backend & Systèmes",
          summary: "Packages micro-ciblés, propagation de contextes, retours d'interfaces d'erreur explicites et pipelines de communication.",
          bestPractices: [
            "Renvoyez une variable d'erreur explicite en dernière position de signature de méthode.",
            "Propagez les contextes d'annulation et de délais de manière transparente via context.Context.",
            "Coordonnez les goroutines légères en toute sécurité via des structures select et des canaux.",
            "Interdisez l'utilisation de variables globales pour isoler pleinement les tests unitaires."
          ]
        };
      case "rust-safe":
        return {
          ...preset,
          name: "Rust (Sécurité Mémoire)",
          category: "Programmation Système",
          summary: "Vérification stricte de l'emprunt d'emprunt, gestion propre d'Option/Result et interdiction d'unsafe.",
          bestPractices: [
            "Limitez les copies profondes redondantes en privilégiant le passage par référence (&T).",
            "Interdisez l'utilisation directe de `.unwrap()`; gérez systématiquement les exceptions sur Option/Result.",
            "Isolez la manipulation de pointeurs système dans des modules étanches audités.",
            "Administrez les fonctionnalités conditionnelles via Cargo.toml et les features."
          ]
        };
      case "cpp-modern":
        return {
          ...preset,
          name: "Modern C++ (Core RAII)",
          category: "Bas niveau & Performance",
          summary: "Philosophie de gestion des ressources RAII, conteneurs intelligents std::unique_ptr/std::shared_ptr et optimisation du mouvement.",
          bestPractices: [
            "Garantissez le cycle de vie par RAII; bannissez l'utilisation d'allocations via de simples new/delete.",
            "Déléguez la gestion mémoire à `std::unique_ptr` ou `std::shared_ptr`.",
            "Activez les constructeurs de mouvement rvalue pour s'affranchir des copies d'octets redondantes.",
            "Formulez des contraintes de gabarits lors de la compilation via Concepts."
          ]
        };
    }
  }

  return preset;
}

interface SettingsPanelProps {
  // Model Config State
  temperature: number;
  setTemperature: (val: number) => void;
  topP: number;
  setTopP: (val: number) => void;
  topK: number;
  setTopK: (val: number) => void;
  maxOutputTokens: number;
  setMaxOutputTokens: (val: number) => void;

  // Credential Settings
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

  // RAG config
  ragEnabled: boolean;
  setRagEnabled: (val: boolean) => void;
  ragSourceCount: number;
  setRagSourceCount: (val: number) => void;
  ragSimilarityThreshold: number;
  setRagSimilarityThreshold: (val: number) => void;

  // Custom system prompts
  customPrompts: SystemPrompt[];
  onAddCustomPrompt: (label: string, promptText: string) => void;
  onDeleteCustomPrompt: (id: string) => void;

  // Cloud Sync
  onSyncPush: (syncKey: string) => Promise<{ success: boolean; error?: string }>;
  onSyncPull: (syncKey: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  onFullStateImport: (importedState: any) => void;
  onFullStateExport: () => any;

  // Stats / DB counts
  vectorCount: number;
  onClearVectorDb: () => void;

  // Multi-lingual
  language: Language;
  onLanguageChange: (lang: Language) => void;

  // Back trigger
  onBackToChat?: () => void;

  // MySQL connection and live states integration
  useMysql: boolean;
  setUseMysql: (val: boolean) => void;
  sessions: ChatSession[];
  loadAllDataFromDb: () => Promise<void>;
}

export function SettingsPanel({
  temperature, setTemperature,
  topP, setTopP,
  topK, setTopK,
  maxOutputTokens, setMaxOutputTokens,
  geminiApiKey, setGeminiApiKey,
  openaiApiKey, setOpenaiApiKey,
  openaiBaseUrl, setOpenaiBaseUrl,
  anthropicApiKey, setAnthropicApiKey,
  deepseekApiKey, setDeepseekApiKey,
  ragEnabled, setRagEnabled,
  ragSourceCount, setRagSourceCount,
  ragSimilarityThreshold, setRagSimilarityThreshold,
  customPrompts, onAddCustomPrompt, onDeleteCustomPrompt,
  onSyncPush, onSyncPull, onFullStateImport, onFullStateExport,
  vectorCount, onClearVectorDb,
  language, onLanguageChange,
  onBackToChat,
  useMysql, setUseMysql,
  sessions, loadAllDataFromDb
}: SettingsPanelProps) {
  
  // Local interface states
  const [newLabel, setNewLabel] = useState("");
  const [newPromptText, setNewPromptText] = useState("");

  // Developer Documentation Hub & Ingestor local states
  const [activeLangDocId, setActiveLangDocId] = useState("ts-clean");
  const [ingestingDocId, setIngestingDocId] = useState<string | null>(null);
  const [ingestProgress, setIngestProgress] = useState(0);
  const [docStatusMsg, setDocStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [localVectorCount, setLocalVectorCount] = useState<number>(vectorCount);

  // Sync vector count on prop update
  useEffect(() => {
    setLocalVectorCount(vectorCount);
  }, [vectorCount]);

  // -------------------------------------------------------------------------
  // Mainstream Programming Languages Documentation Ingestion & Hub logic
  // -------------------------------------------------------------------------
  const [targetIngestSessionId, setTargetIngestSessionId] = useState<string>("");
  const [customSupplementText, setCustomSupplementText] = useState<string>("");

  useEffect(() => {
    if (sessions && sessions.length > 0 && !targetIngestSessionId) {
      setTargetIngestSessionId(sessions[0].id);
    }
  }, [sessions, targetIngestSessionId]);

  const handleIngestDocPreset = async (preset: LangDocPreset, isCustomOnly = false) => {
    if (!targetIngestSessionId) {
      setDocStatusMsg({
        text: "Please select/create a Target Conversation session to store these RAG documentation vectors.",
        isError: true
      });
      return;
    }

    const chunks = isCustomOnly
      ? customSupplementText.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 10)
      : preset.textsToEmbed;

    if (chunks.length === 0) {
      setDocStatusMsg({
        text: isCustomOnly ? "Please enter some custom content in paragraphs to ingest." : "No structured documentation chunks found.",
        isError: true
      });
      return;
    }

    setIngestingDocId(preset.id);
    setIngestProgress(0);
    setDocStatusMsg(null);

    let successCount = 0;
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (geminiApiKey) headers["x-gemini-key"] = geminiApiKey;
      if (openaiApiKey) headers["x-openai-key"] = openaiApiKey;
      if (openaiBaseUrl) headers["x-openai-base"] = openaiBaseUrl;
      if (anthropicApiKey) headers["x-anthropic-key"] = anthropicApiKey;
      if (deepseekApiKey) headers["x-deepseek-key"] = deepseekApiKey;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        const res = await fetch("/api/embed", {
          method: "POST",
          headers,
          body: JSON.stringify({ texts: [chunk] }),
        });

        const data = await res.json();
        if (data.success && data.embeddings) {
          const vector: number[] = Array.isArray(data.embeddings[0]) ? data.embeddings[0] : data.embeddings;
          
          const vectorRecord: VectorRecord = {
            id: generateUUID(),
            chatId: targetIngestSessionId,
            messageId: generateUUID(),
            text: `Manual Reference [${preset.name}]: ${chunk}`,
            embedding: vector,
            timestamp: new Date().toISOString()
          };

          await localVectorDb.storeVector(vectorRecord);
          successCount++;
        }
        setIngestProgress(i + 1);
      }

      const totalRecordCount = await localVectorDb.getRecordCount();
      setLocalVectorCount(totalRecordCount);
      
      setDocStatusMsg({
        text: `Success! Embedded & indexed ${successCount}/${chunks.length} dense documentation vectors for ${preset.name} into target RAG store.`,
        isError: false
      });
      if (isCustomOnly) {
        setCustomSupplementText("");
      }
    } catch (err: any) {
      console.error(err);
      setDocStatusMsg({
        text: `Ingestion failed during API embeddings construction: ${err.message}`,
        isError: true
      });
    } finally {
      setIngestingDocId(null);
    }
  };

  const handleRegisterPersonaPrompt = (preset: LangDocPreset) => {
    try {
      onAddCustomPrompt(preset.name + " Persona", preset.systemPrompt);
      setDocStatusMsg({
        text: `Successfully registered specialized '${preset.name} Persona' system prompt option! You can now select this persona configuration for any session.`,
        isError: false
      });
    } catch (err: any) {
      setDocStatusMsg({
        text: `Could not register custom persona: ${err.message}`,
        isError: true
      });
    }
  };

  // Code Key Sync State
  const [syncKey, setSyncKey] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // MySQL connection configurator states
  const [mysqlHost, setMysqlHost] = useState("");
  const [mysqlPort, setMysqlPort] = useState(3306);
  const [mysqlUser, setMysqlUser] = useState("");
  const [mysqlPassword, setMysqlPassword] = useState("");
  const [mysqlDatabase, setMysqlDatabase] = useState("ai_chat_assistant");
  const [mysqlUseDb, setMysqlUseDb] = useState(false);
  const [mysqlConnected, setMysqlConnected] = useState(false);
  const [mysqlError, setMysqlError] = useState<string | null>(null);

  const [dbLoadingStatus, setDbLoadingStatus] = useState(false);
  const [dbTesting, setDbTesting] = useState(false);
  const [dbSaving, setDbSaving] = useState(false);
  const [dbInitMsg, setDbInitMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  // Load MySQL Configuration on panel mount
  useEffect(() => {
    fetchDbConfig();
  }, []);

  const fetchDbConfig = async () => {
    setDbLoadingStatus(true);
    try {
      const res = await fetch("/api/db/config");
      const data = await res.json();
      if (data.success && data.config) {
        setMysqlHost(data.config.host || "");
        setMysqlPort(data.config.port || 3306);
        setMysqlUser(data.config.user || "");
        setMysqlPassword(data.config.password || "");
        setMysqlDatabase(data.config.database || "ai_chat_assistant");
        setMysqlUseDb(data.config.useDb || false);
        setMysqlConnected(data.config.connected || false);
        setMysqlError(data.config.connectionError || null);
        
        // Keep React parent system in absolute parity with active relational state
        if (data.config.useDb !== useMysql) {
          setUseMysql(data.config.useDb);
          localStorage.setItem("AIChatLocalRAG_UseMysql", data.config.useDb ? "true" : "false");
        }
      }
    } catch (err) {
      console.error("Error loading db config:", err);
    } finally {
      setDbLoadingStatus(false);
    }
  };

  // Submit test connectivity query with input values directly
  const handleTestConnection = async () => {
    if (!mysqlHost || !mysqlUser) {
      setDbInitMsg({ text: "Please enter host server and user variables to run connectivity test.", isError: true });
      return;
    }
    setDbTesting(true);
    setDbInitMsg(null);
    try {
      const res = await fetch("/api/db/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPassword === "••••••••" ? undefined : mysqlPassword,
          database: mysqlDatabase,
        })
      });
      const data = await res.json();
      if (data.success) {
        setDbInitMsg({ text: data.message || "MySQL Connection established perfectly! Database is online and ready.", isError: false });
        setMysqlConnected(true);
        setMysqlError(null);
      } else {
        setDbInitMsg({ text: data.error || "Connection handshake failed. Verify firewall rules and credentials.", isError: true });
        setMysqlConnected(false);
      }
    } catch (err: any) {
      setDbInitMsg({ text: "Test request failed: " + err.message, isError: true });
      setMysqlConnected(false);
    } finally {
      setDbTesting(false);
    }
  };

  // Record configurations on server side filesystem storage and rebuild pool
  const handleSaveConfig = async (triggerToggleVal?: boolean) => {
    setDbSaving(true);
    setDbInitMsg(null);
    const useDbVal = typeof triggerToggleVal === "boolean" ? triggerToggleVal : mysqlUseDb;
    try {
      const res = await fetch("/api/db/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: mysqlHost,
          port: mysqlPort,
          user: mysqlUser,
          password: mysqlPassword,
          database: mysqlDatabase,
          useDb: useDbVal,
        })
      });
      const data = await res.json();
      if (data.success) {
        setMysqlConnected(data.config.connected);
        setMysqlError(data.config.connectionError);
        setMysqlPassword("••••••••");
        setMysqlUseDb(useDbVal);
        setUseMysql(useDbVal);
        localStorage.setItem("AIChatLocalRAG_UseMysql", useDbVal ? "true" : "false");
        
        setDbInitMsg({ text: "MySQL connection rules written to configuration. Pool updated successfully.", isError: false });

        if (useDbVal) {
          // Immediately pull existing database state if connection is successful
          if (data.config.connected) {
            await loadAllDataFromDb();
          } else {
            setDbInitMsg({ text: "Configurations saved, but databank connection is offline. Database mode is activated but may raise transfer limitations.", isError: true });
          }
        }
      } else {
        setDbInitMsg({ text: data.error || "Could not successfully save connection pool setup.", isError: true });
      }
    } catch (err: any) {
      setDbInitMsg({ text: "Failed storing options: " + err.message, isError: true });
    } finally {
      setDbSaving(false);
    }
  };

  // Execute CREATE TABLE scripts step-by-step
  const handleInitializeTables = async () => {
    setDbSaving(true);
    setDbInitMsg(null);
    try {
      const res = await fetch("/api/db/init", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        setDbInitMsg({ text: "Success! Relational templates (sessions, messages, system_prompts, consumption_records) built inside database.", isError: false });
      } else {
        setDbInitMsg({ text: data.error || "Execution failed. Check your user permissions.", isError: true });
      }
    } catch (err: any) {
      setDbInitMsg({ text: "Init failure: " + err.message, isError: true });
    } finally {
      setDbSaving(false);
    }
  };

  // Sync current client-side state bulk-wise to MySQL relational tables
  const handleSyncToMySql = async () => {
    if (!confirm("Are you sure you want to push all offline browser chats, character setting parameters, and consumption metrics into your MySQL database? This will merge and sync records!")) {
      return;
    }
    setDbSaving(true);
    setDbInitMsg(null);
    try {
      const exportState = onFullStateExport();
      const res = await fetch("/api/db/sync-to-mysql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionsByLocalStorage: exportState.chats || [], // let's pass proper array properties matching server expectation
          sessions: sessions, 
          customPrompts: customPrompts,
          consumptionRecords: JSON.parse(localStorage.getItem("AIChatLocalRAG_ConsumptionRecords") || "[]"),
        })
      });
      const data = await res.json();
      if (data.success) {
        setDbInitMsg({ text: "Excellent! Browser offline data successfully synchronized into relational tables of your MySQL server.", isError: false });
        await loadAllDataFromDb();
      } else {
        setDbInitMsg({ text: data.error || "Failed sending local states to server config.", isError: true });
      }
    } catch (err: any) {
      setDbInitMsg({ text: "Sync operation fail: " + err.message, isError: true });
    } finally {
      setDbSaving(false);
    }
  };

  const handleToggleStorageEngine = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.checked;
    setMysqlUseDb(val);
    handleSaveConfig(val);
  };

  // Initializing syncKey from localStorage
  useEffect(() => {
    const savedKey = localStorage.getItem("AIChatLocalRAG_SyncKey");
    if (savedKey) {
      setSyncKey(savedKey);
    } else {
      // Generate a random high-entropy human sync code
      const randKey = Math.random().toString(36).substring(2, 8).toUpperCase();
      setSyncKey(randKey);
      localStorage.setItem("AIChatLocalRAG_SyncKey", randKey);
    }
  }, []);

  const handleUpdateSyncKey = (val: string) => {
    const clean = val.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    setSyncKey(clean);
    localStorage.setItem("AIChatLocalRAG_SyncKey", clean);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setSyncStatusMsg({ text: getTranslation(language, "RESTORE_SUCCESS") || "Passphrase code copied to clipboard!", isError: false });
    setTimeout(() => setSyncStatusMsg(null), 3000);
  };

  // Trigger sync upload
  const handlePushCloud = async () => {
    if (!syncKey || syncKey.length < 4) {
      setSyncStatusMsg({ text: "Passphrase must be at least 4 characters.", isError: true });
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const resp = await onSyncPush(syncKey);
      if (resp.success) {
        setSyncStatusMsg({ text: "Environment sync push was completed successfully!", isError: false });
      } else {
        setSyncStatusMsg({ text: resp.error || "Backup upload synchronization failed.", isError: true });
      }
    } catch (e) {
      setSyncStatusMsg({ text: "An error occurred during communication with server.", isError: true });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    }
  };

  // Trigger sync download
  const handlePullCloud = async () => {
    if (!syncKey || syncKey.length < 4) {
      setSyncStatusMsg({ text: "Please enter a valid passphrase.", isError: true });
      return;
    }
    if (!confirm(getTranslation(language, "IMPORT_JSON_CONFIRM"))) {
      return;
    }
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const resp = await onSyncPull(syncKey);
      if (resp.success && resp.data) {
        onFullStateImport(resp.data);
        setSyncStatusMsg({ text: getTranslation(language, "RESTORE_SUCCESS") || "Sync state pulled successfully!", isError: false });
      } else {
        setSyncStatusMsg({ text: resp.error || "Sync extraction key was not found.", isError: true });
      }
    } catch (e: any) {
      setSyncStatusMsg({ text: "Error syncing: " + e.message, isError: true });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 6000);
    }
  };

  // Handle local file json upload export
  const handleFileExport = () => {
    try {
      const exportData = onFullStateExport();
      const str = JSON.stringify(exportData, null, 2);
      const blob = new Blob([str], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-chat-rag-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert("Export failed: " + e.message);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.chats || !Array.isArray(json.chats)) {
          alert(getTranslation(language, "INVALID_BACKUP_FILE"));
          return;
        }
        if (confirm(getTranslation(language, "IMPORT_JSON_CONFIRM"))) {
          onFullStateImport(json);
          alert(getTranslation(language, "RESTORE_SUCCESS"));
        }
      } catch (err) {
        alert("JSON parsing error: Invalid file content.");
      }
    };
    reader.readAsText(file);
  };

  const handleCreatePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || !newPromptText.trim()) return;
    onAddCustomPrompt(newLabel.trim(), newPromptText.trim());
    setNewLabel("");
    setNewPromptText("");
  };

  return (
    <div id="settings_panel" className="space-y-6">
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
      <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          {getTranslation(language, "CONFIGS_HEADER_TITLE")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {getTranslation(language, "CONFIGS_HEADER_DESC")}
        </p>
      </div>

      {/* Language Switching Section (High Visibility) */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/30 dark:bg-zinc-900/25 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            Language Preference / 语言选择 / Language settings
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Select your preferred system interface language. Translates tabs, headers, sliders, settings, and instructions.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white dark:bg-zinc-900 px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 shadow-sm shrink-0">
          <Globe className="w-4 h-4 shrink-0 text-indigo-500" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-transparent border-none text-xs font-semibold text-zinc-800 dark:text-zinc-200 focus:outline-none cursor-pointer"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} className="bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100">
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LLM Inference parameters */}
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Sliders className="w-4 h-4 text-indigo-500" />
            {getTranslation(language, "MODEL_HYPERPARAMETERS")}
          </h3>

          {/* Temperature */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-700 dark:text-zinc-300">{getTranslation(language, "TEMPERATURE_CREATIVITY")}</span>
              <span className="font-mono text-indigo-500 dark:text-indigo-400">{temperature}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="2" 
              step="0.1" 
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {getTranslation(language, "LLM_PARAMS_HELP")}
            </p>
          </div>

          {/* Max Output Tokens */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-zinc-700 dark:text-zinc-300">{getTranslation(language, "MAX_OUTPUT_LIMIT")}</span>
              <span className="font-mono text-indigo-500 dark:text-indigo-400">{maxOutputTokens}</span>
            </div>
            <input 
              type="range" 
              min="256" 
              max="8192" 
              step="128" 
              value={maxOutputTokens}
              onChange={(e) => setMaxOutputTokens(parseInt(e.target.value))}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {getTranslation(language, "MAX_TOKENS_HELP")}
            </p>
          </div>

          {/* Advanced Top P / Top K */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{getTranslation(language, "TOP_K_SELECTION")}</label>
              <input 
                type="number" 
                min="1" 
                max="100" 
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value) || 40)}
                className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{getTranslation(language, "TOP_P_NUCLEUS")}</label>
              <input 
                type="number" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={topP}
                onChange={(e) => setTopP(parseFloat(e.target.value) || 0.95)}
                className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        {/* Local Vector DB & Offline RAG parameters */}
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/20 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <Database className="w-4 h-4 text-indigo-500" />
            {getTranslation(language, "LOCAL_VECTOR_DB")} (Offline RAG)
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-800">
            <div className="space-y-0.5 pr-2">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{getTranslation(language, "LOCAL_SEMANTIC_RAG_TOGGLE")}</h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-550 leading-relaxed">{getTranslation(language, "INJECT_PAST_DISCUSSIONS_DESC")}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={ragEnabled}
                onChange={(e) => setRagEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          {/* RAG sources limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">{getTranslation(language, "RAG_CONTEXT_LIMIT")}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded text-[10px]">{ragSourceCount} messages</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="5" 
              step="1" 
              value={ragSourceCount}
              onChange={(e) => setRagSourceCount(parseInt(e.target.value))}
              disabled={!ragEnabled}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-45"
            />
          </div>

          {/* Similarity threshold limit */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-zinc-700 dark:text-zinc-300">{getTranslation(language, "SIMILARITY_THRESHOLD")}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded text-[10px]">{Math.round(ragSimilarityThreshold * 100)}%</span>
            </div>
            <input 
              type="range" 
              min="0.10" 
              max="0.80" 
              step="0.05" 
              value={ragSimilarityThreshold}
              onChange={(e) => setRagSimilarityThreshold(parseFloat(e.target.value))}
              disabled={!ragEnabled}
              className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-45"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
              {getTranslation(language, "EMBEDDINGS_CONFIDENCE_HELP")}
            </p>
          </div>

          {/* Indexed Vector Stats */}
          <div className="flex justify-between items-center text-xs pt-3.5 border-t border-zinc-100 dark:border-zinc-800/60">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500">{getTranslation(language, "LOCAL_VECTOR_DB")} (Index)</span>
              <p className="text-zinc-800 dark:text-zinc-200 font-bold font-mono text-[12px]">{vectorCount} message vectors</p>
            </div>
            {vectorCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(getTranslation(language, "INDEX_RESET_CONFIRM"))) {
                    onClearVectorDb();
                  }
                }}
                className="px-3 py-1.5 text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30 transition-all cursor-pointer font-sans"
              >
                {getTranslation(language, "INDEX_RESET_BTN")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Developer Documentation & Language Ingestion Hub (Mainstream Languages Support) */}
      <div className="p-6 md:p-7 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/60 dark:bg-zinc-900/40 backdrop-blur-md shadow-sm hover:shadow-md/5 transition-all duration-300 space-y-6 relative overflow-hidden" id="mainstream_lang_docs_hub">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-600"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-150 dark:border-zinc-800 pb-4">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 dark:text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <span>{getTranslation(language, "DOCS_HUB_TITLE")}</span>
          </h3>
          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-100/50 dark:border-indigo-900/30">
            {getTranslation(language, "DOCS_HUB_STANDARD_MANUALS")}
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400 font-sans leading-relaxed">
          {getTranslation(language, "DOCS_HUB_SUBTITLE")}
        </p>

        {/* Tab Selection Row */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-zinc-100/80 dark:bg-zinc-950/80 border border-zinc-200/40 dark:border-zinc-850">
          {LANG_DOC_PRESETS.map((preset) => {
            const locPreset = getLocalizedPreset(preset, language);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  setActiveLangDocId(preset.id);
                  setDocStatusMsg(null);
                }}
                className={`px-3.5 py-1.8 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 ${
                  activeLangDocId === preset.id
                    ? "bg-indigo-600 text-white shadow-sm font-bold scale-[1.02]"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/40"
                }`}
              >
                {locPreset.name.split(" ")[0]}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setActiveLangDocId("custom-doc");
              setDocStatusMsg(null);
            }}
            className={`px-3.5 py-1.8 text-xs font-semibold rounded-lg cursor-pointer transition-all duration-200 ${
              activeLangDocId === "custom-doc"
                ? "bg-indigo-600 text-white shadow-sm font-bold scale-[1.02]"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/50 dark:hover:text-zinc-200 dark:hover:bg-zinc-900/40"
            }`}
          >
            {getTranslation(language, "DOCS_HUB_CUSTOM_SUPPLEMENT")}
          </button>
        </div>

        {/* Selected Preset Details Box */}
        {activeLangDocId !== "custom-doc" ? (() => {
          const preset = getLocalizedPreset(LANG_DOC_PRESETS.find(p => p.id === activeLangDocId)!, language);
          return (
            <div className="space-y-5 animate-fadeIn" key={preset.id}>
              <div className="p-4 rounded-xl bg-indigo-50/5 dark:bg-zinc-950/20 border border-zinc-200/50 dark:border-zinc-800 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-150">{preset.name}</span>
                  <span className="text-[10px] font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100/30 dark:border-indigo-900/10">
                    {preset.category}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-sans">
                  {preset.summary}
                </p>

                <div className="pt-2">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-500/80 dark:text-indigo-400/80 block mb-2">{getTranslation(language, "DOCS_HUB_STANDARD_PRACTICES")}</span>
                  <ul className="space-y-2 text-[11px] text-zinc-650 dark:text-zinc-300">
                    {preset.bestPractices.map((bp, idx) => (
                      <li key={idx} className="flex items-start gap-2 leading-relaxed">
                        <div className="rounded-full bg-indigo-50 dark:bg-indigo-950 p-0.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                        <span>{bp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Operations Board */}
              <div className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/10 space-y-3.5">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">{getTranslation(language, "DOCS_HUB_TARGET_SESSION")}</label>
                    <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{getTranslation(language, "DOCS_HUB_TARGET_SESSION_DESC")}</p>
                  </div>
                  <select
                    value={targetIngestSessionId}
                    onChange={(e) => setTargetIngestSessionId(e.target.value)}
                    className="p-1 px-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none min-w-[200px]"
                  >
                    {sessions.map((s) => (
                      <option key={s.id} value={s.id}>{s.title || getTranslation(language, "UNTITLED_CHAT")}</option>
                    ))}
                    {sessions.length === 0 && (
                      <option value="">{getTranslation(language, "DOCS_HUB_NO_ACTIVE_SESSIONS_AVAIL")}</option>
                    )}
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 font-sans">
                  <button
                    type="button"
                    disabled={!!ingestingDocId || !targetIngestSessionId}
                    onClick={() => handleIngestDocPreset(preset)}
                    className="px-3.5 py-1.8 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 select-none transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{getTranslation(language, "DOCS_HUB_INCORPORATE_RAG")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRegisterPersonaPrompt(preset)}
                    className="px-3.5 py-1.8 inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 cursor-pointer select-none transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{getTranslation(language, "DOCS_HUB_CONFIGURE_PERSONA")}</span>
                  </button>
                </div>

                {ingestingDocId === preset.id && (
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-lg space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                      <span className="flex items-center gap-1.5">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        {getTranslation(language, "DOCS_HUB_EMBEDDING_PROGRESS")}
                      </span>
                      <span>{ingestProgress} / {preset.textsToEmbed.length} units ({Math.round((ingestProgress/preset.textsToEmbed.length)*100)}%)</span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                        style={{ width: `${(ingestProgress / preset.textsToEmbed.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })() : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-slate-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800 space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 block">{getTranslation(language, "DOCS_HUB_CUSTOM_SUPPLEMENT_MATERIAL")}</label>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {getTranslation(language, "DOCS_HUB_CUSTOM_SUPPLEMENT_DESC")}
                </p>
              </div>
              <textarea
                value={customSupplementText}
                onChange={(e) => setCustomSupplementText(e.target.value)}
                placeholder={`-- Example --\n\nFastAPI Style Guidelines: Prefer Async route endpoints over standard Sync interfaces when launching non-blocking operations.\n\nSvelteKit Store Rules: Export writable states with safe unsubscribe calls.`}
                className="w-full h-[120px] p-2.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
              />

              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-2">
                <select
                  value={targetIngestSessionId}
                  onChange={(e) => setTargetIngestSessionId(e.target.value)}
                  className="p-1 px-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none min-w-[200px]"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>{s.title || getTranslation(language, "UNTITLED_CHAT")}</option>
                  ))}
                  {sessions.length === 0 && (
                    <option value="">{getTranslation(language, "DOCS_HUB_NO_ACTIVE_SESSIONS")}</option>
                  )}
                </select>

                <button
                  type="button"
                  disabled={!!ingestingDocId || !targetIngestSessionId || !customSupplementText.trim()}
                  onClick={() => handleIngestDocPreset({
                    id: "custom-doc",
                    name: "Custom Supplementary Docs",
                    category: "User Uploaded",
                    summary: "",
                    bestPractices: [],
                    systemPrompt: "",
                    textsToEmbed: []
                  }, true)}
                  className="px-3.5 py-1.8 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors font-sans"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{getTranslation(language, "DOCS_HUB_INDEX_CUSTOM_DOCS")}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Local Vector Index Ingestion Logs */}
        {docStatusMsg && (
          <div className={`p-3 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 ${docStatusMsg.isError ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200"}`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{docStatusMsg.text}</span>
          </div>
        )}

        {/* Synchronized Live Index Counter */}
        <div className="flex items-center justify-between text-xs p-3.5 rounded-lg border border-zinc-150 dark:border-zinc-850/80 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="space-y-0.5">
            <span className="text-[10px] text-zinc-400 uppercase font-mono block">{getTranslation(language, "DOCS_HUB_VECTOR_BANK")}</span>
            <span className="text-zinc-800 dark:text-zinc-250 font-bold font-mono text-[13px]">{getTranslation(language, "DOCS_HUB_VECTORS_LOADED", { count: localVectorCount.toString() })}</span>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">{getTranslation(language, "DOCS_HUB_UPDATES_LIVE")}</span>
        </div>
      </div>

      {/* MySQL Connection Configurator & Persistent Relational Store (New Feature) */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4" id="mysql_database_configurator">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-100 dark:border-zinc-805 pb-2">
          <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Relational MySQL Database Integration</span>
          </h3>
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="text-neutral-500 select-none">Status:</span>
            {mysqlConnected ? (
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                ACTIVE & ONLINE
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                DISCONNECTED
              </span>
            )}
          </div>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Configure a central MySQL database to persist all dialogues (sessions), custom character backgrounds, and consumption telemetry. Replaces localStorage safely once connected.
        </p>

        {/* Storage Toggle Row */}
        <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/60 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
              <span>Database Sync Persistence Mode</span>
              {useMysql && (
                <span className="text-[9px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1 rounded uppercase font-bold font-mono">
                  MySQL ON
                </span>
              )}
            </h4>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 max-w-lg">
              When toggled, dialogues, updates, characters, and logs sync directly to MySQL tables. If disabled or disconnected, saves safely to local storage fallback logs.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 select-none">
            <input 
              type="checkbox" 
              checked={useMysql}
              onChange={handleToggleStorageEngine}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-zinc-350 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Input coordinates grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-2">
          {/* Host */}
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">DB Host IP / URL</label>
            <input 
              type="text"
              placeholder="e.g. localhost or mysql-server"
              value={mysqlHost}
              onChange={(e) => setMysqlHost(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Port */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Port</label>
            <input 
              type="number"
              placeholder="3306"
              value={mysqlPort}
              onChange={(e) => setMysqlPort(Number(e.target.value) || 3306)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* User */}
          <div className="sm:col-span-5 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Username</label>
            <input 
              type="text"
              placeholder="root"
              value={mysqlUser}
              onChange={(e) => setMysqlUser(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-855 dark:text-zinc-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div className="sm:col-span-6 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Password</label>
            <input 
              type="password"
              placeholder="••••••••"
              value={mysqlPassword}
              onChange={(e) => setMysqlPassword(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-855 dark:text-zinc-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Schema Name */}
          <div className="sm:col-span-6 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Database Name</label>
            <input 
              type="text"
              placeholder="ai_chat_assistant"
              value={mysqlDatabase}
              onChange={(e) => setMysqlDatabase(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-855 dark:text-zinc-200 font-mono focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Database Error Warning */}
        {mysqlError && (
          <div className="p-3 text-[11px] text-red-600 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900/30 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div className="font-mono">
              <strong>Database Warning:</strong> {mysqlError}
            </div>
          </div>
        )}

        {/* Sub action triggers */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            disabled={dbTesting || dbSaving}
            onClick={handleTestConnection}
            className="px-3.5 py-1.8 inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-205 text-zinc-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-205 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 cursor-pointer disabled:opacity-40 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${dbTesting ? "animate-spin" : ""}`} />
            <span>Test Connection</span>
          </button>

          <button
            type="button"
            disabled={dbTesting || dbSaving}
            onClick={() => handleSaveConfig()}
            className="px-4 py-1.8 inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Credentials</span>
          </button>

          <button
            type="button"
            disabled={dbSaving || !mysqlConnected}
            onClick={handleInitializeTables}
            className="px-3.5 py-1.8 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Auto-Create System SQL Tables</span>
          </button>

          <button
            type="button"
            disabled={dbSaving || !mysqlConnected}
            onClick={handleSyncToMySql}
            className="px-3.5 py-1.8 inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-indigo-450 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-40 transition-all font-mono"
          >
            <span>Sync Browser Chats to MySQL</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSqlSchema(!showSqlSchema)}
            className="px-3.5 py-1.8 text-xs text-zinc-500 hover:text-zinc-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <span>{showSqlSchema ? "Hide SQL Script" : "Show SQL Table Schema"}</span>
          </button>
        </div>

        {/* Database Message Center */}
        {dbInitMsg && (
          <div className={`p-3 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 ${dbInitMsg.isError ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-200" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200"}`}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{dbInitMsg.text}</span>
          </div>
        )}

        {/* Collapsed custom SQL schemas (Match provided SQL statements requirement) */}
        {showSqlSchema && (
          <div className="space-y-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950 p-2 rounded border border-zinc-200 dark:border-zinc-805">
              <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-400">DDL SQL Statements Reference</span>
              <span className="text-[9px] font-mono text-zinc-500">ENGINE=InnoDB DEFAULT CHARSET=utf8mb4</span>
            </div>
            <pre className="p-3 bg-zinc-950 text-emerald-400 text-[10px] font-mono leading-relaxed rounded-lg overflow-x-auto max-h-[180px] scroller-custom selection:bg-zinc-800">
{`-- SQL Reference Schema Statements 
CREATE TABLE IF NOT EXISTS sessions (
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
);

CREATE TABLE IF NOT EXISTS messages (
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
);

CREATE TABLE IF NOT EXISTS system_prompts (
  id VARCHAR(255) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  prompt TEXT NOT NULL,
  isBuiltIn BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS consumption_records (
  id VARCHAR(255) PRIMARY KEY,
  timestamp VARCHAR(100) NOT NULL,
  chatId VARCHAR(255),
  modelId VARCHAR(255) NOT NULL,
  promptTokens INT DEFAULT 0,
  candidateTokens INT DEFAULT 0,
  totalTokens INT DEFAULT 0,
  estimatedCost DOUBLE DEFAULT 0.0
);`}
            </pre>
          </div>
        )}
      </div>

      {/* Model Providers and Settings Credentials */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-805 pb-2">
          <Key className="w-4 h-4 text-indigo-500" />
          Model Providers & Core API Key Integrations
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Turn your companion into a multi-cloud personal router. Provide keys for OpenAI, Anthropic, DeepSeek, or custom endpoints. Credentials remain fully offline in your browser's private state, never sent to external servers.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Gemini Options */}
          <div className="space-y-1.5 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">Google Gemini API Key</label>
            <input 
              type="password"
              placeholder="Defaults to server-side GEMINI_API_KEY..."
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 font-mono transition-all focus:border-indigo-400 focus:outline-none"
            />
            <span className="text-[9px] text-zinc-400 block">Provide a private custom key to override container rate limits.</span>
          </div>

          {/* OpenAI Options */}
          <div className="space-y-1.5 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">OpenAI API Key</label>
            <input 
              type="password"
              placeholder="sk-proj-..."
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 font-mono transition-all focus:border-indigo-400 focus:outline-none"
            />
            <input 
              type="text"
              placeholder="Base URL: https://api.openai.com/v1"
              value={openaiBaseUrl}
              onChange={(e) => setOpenaiBaseUrl(e.target.value)}
              className="w-full p-2 mt-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 font-mono transition-all focus:border-indigo-400 focus:outline-none"
            />
            <span className="text-[9px] text-zinc-400 block">Enables ChatGPT models. Compatible with Ollama, Groq, OpenRouter, and local ports.</span>
          </div>

          {/* Anthropic Options */}
          <div className="space-y-1.5 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <label className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">Anthropic Claude API Key</label>
            <input 
              type="password"
              placeholder="sk-ant-..."
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 font-mono transition-all focus:border-indigo-400 focus:outline-none"
            />
            <span className="text-[9px] text-zinc-400 block">Enables dynamic Sonnet, Haiku, and Opus chat queries.</span>
          </div>

          {/* DeepSeek Options */}
          <div className="space-y-1.5 p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40">
            <label className="text-[10px] font-bold text-[10px] text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">DeepSeek API Key</label>
            <input 
              type="password"
              placeholder="sk-ds-..."
              value={deepseekApiKey}
              onChange={(e) => setDeepseekApiKey(e.target.value)}
              className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-850 dark:text-zinc-200 font-mono transition-all focus:border-indigo-400 focus:outline-none"
            />
            <span className="text-[9px] text-zinc-400 block">Enables DeepSeek V3 and DeepSeek R1 reasoning chains.</span>
          </div>
        </div>
      </div>

      {/* Cloud Sync and Backup */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <CloudLightning className="w-4 h-4 text-indigo-500" />
          {getTranslation(language, "CLOUD_BACKUP_TITLE")}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {getTranslation(language, "CLOUD_BACKUP_DESC")}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Real Cloud Sync Component */}
          <div className="space-y-3.5 p-4 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Passphrase Code
              </label>
              <button 
                type="button"
                onClick={handleCopyKey}
                className="text-[10px] text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-0.5 cursor-pointer"
              >
                <Copy className="w-3" /> {getTranslation(language, "COPY_BTN")}
              </button>
            </div>
            
            <input 
              type="text" 
              value={syncKey}
              onChange={(e) => handleUpdateSyncKey(e.target.value)}
              placeholder={getTranslation(language, "ENTER_PASSCODE_PLACEHOLDER")}
              className="w-full px-3 py-2 font-mono text-center tracking-widest text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-indigo-600 dark:text-indigo-400 focus:outline-indigo-500 uppercase font-bold"
            />
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 text-center">
              {getTranslation(language, "KEY_SYNC_DESC")}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handlePushCloud}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 font-sans"
              >
                <Upload className="w-3.5 h-3.5" />
                {isSyncing ? "..." : getTranslation(language, "SYNC_PUSH_BTN")}
              </button>

              <button
                type="button"
                onClick={handlePullCloud}
                disabled={isSyncing}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-750 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 border border-zinc-200 dark:border-zinc-700 font-sans"
              >
                <Download className="w-3.5 h-3.5" />
                {isSyncing ? "..." : getTranslation(language, "SYNC_PULL_BTN")}
              </button>
            </div>

            {syncStatusMsg && (
              <div className={`p-2.5 rounded-lg text-[11px] flex items-center gap-1.5 ${syncStatusMsg.isError ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border border-red-100" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100"}`}>
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{syncStatusMsg.text}</span>
              </div>
            )}
          </div>

          {/* Local Static Files Sync Component */}
          <div className="space-y-4 p-4 rounded-lg bg-zinc-100/50 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 flex flex-col justify-between">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{getTranslation(language, "LOCAL_BACKUP_TITLE")}</h4>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
                {getTranslation(language, "LOCAL_BACKUP_DESC")}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleFileExport}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg text-xs font-medium transition-colors cursor-pointer font-sans"
              >
                <Download className="w-3.5 h-3.5" />
                {getTranslation(language, "EXPORT_JSON_BTN")}
              </button>

              <div className="relative">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleFileImport}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="import-backup-file"
                />
                <label 
                  htmlFor="import-backup-file"
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-650 dark:text-zinc-400 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer text-center font-sans"
                >
                  <Plus className="w-3.5 h-3.5 text-zinc-400 font-sans" />
                  {getTranslation(language, "IMPORT_JSON_BTN")}
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customizable system prompts manager */}
      <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 space-y-4">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          {getTranslation(language, "CUSTOM_PROMPTS_TITLE")}
        </h3>
        <p className="text-xs text-zinc-450 dark:text-zinc-500">
          {getTranslation(language, "CUSTOM_PROMPTS_DESC")}
        </p>

        {/* Existing builtins vs custom prompts listing */}
        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {BUILT_IN_PROMPTS.map((prompt) => (
            <div key={prompt.id} className="flex justify-between items-start p-2 rounded bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-100 dark:border-zinc-800/60">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <span>{prompt.label}</span>
                  <span className="text-[9px] bg-zinc-200 dark:bg-zinc-805 text-zinc-500 dark:text-zinc-400 px-1.5 py-0.2 rounded font-sans uppercase">
                    {getTranslation(language, "BUILT_IN_TAG")}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1">{prompt.prompt}</p>
              </div>
            </div>
          ))}

          {customPrompts.map((prompt) => (
            <div key={prompt.id} className="flex justify-between items-start p-2 rounded bg-zinc-50 dark:bg-zinc-900 text-xs border border-zinc-100 dark:border-zinc-800/60">
              <div className="space-y-0.5 pr-4">
                <div className="font-semibold text-indigo-600 dark:text-indigo-400">{prompt.label}</div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-2">{prompt.prompt}</p>
              </div>
              <button
                type="button"
                onClick={() => onDeleteCustomPrompt(prompt.id)}
                className="text-red-500 hover:text-red-600 p-1 shrink-0 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add custom prompt builder form */}
        <form onSubmit={handleCreatePrompt} className="space-y-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{getTranslation(language, "CREATE_NEW_PROMPT")}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1 space-y-1">
              <label className="text-[10px] font-medium text-zinc-500">{getTranslation(language, "LABEL_NAME")}</label>
              <input 
                type="text" 
                placeholder={getTranslation(language, "BRAND_NEW_LABEL_PLACEHOLDER")} 
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="w-full p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
              />
            </div>
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-medium text-zinc-500">{getTranslation(language, "PROMPT_INSTRUCTION")}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder={getTranslation(language, "BRAND_NEW_INSTRUCTION_PLACEHOLDER")} 
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  className="flex-1 p-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                />
                <button
                  type="submit"
                  disabled={!newLabel.trim() || !newPromptText.trim()}
                  className="px-3 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-40 font-sans"
                >
                  <Plus className="w-3.5 h-3.5" /> {getTranslation(language, "ADD_BTN")}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
}
