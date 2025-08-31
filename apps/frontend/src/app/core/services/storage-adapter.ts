import { InjectionToken } from '@angular/core';

export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T | null): Promise<void>;
  save(): Promise<void>;
}

export const STORAGE_ADAPTER = new InjectionToken<StorageAdapter>('STORAGE_ADAPTER');
