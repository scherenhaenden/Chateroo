import { Store } from 'tauri-plugin-store-api';
import { StorageAdapter } from './storage-adapter';

/**
 * Adapter for the Tauri Store API, implements the project's StorageAdapter interface.
 * This class encapsulates direct access to the local store file and provides a small,
 * unified API (get/set/save) for the rest of the application.
 */
export class TauriStorageAdapter implements StorageAdapter {
  /**
   * Internal Store instance (file name: .settings.dat)
   */
  private readonly store = new Store('.settings.dat');

  /**
   * Reads a value from the store.
   * @param key The key under which the value is stored.
   * @typeParam T Expected type of the stored value.
   * @returns A Promise that resolves to the value of type T or null if not present.
   */
  public get<T>(key: string): Promise<T | null> {
    return this.store.get<T>(key);
  }

  /**
   * Stores a value in the store.
   * @param key The key under which to save the value.
   * @param value The value to save. Use null to remove a value.
   * @typeParam T Type of the value being stored.
   * @returns A Promise that resolves when the operation is complete.
   */
  public set<T>(key: string, value: T | null): Promise<void> {
    return this.store.set(key, value);
  }

  /**
   * Persists any buffered store content to the store file.
   * Should be called after multiple set operations to batch writes.
   * @returns A Promise that resolves once the save operation has completed.
   */
  public save(): Promise<void> {
    return this.store.save();
  }
}
