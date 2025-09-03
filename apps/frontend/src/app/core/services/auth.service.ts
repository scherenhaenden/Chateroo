import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageAdapter, STORAGE_ADAPTER } from './storage-adapter';
import { AuthState, User, AuthSession, LoginCredentials, RegisterCredentials } from '../../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storageAdapter = inject(STORAGE_ADAPTER);
  private readonly authState = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    session: null,
    loading: false,
    error: null
  });

  private readonly AUTH_SESSION_KEY = 'auth_session';
  private readonly USER_PREFERENCES_KEY = 'user_preferences';
  private readonly REMEMBER_EMAIL_KEY = 'remember_email';

  public readonly authState$ = this.authState.asObservable();

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth(): Promise<void> {
    try {
      this.setLoading(true);
      const session = await this.getStoredSession();

      if (session && this.isSessionValid(session)) {
        this.setAuthenticatedState(session.user, session);
      } else {
        await this.clearStoredSession();
      }
    } catch (error) {
      console.error('Fehler beim Initialisieren der Authentifizierung:', error);
      this.setError('Fehler beim Laden der Sitzung');
    } finally {
      this.setLoading(false);
    }
  }

  public async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      // Hier würden Sie normalerweise einen API-Call machen
      // Für Demo-Zwecke simuliere ich eine erfolgreiche Anmeldung
      const mockUser: User = {
        id: crypto.randomUUID(),
        email: credentials.email,
        username: credentials.email.split('@')[0],
        createdAt: new Date(),
        lastLogin: new Date()
      };

      const mockSession: AuthSession = {
        user: mockUser,
        token: this.generateMockToken(),
        refreshToken: this.generateMockToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Stunden
      };

      await this.storeSession(mockSession);

      if (credentials.rememberMe) {
        await this.rememberEmail(credentials.email);
      } else {
        await this.clearRememberedEmail();
      }

      this.setAuthenticatedState(mockUser, mockSession);
      return true;
    } catch (error) {
      console.error('Login-Fehler:', error);
      this.setError('Anmeldung fehlgeschlagen');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  public async register(credentials: RegisterCredentials): Promise<boolean> {
    try {
      this.setLoading(true);
      this.clearError();

      if (credentials.password !== credentials.confirmPassword) {
        this.setError('Passwörter stimmen nicht überein');
        return false;
      }

      // Hier würden Sie normalerweise einen API-Call machen
      const mockUser: User = {
        id: crypto.randomUUID(),
        email: credentials.email,
        username: credentials.username,
        createdAt: new Date(),
        lastLogin: new Date()
      };

      const mockSession: AuthSession = {
        user: mockUser,
        token: this.generateMockToken(),
        refreshToken: this.generateMockToken(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };

      await this.storeSession(mockSession);
      this.setAuthenticatedState(mockUser, mockSession);
      return true;
    } catch (error) {
      console.error('Registrierungs-Fehler:', error);
      this.setError('Registrierung fehlgeschlagen');
      return false;
    } finally {
      this.setLoading(false);
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.clearStoredSession();
      this.setUnauthenticatedState();
    } catch (error) {
      console.error('Logout-Fehler:', error);
      this.setError('Fehler beim Abmelden');
    }
  }

  public async getRememberedEmail(): Promise<string | null> {
    return await this.storageAdapter.get<string>(this.REMEMBER_EMAIL_KEY);
  }

  public async updateUserPreferences(preferences: any): Promise<void> {
    try {
      await this.storageAdapter.set(this.USER_PREFERENCES_KEY, preferences);
      await this.storageAdapter.save();
    } catch (error) {
      console.error('Fehler beim Speichern der Benutzereinstellungen:', error);
    }
  }

  public async getUserPreferences<T>(): Promise<T | null> {
    return await this.storageAdapter.get<T>(this.USER_PREFERENCES_KEY);
  }

  private async storeSession(session: AuthSession): Promise<void> {
    await this.storageAdapter.set(this.AUTH_SESSION_KEY, session);
    await this.storageAdapter.save();
  }

  private async getStoredSession(): Promise<AuthSession | null> {
    const session = await this.storageAdapter.get<AuthSession>(this.AUTH_SESSION_KEY);
    if (session) {
      // Deserialisiere Datum-Strings zurück zu Date-Objekten
      session.user.createdAt = new Date(session.user.createdAt);
      session.user.lastLogin = new Date(session.user.lastLogin);
      session.expiresAt = new Date(session.expiresAt);
    }
    return session;
  }

  private async clearStoredSession(): Promise<void> {
    await this.storageAdapter.set(this.AUTH_SESSION_KEY, null);
    await this.storageAdapter.save();
  }

  private async rememberEmail(email: string): Promise<void> {
    await this.storageAdapter.set(this.REMEMBER_EMAIL_KEY, email);
    await this.storageAdapter.save();
  }

  private async clearRememberedEmail(): Promise<void> {
    await this.storageAdapter.set(this.REMEMBER_EMAIL_KEY, null);
    await this.storageAdapter.save();
  }

  private isSessionValid(session: AuthSession): boolean {
    return new Date() < new Date(session.expiresAt);
  }

  private generateMockToken(): string {
    return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
  }

  private setAuthenticatedState(user: User, session: AuthSession): void {
    this.authState.next({
      isAuthenticated: true,
      user,
      session,
      loading: false,
      error: null
    });
  }

  private setUnauthenticatedState(): void {
    this.authState.next({
      isAuthenticated: false,
      user: null,
      session: null,
      loading: false,
      error: null
    });
  }

  private setLoading(loading: boolean): void {
    this.authState.next({
      ...this.authState.value,
      loading
    });
  }

  private setError(error: string): void {
    this.authState.next({
      ...this.authState.value,
      error,
      loading: false
    });
  }

  private clearError(): void {
    this.authState.next({
      ...this.authState.value,
      error: null
    });
  }

  // Hilfsmethoden für einfachen Zugriff
  public get currentUser(): User | null {
    return this.authState.value.user;
  }

  public get isAuthenticated(): boolean {
    return this.authState.value.isAuthenticated;
  }

  public get isLoading(): boolean {
    return this.authState.value.loading;
  }
}
