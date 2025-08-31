import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * CopyBoxComponent
 *
 * Displays a block of code or text with copy and edit capabilities.
 * Emits content changes for live preview.
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
  /** Emits updated content when editing for live preview. */
  @Output() public contentChange = new EventEmitter<string>();

  /** Tracks whether the component is in edit mode. */
  public isEditing = false;
  /** Tracks whether copy feedback should be shown. */
  public copied = false;
  /** Internal editable state of the content. */
  public editableContent = '';
  /** Original content used for restore. */
  private originalContent = '';

  public ngOnInit(): void {
    this.originalContent = this.content;
    this.editableContent = this.content;
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
      this.contentChange.emit(this.content);
    }
  }

  /** Emits content changes during editing. */
  public onInput(): void {
    this.contentChange.emit(this.editableContent);
  }

  /** Restores the original content provided by the AI. */
  public restore(): void {
    this.editableContent = this.originalContent;
    this.content = this.originalContent;
    this.isEditing = false;
    this.contentChange.emit(this.content);
  }
}

