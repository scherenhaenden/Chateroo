import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50">
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Neues Konto erstellen
          </h2>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">E-Mail-Adresse</label>
              <input
                id="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                formControlName="email"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="ihre@email.com"
              />
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <div class="text-red-500 text-sm mt-1">
                  @if (registerForm.get('email')?.errors?.['required']) {
                    E-Mail-Adresse ist erforderlich
                  }
                  @if (registerForm.get('email')?.errors?.['email']) {
                    Gültige E-Mail-Adresse erforderlich
                  }
                </div>
              }
            </div>

            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">Benutzername</label>
              <input
                id="username"
                name="username"
                type="text"
                autocomplete="username"
                required
                formControlName="username"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Benutzername"
              />
              @if (registerForm.get('username')?.invalid && registerForm.get('username')?.touched) {
                <div class="text-red-500 text-sm mt-1">
                  @if (registerForm.get('username')?.errors?.['required']) {
                    Benutzername ist erforderlich
                  }
                  @if (registerForm.get('username')?.errors?.['minlength']) {
                    Benutzername muss mindestens 3 Zeichen lang sein
                  }
                </div>
              }
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Passwort</label>
              <input
                id="password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                formControlName="password"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Passwort"
              />
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <div class="text-red-500 text-sm mt-1">
                  @if (registerForm.get('password')?.errors?.['required']) {
                    Passwort ist erforderlich
                  }
                  @if (registerForm.get('password')?.errors?.['minlength']) {
                    Passwort muss mindestens 8 Zeichen lang sein
                  }
                </div>
              }
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">Passwort bestätigen</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                formControlName="confirmPassword"
                class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Passwort bestätigen"
              />
              @if (registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched) {
                <div class="text-red-500 text-sm mt-1">
                  @if (registerForm.get('confirmPassword')?.errors?.['required']) {
                    Passwort-Bestätigung ist erforderlich
                  }
                </div>
              }
              @if (passwordsDoNotMatch()) {
                <div class="text-red-500 text-sm mt-1">
                  Passwörter stimmen nicht überein
                </div>
              }
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
              [disabled]="registerForm.invalid || passwordsDoNotMatch() || (authService.authState$ | async)?.loading"
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              @if ((authService.authState$ | async)?.loading) {
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Registrieren...
              } @else {
                Konto erstellen
              }
            </button>
          </div>

          <div class="text-center space-y-3">
            <span class="text-sm text-gray-600">
              Bereits ein Konto?
              <button
                type="button"
                (click)="switchToLogin()"
                class="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Anmelden
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
export class RegisterComponent implements OnInit {
  protected readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  protected registerForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  });

  ngOnInit() {
    // Umleitung wenn bereits angemeldet
    this.authService.authState$.subscribe(state => {
      if (state.isAuthenticated) {
        this.router.navigate(['/chat']);
      }
    });
  }

  protected passwordsDoNotMatch(): boolean {
    const password = this.registerForm.get('password')?.value;
    const confirmPassword = this.registerForm.get('confirmPassword')?.value;
    return password !== confirmPassword &&
           this.registerForm.get('confirmPassword')?.touched === true;
  }

  protected async onSubmit() {
    if (this.registerForm.valid && !this.passwordsDoNotMatch()) {
      const success = await this.authService.register(this.registerForm.value);
      if (success) {
        // Navigation erfolgt automatisch über den authState-Subscribe
      }
    }
  }

  protected switchToLogin() {
    this.router.navigate(['/login']);
  }

  protected continueWithoutLogin() {
    this.router.navigate(['/chat'], { queryParams: { guest: true } });
  }
}
