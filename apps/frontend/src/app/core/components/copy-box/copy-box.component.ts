import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import DOMPurify from 'dompurify';

/**
 * CopyBoxComponent
 *
 * Displays a block of code or text with copy and edit capabilities.
 * Optionally renders a live preview for renderable languages (HTML, SVG).
 */
@Component({
  selector: 'app-copy-box',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './copy-box.component.html',
  styleUrl: './copy-box.component.css',
})
export class CopyBoxComponent implements OnInit {
  /** The code or text content to display. */
  @Input() public content = '';
  /** The language or type of the content (e.g., 'html', 'bash'). */
  @Input() public language = '';

  /** Tracks whether the component is in edit mode. */
  public isEditing = false;
  /** Tracks whether copy feedback should be shown. */
  public copied = false;
  /** Internal editable state of the content. */
  public editableContent = '';
  /** Original content used for restore. */
  private originalContent = '';
  /** Sanitized iframe srcdoc for preview. */
  public iframeContent = '';

  /** Whether the content should render a preview canvas. */
  public get renderable(): boolean {
    return ['html', 'svg'].includes(this.language.toLowerCase());
  }

  public ngOnInit(): void {
    this.originalContent = this.content;
    this.editableContent = this.content;
    this.updatePreview();
  }

  /** Copies the current content to the clipboard. */
  public async copy(): Promise<void> {
    const text = this.isEditing ? this.editableContent : this.content;
    try {
      await navigator.clipboard.writeText(text);
      this.copied = true;
      setTimeout(() => (this.copied = false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  }

  /** Toggles edit mode. */
  public toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.content = this.editableContent;
    }
    this.updatePreview();
  }

  /** Restores the original content provided by the AI. */
  public restore(): void {
    this.editableContent = this.originalContent;
    this.content = this.originalContent;
    this.isEditing = false;
    this.updatePreview();
  }

  /** Updates the preview iframe with sanitized content. */
  public updatePreview(): void {
    if (this.renderable) {
      const src = this.isEditing ? this.editableContent : this.content;
      this.iframeContent = DOMPurify.sanitize(src);
    }
  }
}
