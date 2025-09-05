import { Inject, Injectable, inject } from '@angular/core';
import { STORAGE_ADAPTER, StorageAdapter } from './storage-adapter';
import { AuthService } from './auth.service';

/**
 * Application-level settings shape.
 * Describes all persisted configuration values for the application as well
 * as user-facing preferences.
 */
export interface AppSettings {
  /** API key to use when calling OpenAI-compatible providers */
  openAiApiKey: string | null;
  /** API key to use when calling OpenRouter endpoints */
  openRouterApiKey: string | null;
  /** UI theme preference: light, dark or automatic (system) */
  theme: 'light' | 'dark' | 'auto';
  /** UI language code (e.g. 'en', 'de') */
  language: string;
  /** UI base font size in pixels */
  fontSize: number;
  /**
   * Notification and feature toggles which can be personalized per user.
   * - emailNotifications: whether the user wants email notifications
   * - autoSave: whether drafts or sessions should be saved automatically
   * - chatHistory: whether chat history should be retained locally
   */
  emailNotifications: boolean;
  autoSave: boolean;
  chatHistory: boolean;
}

/**
 * User profile information stored per authenticated user.
 * Holds basic display information used across the UI.
 */
export interface UserProfile {
  /** Public display name for the user */
  displayName: string;
  /** Optional avatar URL or data URI */
  avatar: string | null;
  /** IANA timezone identifier for the user (e.g. 'Europe/Berlin') */
  timezone: string;
  /** Short free-text bio shown in the profile */
  bio: string;
}

/**
 * SettingsService
 * Responsible for loading, saving and exposing application and user-specific
 * settings. This service acts as a thin abstraction over the configured
 * StorageAdapter and integrates with AuthService to persist per-user data.
 *
 * Main responsibilities:
 * - Load global API keys and runtime preferences from storage on startup
 * - Persist changed global settings and user-specific settings
 * - Provide convenience getters for settings and API keys
 */
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

  /**
   * Construct the service with the configured storage adapter and load
   * persisted settings asynchronously. The constructor does not block —
   * callers should await `load()` if they require settings to be ready.
   *
   * @param store Injected storage adapter used to persist settings
   */
  public constructor(@Inject(STORAGE_ADAPTER) private readonly store: StorageAdapter) {
    void this.load(); // Load settings on service initialization.
  }

  /**
   * Load global API keys and minimal application settings from persistent storage.
   * This method reads known keys from the configured storage adapter and updates
   * the in-memory settings object. It is safe to call multiple times.
   *
   * Note: this method does not throw on missing keys; missing values remain null/default.
   *
   * @returns Promise that resolves once the values have been loaded into memory.
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
   * Persist a partial set of application settings to storage and reload the
   * in-memory cache afterwards.
   *
   * The method will iterate over the keys of `newSettings` and persist each
   * provided setting. After all keys are saved, it calls the storage adapter's
   * save method to flush changes, then reloads the in-memory settings so the
   * service state reflects persisted values.
   *
   * @param newSettings Partial object containing settings to be updated
   * @returns Promise that resolves when the operation (persist + reload) completes
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
   * Save user-specific settings for the currently authenticated user.
   *
   * This method merges the provided partial `userSettings` object with any
   * existing per-user settings stored under the key `user_settings_<userId>`.
   * The merged settings are persisted and the in-memory application settings
   * are updated to reflect the merged values.
   *
   * @param userSettings Partial user-level settings to persist
   * @throws Error if there is no authenticated user
   */
  public async saveUserSettings(userSettings: Partial<AppSettings>): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated to save user settings');
    }

    const userSettingsKey = `user_settings_${currentUser.id}`;
    const existingSettings = (await this.store.get<Partial<AppSettings>>(userSettingsKey)) || {};

    const updatedSettings = { ...existingSettings, ...userSettings };
    await this.store.set(userSettingsKey, updatedSettings);
    await this.store.save();

    // Update in-memory settings so callers immediately observe changes
    this.settings = { ...this.settings, ...updatedSettings };
  }

  /**
   * Load user-specific settings from storage and merge them into the in-memory
   * application settings object. If there is no authenticated user, the method
   * returns without action.
   *
   * @returns Promise that resolves once user settings have been merged (if any)
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
   * Persist the provided user profile object for the authenticated user.
   * The profile is stored under the key `user_profile_<userId>`.
   *
   * @param profile The user profile data to persist
   * @throws Error if there is no authenticated user
   */
  public async saveUserProfile(profile: UserProfile): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    const profileKey = `user_profile_${currentUser.id}`;
    await this.store.set(profileKey, profile);
    await this.store.save();
  }

  /**
   * Retrieve the stored user profile for the currently authenticated user.
   * Returns null if there is no authenticated user or no stored profile.
   *
   * @returns Promise resolving to the UserProfile or null
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
   * Clear or reset per-user data when the user logs out.
   *
   * This method currently flushes the store and resets the in-memory
   * settings to application defaults. If needed, it can be extended to
   * remove per-user keys from persistent storage as well.
   *
   * @returns Promise that resolves once cleanup and reset are complete
   */
  public async clearUserData(): Promise<void> {
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      const userSettingsKey = `user_settings_${currentUser.id}`;
      const profileKey = `user_profile_${currentUser.id}`;

      // Optional: remove per-user data from storage by uncommenting below
      // await this.store.set(userSettingsKey, null);
      // await this.store.set(profileKey, null);
      await this.store.save();
    }

    // Reset in-memory settings to application defaults
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
   * Return the complete in-memory application settings.
   * Note: callers receive a direct reference to the internal settings object.
   * If immutability is required, return a shallow copy instead.
   *
   * @returns Current AppSettings object
   */
  public getSettings(): AppSettings {
    return this.settings;
  }

  /**
   * Convenience accessor for provider-specific API keys.
   * Returns null if the provider is unknown or no key is configured.
   *
   * @param provider The provider identifier (e.g. 'openai' | 'openrouter')
   * @returns API key string or null
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
