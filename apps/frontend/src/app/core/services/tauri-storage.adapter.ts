import { Store } from 'tauri-plugin-store-api';
import { StorageAdapter } from './storage-adapter';

export class TauriStorageAdapter implements StorageAdapter {
  private readonly store = new Store('.settings.dat');

  public get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(key);
  }

  public set<T>(key: string, value: T | null): Promise<void> {
    return this.store.set(key, value);
  }

  public save(): Promise<void> {
    return this.store.save();
  }
}
