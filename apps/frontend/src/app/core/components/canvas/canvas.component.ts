import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

/**
 * CanvasComponent
 *
 * Renders arbitrary HTML/SVG code inside a sandboxed iframe.
 */
@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.css',
})
export class CanvasComponent implements OnChanges {
  /** Raw code to render inside the iframe. */
  @Input() public codeToRender = '';

  /** Sanitized HTML marked safe for binding to [srcdoc]. */
  public safeCodeContent: SafeHtml = '';

  public constructor(private sanitizer: DomSanitizer) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if ('codeToRender' in changes) {
      const clean = DOMPurify.sanitize(this.codeToRender);
      this.safeCodeContent = this.sanitizer.bypassSecurityTrustHtml(clean);
    }
  }
}

