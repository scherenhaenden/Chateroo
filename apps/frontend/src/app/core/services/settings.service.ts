import { Inject, Injectable, InjectionToken } from '@angular/core';
import { Store } from 'tauri-plugin-store-api';

export interface AppSettings {
  openAiApiKey: string | null;
  openRouterApiKey: string | null;
  // Future settings can be added here: mistralApiKey, theme, etc.
}

export const SETTINGS_STORE = new InjectionToken<Store>('SETTINGS_STORE');

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private settings: AppSettings = {
    openAiApiKey: null,
    openRouterApiKey: null,
  };

  public constructor(@Inject(SETTINGS_STORE) private readonly store: Store) {
    void this.load(); // Load settings on service initialization.
  }

  /**
   * Loads the OpenAI API key from storage and sets it in settings if available.
   */
  public async load(): Promise<void> {
    const openAiApiKey = await this.store.get<string>('openAiApiKey');
    if (openAiApiKey) {
      this.settings.openAiApiKey = openAiApiKey;
    }
    const openRouterApiKey = await this.store.get<string>('openRouterApiKey');
    if (openRouterApiKey) {
      this.settings.openRouterApiKey = openRouterApiKey;
    }
  }

  /**
   * Updates application settings and reloads the local cache.
   *
   * This function iterates over the provided `newSettings` object,
   * updates each setting in the store, persists the changes to disk,
   * and then reloads the local settings cache.
   */
  public async save(newSettings: Partial<AppSettings>): Promise<void> {
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

  /**
   * Retrieves the application settings.
   */
  public getSettings(): AppSettings {
    return this.settings;
  }

  /**
   * Retrieves the API key for the specified provider.
   */
  public getApiKey(provider: string): string | null {
    if (provider === 'openai') {
      return this.settings.openAiApiKey;
    }
    if (provider === 'openrouter') {
      return this.settings.openRouterApiKey;
    }
    return null;
  }
}
