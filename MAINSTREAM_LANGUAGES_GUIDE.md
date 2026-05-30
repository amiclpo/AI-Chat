# Mainstream Languages Developer Standard & Local RAG Guide

This reference manual documents the pre-configured high-fidelity guidelines, coding standards, compiler behaviors, and offline RAG (Retrieval-Augmented Generation) indexes implemented within your AI assistant workspace. 

Using this system, developers can selectively feed certified style rules and architecture design patterns directly into the relational local vector database for instant semantic alignment.

---

## 🚀 Supported Mainstream Languages

Below is a master outline of the curated specifications, style criteria, and static compiler expectations registered inside the system:

### 1. TypeScript (Clean Coding & ESM)
* **Goal**: Modular, highly debuggable, and type-safe front-end structures.
* **Core Practices**:
  * **Strict Type Safety**: Completely eliminate the use of lazy or undefined `any` type variables. Always use explicit structures, interface schemas, or strict templates.
  * **ECMAScript Modules (ESM)**: Ensure clean file segregation and top-level relative module paths (with no runtime namespace wrapping elements).
  * **Unified Exception Traps**: Anchor deep asynchronous computations inside uniform try-catch blocks with designated fallback indicators.

---

### 2. Python (PEP 8 & Type Hints)
* **Goal**: Readable, standard-compliant scripts with strict execution bounds.
* **Core Practices**:
  * **PEP 8 Compliance**: Enforce regular naming casing patterns: `snake_case` for procedures, nested files, and attributes; `CapitalCase` for custom structures and controller classes.
  * **Complete Type Guidelines**: Standardize type indicators across function boundaries (using the `typing` library: e.g., `def task(data: list[str]) -> dict[str, int]`).
  * **Memory Stream Optimizations**: Leverage `yield` generators inside high-volume data iterators to maintain standard memory footprint constraints.

---

### 3. Go (Idiomatic Concurrency)
* **Goal**: High-speed concurrency, explicit execution status models, and stateless modular paths.
* **Core Practices**:
  * **Tuple Interfaces**: Always supply and check structural `error` interfaces as the final value return on custom functions (`if err != nil`).
  * **Context Propagation**: Thread `context.Context` as the very first argument across all network, database, and background workers to cascade expiration signals.
  * **Active Go Channels**: Keep goroutine definitions isolated and enforce deterministic exits using non-blocking channel select blocks.

---

### 4. Rust (Memory Safety)
* **Goal**: Compile-time safety guarantees, zero-cost abstractions, and strict ownership controls.
* **Core Practices**:
  * **Borrow Checker Mastery**: Design models that leverage memory references (`&T`) instead of triggering expensive runtime heap clones (`.clone()`).
  * **Robust Pattern Matching**: Replace lazy runtime `.unwrap()` calls with detailed match blocks or option fallback paths (`.expect()`).
  * **Clean Features Control**: Structure system features into clean sub-modules managed via standard compilation scopes inside your index boundaries.

---

### 5. Modern C++ (Core RAII)
* **Goal**: System-level deterministic memory management with optimized data motion.
* **Core Practices**:
  * **Resource Acquisition Is Initialization (RAII)**: Cleanly couple dynamic object lifecycles to their scope boundaries so resource cleanup is automatic.
  * **Smart Memory Allocators**: Restrict raw bare pointers entirely. Implement `std::unique_ptr` and `std::shared_ptr` via helper constructors like `std::make_unique<T>()`.
  * **Zero-Copy Move Semantics**: Optimize data transfers across execution boundaries using double-ampersand rvalue parameters (`T&&`) and move statements.

---

## 💾 Offline Semantic Mapping & RAG Storage

The core application implements an offline semantic indexing vector layout utilizing clean local stores.

### Ingestion Flow
1. **Embedding Stage**: The application chunk-splits selected language manuals or your pasted **Custom Supplement** content.
2. **Dense Array Conversion**: Each chunk is passed to the secure proxy API (`/api/embed`) using current Gemini model embedders.
3. **Index Generation**: High-dimensional vectors are stored locally in the Client-Side Vector Database (`localVectorDb`) associated with your active target session ID.
4. **Context Injection**: During interactive chat dialogs, the agent automatically runs a cosine-similarity retrieval query on user prompts, fetching the most relevant style definitions and prepending them to the system workspace contexts.

---

## 🛠️ Developer Administration Actions

* **Index Additional Manuals**: Navigate to the **Developer Documentation Hub** inside the settings card. Choose the target language card, select the conversation ID, and click **Incorporate documentation as local RAG**.
* **Deploy Style Personas**: Click **Configure Chat Persona System Prompt** to register specialized system personas directly into your Prompt Presets menu for quick toggle activation!
