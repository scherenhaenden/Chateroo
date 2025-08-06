import { Injectable } from '@angular/core';
import { Store } from 'tauri-plugin-store-api';

export interface AppSettings {
  openAiApiKey: string | null;
  // Future settings can be added here: mistralApiKey, theme, etc.
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private store = new Store('.settings.dat');
  private settings: AppSettings = {
    openAiApiKey: null
  };

  constructor() {
    this.load(); // Load settings on service initialization.
  }

  async load(): Promise<void> {
    const openAiApiKey = await this.store.get<string>('openAiApiKey');
    if (openAiApiKey) {
      this.settings.openAiApiKey = openAiApiKey;
    }
  }

  async save(newSettings: Partial<AppSettings>): Promise<void> {
    // Update each setting provided
    for (const key in newSettings) {
      if (Object.prototype.hasOwnProperty.call(newSettings, key)) {
        const value = newSettings[key as keyof AppSettings];
        await this.store.set(key, value);
      }
    }
    // Persist changes to disk
    await this.store.save();
    // Reload the local settings cache
    await this.load();
  }

  getSettings(): AppSettings {
    return this.settings;
  }

  getApiKey(provider: 'openai' /* | 'mistral' etc. */): string | null {
    if (provider === 'openai') {
      return this.settings.openAiApiKey;
    }
    return null;
  }
}
