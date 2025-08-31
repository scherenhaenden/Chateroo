import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Bei Ihrem Konto anmelden
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Oder
            <button
              type="button"
              (click)="continueWithoutLogin()"
              class="font-medium text-indigo-600 hover:text-indigo-500"
            >
              ohne Anmeldung fortfahren
            </button>
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="loginForm" (ngSubmit)="onSubmit()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <label for="email" class="sr-only">E-Mail-Adresse</label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                formControlName="email"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="E-Mail-Adresse"
              />
              @if (loginForm.get('email')?.invalid && loginForm.get('email')?.touched) {
                <div class="text-red-500 text-sm mt-1">
                  Gültige E-Mail-Adresse erforderlich
                </div>
              }
            </div>
            <div>
              <label for="password" class="sr-only">Passwort</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                formControlName="password"
                class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Passwort"
              />
              @if (loginForm.get('password')?.invalid && loginForm.get('password')?.touched) {
                <div class="text-red-500 text-sm mt-1">
                  Passwort erforderlich
                </div>
              }
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                formControlName="rememberMe"
                class="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-900">
                E-Mail merken
              </label>
            </div>
            <div class="text-sm">
              <a href="#" class="font-medium text-indigo-600 hover:text-indigo-500">
                Passwort vergessen?
              </a>
            </div>
          </div>

          @if (authService.authState$ | async; as authState) {
            @if (authState.error) {
              <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {{ authState.error }}
              </div>
            }
          }

          <div>
            <button
              type="submit"
              [disabled]="loginForm.invalid || (authService.authState$ | async)?.loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if ((authService.authState$ | async)?.loading) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Anmelden...
              } @else {
                Anmelden
              }
            </button>
          </div>

          <div class="text-center space-y-3">
            <span class="text-sm text-gray-600">
              Noch kein Konto?
              <button
                type="button"
                (click)="switchToRegister()"
                class="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Registrieren
              </button>
            </span>

            <!-- Direkter Chat-Zugang -->
            <div class="pt-4 border-t border-gray-200">
              <button
                type="button"
                (click)="continueWithoutLogin()"
                class="w-full px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700"
              >
                Direkt zum Chat (ohne Anmeldung)
              </button>
              <p class="mt-2 text-xs text-gray-500">
                Perfekt für LM Studio oder andere lokale Models
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    rememberMe: [false]
  });

  ngOnInit() {
    this.loadRememberedEmail();

    // Umleitung wenn bereits angemeldet
    this.authService.authState$.subscribe(state => {
      if (state.isAuthenticated) {
        // Zur vorherigen Seite oder zu /chat navigieren
        this.router.navigate(['/chat']);
      }
    });
  }

  private async loadRememberedEmail() {
    const rememberedEmail = await this.authService.getRememberedEmail();
    if (rememberedEmail) {
      this.loginForm.patchValue({
        email: rememberedEmail,
        rememberMe: true
      });
    }
  }

  protected async onSubmit() {
    if (this.loginForm.valid) {
      const success = await this.authService.login(this.loginForm.value);
      if (success) {
        // Navigation erfolgt automatisch über den authState-Subscribe
      }
    }
  }

  protected switchToRegister() {
    this.router.navigate(['/register']);
  }

  protected continueWithoutLogin() {
    this.router.navigate(['/chat']);
  }
}
