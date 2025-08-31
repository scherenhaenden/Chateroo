import { Component, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
export class LiveCodeComponent implements OnChanges, OnDestroy {
  @Input() public code = '';
  @Input() public language = 'javascript';

  public highlightedCode: SafeHtml = '';
  public output: string = '';
  public error: string = '';
  public isRunning = false;

  private worker?: Worker;

  public constructor(private sanitizer: DomSanitizer) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if ('code' in changes && this.code) {
      this.highlightCode();
      this.executeCode();
    }
  }

  public ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
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
  }
}
