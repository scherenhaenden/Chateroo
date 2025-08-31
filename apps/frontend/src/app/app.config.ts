import {
  ApplicationConfig,
  importProvidersFrom,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { Store } from 'tauri-plugin-store-api';

import { SETTINGS_STORE } from './core/services/settings.service';

import { routes } from './app.routes';

/**
 * Creates a settings store. When running inside a Tauri environment the
 * `tauri-plugin-store` is used. If the plugin is unavailable (e.g. when the
 * application is executed in a regular browser) a lightweight in-memory
 * fallback is returned instead. This prevents the application from crashing
 * immediately after launch when the Tauri APIs are missing.
 */
function createSettingsStore(): Store {
  try {
    // If the Tauri API is available, use the real store implementation.
    if (typeof window !== 'undefined' && '__TAURI__' in window) {
      return new Store('.settings.dat');
    }
  } catch {
    // Fall through to the fallback store below.
  }

  // Fallback implementation using the browser's localStorage. Only the
  // methods used by the application are implemented.
  const fallback = {
    async get<T>(key: string): Promise<T | null> {
      const value = localStorage.getItem(key);
      return value ? (JSON.parse(value) as T) : null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      localStorage.setItem(key, JSON.stringify(value));
    },
    async save(): Promise<void> {
      // No persistence step required for localStorage.
    },
  } as unknown as Store;

  return fallback;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(HttpClientModule, ReactiveFormsModule),
    {
      provide: SETTINGS_STORE,
      useFactory: createSettingsStore,
    },
  ],
};
