import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center space-x-8">
            <!-- Logo -->
            <div class="flex-shrink-0">
              <h1 class="text-xl font-bold text-indigo-600">Chateroo</h1>
            </div>

            <!-- Navigation Links -->
            <div class="flex space-x-4">
              <a
                routerLink="/chat"
                routerLinkActive="bg-indigo-100 text-indigo-700"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Chat
              </a>
              <a
                routerLink="/settings"
                routerLinkActive="bg-indigo-100 text-indigo-700"
                class="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Einstellungen
              </a>
            </div>
          </div>

          <!-- User Menu -->
          <div class="flex items-center space-x-4">
            @if (authService.isAuthenticated) {
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-700">
                  Hallo, {{ authService.currentUser?.username || 'Benutzer' }}
                </span>
                <button
                  (click)="logout()"
                  class="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md"
                >
                  Abmelden
                </button>
              </div>
            } @else {
              <div class="flex items-center space-x-2">
                <span class="text-sm text-gray-500">Gast-Modus</span>
                <button
                  (click)="navigateToLogin()"
                  class="px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
                >
                  Anmelden
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </nav>
  `
})
export class NavigationComponent {
  public readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  public navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  public async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/chat']);
  }
}
