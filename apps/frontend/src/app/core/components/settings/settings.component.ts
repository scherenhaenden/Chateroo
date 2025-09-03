import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { SettingsService, UserProfile } from '../../services/settings.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  public readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);

  public settingsForm!: FormGroup;
  public profileForm!: FormGroup;
  public apiKeysForm!: FormGroup;
  public userProfile: UserProfile | null = null;

  public constructor() {
    this.initializeForms();
  }

  private initializeForms(): void {
    this.settingsForm = this.fb.group({
      theme: ['auto'],
      language: ['de'],
      fontSize: [14],
      emailNotifications: [true],
      autoSave: [true],
      chatHistory: [true]
    });

    this.profileForm = this.fb.group({
      displayName: ['', [Validators.required]],
      bio: [''],
      timezone: ['Europe/Berlin']
    });

    this.apiKeysForm = this.fb.group({
      openAiApiKey: [''],
      openRouterApiKey: ['']
    });
  }

  public async ngOnInit(): Promise<void> {
    await this.loadSettings();
    await this.loadUserProfile();

    // Auth-State überwachen
    this.authService.authState$.subscribe(state => {
      if (state.isAuthenticated) {
        this.loadUserProfile();
      }
    });
  }

  private async loadSettings(): Promise<void> {
    await this.settingsService.load();
    const currentSettings = this.settingsService.getSettings();

    this.settingsForm.patchValue({
      theme: currentSettings.theme || 'auto',
      language: currentSettings.language || 'de',
      fontSize: currentSettings.fontSize || 14,
      emailNotifications: currentSettings.emailNotifications ?? true,
      autoSave: currentSettings.autoSave ?? true,
      chatHistory: currentSettings.chatHistory ?? true
    });

    this.apiKeysForm.patchValue({
      openAiApiKey: currentSettings.openAiApiKey || '',
      openRouterApiKey: currentSettings.openRouterApiKey || ''
    });
  }

  private async loadUserProfile(): Promise<void> {
    if (this.authService.isAuthenticated) {
      this.userProfile = await this.settingsService.getUserProfile();
      if (this.userProfile) {
        this.profileForm.patchValue({
          displayName: this.userProfile.displayName || this.authService.currentUser?.username || '',
          bio: this.userProfile.bio || '',
          timezone: this.userProfile.timezone || 'Europe/Berlin'
        });
      } else {
        // Standard-Profil für neue Benutzer
        this.profileForm.patchValue({
          displayName: this.authService.currentUser?.username || '',
          bio: '',
          timezone: 'Europe/Berlin'
        });
      }
    }
  }

  public async saveSettings(): Promise<void> {
    if (this.settingsForm.invalid) return;

    try {
      if (this.authService.isAuthenticated) {
        await this.settingsService.saveUserSettings(this.settingsForm.value);
      } else {
        await this.settingsService.save(this.settingsForm.value);
      }
      alert('Einstellungen gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern der Einstellungen:', error);
      alert('Fehler beim Speichern der Einstellungen');
    }
  }

  public async saveProfile(): Promise<void> {
    if (this.profileForm.invalid || !this.authService.isAuthenticated) return;

    try {
      await this.settingsService.saveUserProfile(this.profileForm.value);
      this.userProfile = this.profileForm.value;
      alert('Profil gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern des Profils:', error);
      alert('Fehler beim Speichern des Profils');
    }
  }

  public async saveApiKeys(): Promise<void> {
    if (this.apiKeysForm.invalid) return;

    try {
      if (this.authService.isAuthenticated) {
        await this.settingsService.saveUserSettings(this.apiKeysForm.value);
      } else {
        await this.settingsService.save(this.apiKeysForm.value);
      }
      alert('API-Schlüssel gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern der API-Schlüssel:', error);
      alert('Fehler beim Speichern der API-Schlüssel');
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.settingsService.clearUserData();
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Fehler beim Abmelden:', error);
    }
  }

  public navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  public navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
