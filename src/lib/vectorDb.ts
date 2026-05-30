/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { VectorRecord, RagSource } from "../types";

export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class VectorDb {
  private dbName = "AIChatLocalRAG_VectorStore";
  private storeName = "embeddings";
  private db: IDBDatabase | null = null;
  private inMemoryFallback: VectorRecord[] = [];
  private isInitialized = false;

  constructor() {
    // Lazy initialisation, called manually when application starts
  }

  public async init(): Promise<boolean> {
    if (this.isInitialized) return true;

    return new Promise((resolve) => {
      try {
        if (!window.indexedDB) {
          console.warn("IndexedDB not supported, falling back to in-memory database.");
          this.isInitialized = true;
          resolve(false);
          return;
        }

        const request = window.indexedDB.open(this.dbName, 1);

        request.onerror = (event) => {
          console.error("IndexedDB open error, falling back to in-memory:", event);
          this.isInitialized = true;
          resolve(false);
        };

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitialized = true;
          resolve(true);
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: "id" });
            store.createIndex("chatId", "chatId", { unique: false });
            store.createIndex("messageId", "messageId", { unique: true });
          }
        };
      } catch (err) {
        console.error("Error opening IndexedDB (sandbox sandbox constraint?):", err);
        this.isInitialized = true;
        resolve(false);
      }
    });
  }

  public async storeVector(record: VectorRecord): Promise<boolean> {
    await this.init();
    if (!this.db) {
      // Memory insert or update
      const index = this.inMemoryFallback.findIndex(r => r.id === record.id);
      if (index >= 0) {
        this.inMemoryFallback[index] = record;
      } else {
        this.inMemoryFallback.push(record);
      }
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.put(record);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error("Failed to insert record into IndexedDB:", request.error);
          resolve(false);
        };
      } catch (err) {
        console.error("IndexedDB store transaction failed:", err);
        resolve(false);
      }
    });
  }

  public async deleteVectorsForChat(chatId: string): Promise<boolean> {
    await this.init();
    if (!this.db) {
      this.inMemoryFallback = this.inMemoryFallback.filter(r => r.chatId !== chatId);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("chatId");
        const request = index.openCursor(IDBKeyRange.only(chatId));

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve(true);
          }
        };

        request.onerror = () => resolve(false);
      } catch (err) {
        console.error("IndexedDB delete transaction failed:", err);
        resolve(false);
      }
    });
  }

  public async deleteVector(id: string): Promise<boolean> {
    await this.init();
    if (!this.db) {
      this.inMemoryFallback = this.inMemoryFallback.filter(r => r.id !== id);
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(id);

        request.onsuccess = () => resolve(true);
        request.onerror = () => {
          console.error("Failed to delete record from IndexedDB:", request.error);
          resolve(false);
        };
      } catch (err) {
        console.error("IndexedDB delete vector failed:", err);
        resolve(false);
      }
    });
  }

  public async getVectorsForChat(chatId: string): Promise<VectorRecord[]> {
    await this.init();
    if (!this.db) {
      return this.inMemoryFallback.filter(r => r.chatId === chatId);
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const index = store.index("chatId");
        const request = index.getAll(IDBKeyRange.only(chatId));

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch (err) {
        console.error("IndexedDB getVectorsForChat transaction failed:", err);
        resolve([]);
      }
    });
  }

  public async getAllRecords(): Promise<VectorRecord[]> {
    await this.init();
    if (!this.db) {
      return [...this.inMemoryFallback];
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } catch (err) {
        console.error("IndexedDB getAll failed:", err);
        resolve([]);
      }
    });
  }

  public async getRecordCount(): Promise<number> {
    await this.init();
    if (!this.db) {
      return this.inMemoryFallback.length;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readonly");
        const store = transaction.objectStore(this.storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result || 0);
        request.onerror = () => resolve(0);
      } catch (err) {
        resolve(0);
      }
    });
  }

  public async findSimilar(queryVector: number[], limit = 3, threshold = 0.3, chatId?: string): Promise<VectorRecord[]> {
    let allRecords = await this.getAllRecords();
    if (chatId) {
      allRecords = allRecords.filter(record => record.chatId === chatId);
    }
    if (allRecords.length === 0) return [];

    const scored = allRecords.map(record => {
      const similarity = cosineSimilarity(queryVector, record.embedding);
      return { record, similarity };
    });

    // Sort descending by similarity, filter by threshold
    const filtered = scored
      .filter(item => item.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return filtered.slice(0, limit).map(item => ({
      ...item.record,
      // Temporarily piggybacking similarity info for debug/UI consumption
      text: item.record.text,
      // Store similarity inside an added property
      similarity: parseFloat(item.similarity.toFixed(4)) as any
    }));
  }

  public async clearAll(): Promise<boolean> {
    await this.init();
    if (!this.db) {
      this.inMemoryFallback = [];
      return true;
    }

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], "readwrite");
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      } catch (e) {
        resolve(false);
      }
    });
  }
}

export const localVectorDb = new VectorDb();
