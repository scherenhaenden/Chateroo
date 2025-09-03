import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserStorageAdapter } from './core/services/browser-storage.adapter';
import { STORAGE_ADAPTER } from './core/services/storage-adapter';
import { TauriStorageAdapter } from './core/services/tauri-storage.adapter';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    importProvidersFrom(HttpClientModule, ReactiveFormsModule),
    {
      provide: STORAGE_ADAPTER,
      useFactory: () => {
        if (typeof window !== 'undefined' && (window as any).__TAURI__) {
          return new TauriStorageAdapter();
        }
        return new BrowserStorageAdapter();
      },
    },
  ]
};
