import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatSession } from '../../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatSessionStorageService {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'ChaterooChats';
  private readonly DB_VERSION = 1;
  private readonly STORE_NAME = 'chat-sessions';

  private sessionsSubject = new BehaviorSubject<ChatSession[]>([]);
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
        store.createIndex('title', 'title');
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('updatedAt', 'updatedAt');
      };
    });
  }

  public async saveSession(session: ChatSession): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put({ ...session, updatedAt: new Date() });

      request.onerror = () => {
        console.error('Error saving session to IndexedDB:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        console.log('Session saved successfully:', session.id, session.title);
        this.loadAllSessions(); // Refresh the observable
        resolve();
      };
    });
  }

  public async getAllSessions(): Promise<ChatSession[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const index = store.index('updatedAt');
      const request = index.getAll();

      request.onerror = () => {
        console.error('Error loading sessions from IndexedDB:', request.error);
        reject(request.error);
      };
      request.onsuccess = () => {
        // Sort by updatedAt descending (most recent first)
        const sessions = request.result.sort((a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
        console.log('Loaded sessions from IndexedDB:', sessions.length);
        resolve(sessions);
      };
    });
  }

  public async getSession(id: string): Promise<ChatSession | null> {
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
      console.error('Error loading chat sessions:', error);
      this.sessionsSubject.next([]);
    }
  }

  public generateSessionId(): string {
    return 'chat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
}
