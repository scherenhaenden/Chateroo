import { Inject, Injectable, inject } from '@angular/core';
import { STORAGE_ADAPTER, StorageAdapter } from './storage-adapter';
import { AuthService } from './auth.service';

export interface AppSettings {
  openAiApiKey: string | null;
  openRouterApiKey: string | null;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  fontSize: number;
  // Benutzer-spezifische Einstellungen
  emailNotifications: boolean;
  autoSave: boolean;
  chatHistory: boolean;
}

export interface UserProfile {
  displayName: string;
  avatar: string | null;
  timezone: string;
  bio: string;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly authService = inject(AuthService);

  private settings: AppSettings = {
    openAiApiKey: null,
    openRouterApiKey: null,
    theme: 'auto',
    language: 'de',
    fontSize: 14,
    emailNotifications: true,
    autoSave: true,
    chatHistory: true,
  };

  public constructor(@Inject(STORAGE_ADAPTER) private readonly store: StorageAdapter) {
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
   * Speichert benutzer-spezifische Einstellungen sicher
   */
  public async saveUserSettings(userSettings: Partial<AppSettings>): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('Benutzer muss angemeldet sein, um Einstellungen zu speichern');
    }

    const userSettingsKey = `user_settings_${currentUser.id}`;
    const existingSettings = (await this.store.get<Partial<AppSettings>>(userSettingsKey)) || {};

    const updatedSettings = { ...existingSettings, ...userSettings };
    await this.store.set(userSettingsKey, updatedSettings);
    await this.store.save();

    // Lokale Einstellungen aktualisieren
    this.settings = { ...this.settings, ...updatedSettings };
  }

  /**
   * Lädt benutzer-spezifische Einstellungen
   */
  public async loadUserSettings(): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const userSettingsKey = `user_settings_${currentUser.id}`;
      const userSettings = await this.store.get<Partial<AppSettings>>(userSettingsKey);
      if (userSettings) {
        this.settings = { ...this.settings, ...userSettings };
      }
    }
  }

  /**
   * Speichert das Benutzerprofil
   */
  public async saveUserProfile(profile: UserProfile): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('Benutzer muss angemeldet sein');
    }

    const profileKey = `user_profile_${currentUser.id}`;
    await this.store.set(profileKey, profile);
    await this.store.save();
  }

  /**
   * Lädt das Benutzerprofil
   */
  public async getUserProfile(): Promise<UserProfile | null> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      return null;
    }

    const profileKey = `user_profile_${currentUser.id}`;
    return await this.store.get<UserProfile>(profileKey);
  }

  /**
   * Löscht alle benutzer-spezifischen Daten beim Logout
   */
  public async clearUserData(): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const userSettingsKey = `user_settings_${currentUser.id}`;
      const profileKey = `user_profile_${currentUser.id}`;

      // Optional: Daten behalten oder löschen
      // await this.store.set(userSettingsKey, null);
      // await this.store.set(profileKey, null);
      await this.store.save();
    }

    // Auf Standard-Einstellungen zurücksetzen
    this.settings = {
      openAiApiKey: null,
      openRouterApiKey: null,
      theme: 'auto',
      language: 'de',
      fontSize: 14,
      emailNotifications: true,
      autoSave: true,
      chatHistory: true,
    };
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
