import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CodeSession {
  id: string;
  title: string;
  code: string;
  language: string;
  output: string;
  error: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CodeSessionStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ChaterooCodeSessions';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'code-sessions';

  private sessionsSubject = new BehaviorSubject<CodeSession[]>([]);
  public sessions$ = this.sessionsSubject.asObservable();

  public constructor() {
    this.initDB().then(() => {
      this.loadAllSessions();
    });
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = () => {
        const db = request.result;
        const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
        store.createIndex('language', 'language');
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('updatedAt', 'updatedAt');
      };
    });
  }

  public async saveSession(session: CodeSession): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put({ ...session, updatedAt: new Date() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadAllSessions(); // Refresh the observable
        resolve();
      };
    });
  }

  public async getAllSessions(): Promise<CodeSession[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('updatedAt');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        // Sort by updatedAt descending (most recent first)
        const sessions = request.result.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        resolve(sessions);
      };
    });
  }

  public async getSession(id: string): Promise<CodeSession | null> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  public async deleteSession(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadAllSessions(); // Refresh the observable
        resolve();
      };
    });
  }

  public async clearAllSessions(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.loadAllSessions(); // Refresh the observable
        resolve();
      };
    });
  }

  private async loadAllSessions(): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      this.sessionsSubject.next(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      this.sessionsSubject.next([]);
    }
  }

  public generateSessionId(): string {
    return 'code_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  public generateSessionTitle(code: string, language: string): string {
    if (!code.trim()) return `New ${language} session`;

    // Extract first meaningful line or function name
    const lines = code.split('\n').filter(line => line.trim());
    if (lines.length === 0) return `New ${language} session`;

    const firstLine = lines[0].trim();

    // For functions, try to extract function name
    if (language === 'javascript') {
      const funcMatch = firstLine.match(/function\s+(\w+)/);
      if (funcMatch) return `Function: ${funcMatch[1]}`;

      const arrowMatch = firstLine.match(/const\s+(\w+)\s*=/);
      if (arrowMatch) return `Function: ${arrowMatch[1]}`;
    }

    // Otherwise use first line, truncated
    return firstLine.length > 30 ? firstLine.substring(0, 30) + '...' : firstLine;
  }
}
