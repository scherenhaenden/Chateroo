import { Component, Input, OnChanges, SimpleChanges, OnDestroy, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { CodeSessionStorageService, CodeSession } from '../../services/code-session-storage.service';
import { debounceTime, Subject, takeUntil } from 'rxjs';

/**
 * LiveCodeComponent
 *
 * Renders and executes code in real-time with syntax highlighting and preview
 */
@Component({
  selector: 'app-live-code',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-code.component.html',
  styleUrls: ['./live-code.component.css']
})
export class LiveCodeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() public code = '';
  @Input() public language = 'javascript';

  public highlightedCode: SafeHtml = '';
  public output: string = '';
  public error: string = '';
  public isRunning = false;

  // Session management
  public currentSession: CodeSession | null = null;
  public sessions: CodeSession[] = [];
  public showSessionMenu = false;

  private worker?: Worker;
  private destroy$ = new Subject<void>();
  private autoSave$ = new Subject<void>();

  public constructor(
    private sanitizer: DomSanitizer,
    private codeStorage: CodeSessionStorageService
  ) {}

  public ngOnInit(): void {
    // Subscribe to sessions
    this.codeStorage.sessions$
      .pipe(takeUntil(this.destroy$))
      .subscribe(sessions => {
        this.sessions = sessions;

        // If we don't have a current session but there are saved sessions,
        // load the most recent one
        if (!this.currentSession && sessions.length > 0) {
          this.loadSession(sessions[0]); // Most recent session
        } else if (!this.currentSession && sessions.length === 0) {
          // Only create a new session if there are no saved sessions
          this.createNewSession();
        }
      });

    // Auto-save debounced
    this.autoSave$
      .pipe(
        debounceTime(2000), // Wait 2 seconds after last change
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.autoSaveSession();
      });

    // Don't create initial session here - let the sessions$ subscription handle it
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('code' in changes && this.code) {
      this.highlightCode();
      this.executeCode();
      this.triggerAutoSave();
    }
  }

  public ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Close session menu when clicking outside
  @HostListener('document:click', ['$event'])
  public onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.relative')) {
      this.showSessionMenu = false;
    }
  }

  private highlightCode(): void {
    // Básico highlighting - en producción usarías Prism.js o highlight.js
    const escapedCode = this.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    this.highlightedCode = this.sanitizer.bypassSecurityTrustHtml(
      `<pre><code class="language-${this.language}">${escapedCode}</code></pre>`
    );
  }

  private executeCode(): void {
    if (this.language === 'javascript') {
      this.executeJavaScript();
    } else if (this.language === 'html') {
      this.executeHTML();
    } else if (this.language === 'css') {
      this.executeCSS();
    }
  }

  private executeJavaScript(): void {
    this.isRunning = true;
    this.error = '';
    this.output = '';

    try {
      // Crear un sandbox seguro para ejecutar el código
      const originalConsoleLog = console.log;
      const logs: string[] = [];

      console.log = (...args) => {
        logs.push(args.map(arg => String(arg)).join(' '));
      };

      // Ejecutar el código en un contexto limitado
      const result = new Function(this.code)();

      console.log = originalConsoleLog;

      if (logs.length > 0) {
        this.output = logs.join('\n');
      } else if (result !== undefined) {
        this.output = String(result);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : String(err);
    } finally {
      this.isRunning = false;
    }
  }

  private executeHTML(): void {
    // Para HTML, simplemente mostramos el resultado renderizado
    this.output = this.code;
  }

  private executeCSS(): void {
    // Para CSS, creamos un ejemplo visual
    this.output = `<div style="${this.code}">CSS Preview</div>`;
  }

  public runCode(): void {
    this.executeCode();
    this.triggerAutoSave();
  }

  // Session Management Methods
  public createNewSession(): void {
    const newSession: CodeSession = {
      id: this.codeStorage.generateSessionId(),
      title: this.codeStorage.generateSessionTitle(this.code, this.language),
      code: this.code || '// Start coding here...',
      language: this.language,
      output: this.output,
      error: this.error,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.currentSession = newSession;
    this.codeStorage.saveSession(newSession);
    this.showSessionMenu = false;
  }

  public loadSession(session: CodeSession): void {
    this.currentSession = session;
    this.code = session.code;
    this.language = session.language;
    this.output = session.output;
    this.error = session.error;
    this.highlightCode();
    this.showSessionMenu = false;
  }

  public async deleteSession(sessionId: string, event?: Event): Promise<void> {
    if (event) {
      event.stopPropagation();
    }

    if (confirm('¿Estás seguro de que quieres eliminar esta sesión?')) {
      await this.codeStorage.deleteSession(sessionId);

      // If current session was deleted, create a new one
      if (this.currentSession?.id === sessionId) {
        this.createNewSession();
      }
    }
  }

  public toggleSessionMenu(): void {
    this.showSessionMenu = !this.showSessionMenu;
  }

  public getSessionPreview(session: CodeSession): string {
    return session.code.length > 50 ?
      session.code.substring(0, 50) + '...' :
      session.code || 'Empty session';
  }

  public formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private triggerAutoSave(): void {
    this.autoSave$.next();
  }

  private async autoSaveSession(): Promise<void> {
    if (!this.currentSession) {
      this.createNewSession();
      return;
    }

    const updatedSession: CodeSession = {
      ...this.currentSession,
      code: this.code,
      language: this.language,
      output: this.output,
      error: this.error,
      title: this.codeStorage.generateSessionTitle(this.code, this.language),
      updatedAt: new Date()
    };

    this.currentSession = updatedSession;
    await this.codeStorage.saveSession(updatedSession);
  }
}
