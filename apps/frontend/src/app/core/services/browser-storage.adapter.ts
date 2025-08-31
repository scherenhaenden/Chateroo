import { StorageAdapter } from './storage-adapter';

export class BrowserStorageAdapter implements StorageAdapter {
  public async get<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : null;
  }

  public async set<T>(key: string, value: T | null): Promise<void> {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  public async save(): Promise<void> {
    // localStorage persists immediately; no action required
  }
}
